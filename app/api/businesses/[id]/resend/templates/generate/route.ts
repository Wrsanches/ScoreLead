import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { rateLimit } from "@/lib/rate-limit"
import { brandThemeFromBusiness } from "@/lib/emails/blocks/theme"
import { getEmailComponents } from "@/lib/resend/components"
import { buildPreviewContext } from "@/lib/resend/render"
import { renderTemplate } from "@/lib/resend/render-template"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { emailTemplateDraftRequestSchema, generateEmailTemplateDrafts } from "@/lib/services/email-template-draft"

export const maxDuration = 60

/** Three AI-drafted emails (plus shared-component proposals when none exist), each with a rendered preview. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error

  const limit = rateLimit(`resend:generate:${scoped.session.user.id}`, 5, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many drafts in a short time", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    )
  }

  const parsed = emailTemplateDraftRequestSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI drafting is not configured", code: "AI_NOT_CONFIGURED" }, { status: 503 })
  }

  const [biz] = await db.select().from(business).where(eq(business.id, id)).limit(1)
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 })

  const components = await getEmailComponents(id)
  const proposeComponents = parsed.data.proposeComponents && !components.header && !components.footer

  try {
    const generated = await generateEmailTemplateDrafts(
      {
        name: biz.name, description: biz.description, persona: biz.persona, clientPersona: biz.clientPersona,
        field: biz.field, category: biz.category, tags: biz.tags, location: biz.location, language: biz.language,
        website: biz.website, instagram: biz.instagram, facebook: biz.facebook, linkedin: biz.linkedin,
        services: biz.services, serviceArea: biz.serviceArea, brandStyle: biz.brandStyle, businessModel: biz.businessModel,
        logo: biz.logo, brandColorPrimary: biz.brandColorPrimary, brandColorSecondary: biz.brandColorSecondary,
      },
      { ...parsed.data, proposeComponents },
    )
    const deps = { components: generated.components ?? components, theme: brandThemeFromBusiness(biz), lang: biz.language?.slice(0, 2) || "en" }
    const connection = scoped.connection
    const ctx = buildPreviewContext({ business: biz, sender: { name: scoped.session.user.name || connection?.fromName || "", email: connection?.fromEmail || "" } })
    const drafts = await Promise.all(
      generated.drafts.map(async (draft) => {
        const rendered = await renderTemplate({ subject: draft.subject, bodyMode: "blocks", bodyDoc: draft.doc, bodyHtml: "" }, deps, ctx)
        return { ...draft, previewHtml: rendered.html }
      }),
    )
    return NextResponse.json({ drafts, components: generated.components })
  } catch (error) {
    console.error("[resend] template draft generation failed", error)
    return NextResponse.json({ error: "Could not generate the emails", code: "AI_FAILED" }, { status: 502 })
  }
}
