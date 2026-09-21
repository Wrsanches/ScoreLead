import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { rateLimit } from "@/lib/rate-limit"
import { EMAIL_COMPONENT_KINDS } from "@/lib/resend/blocks"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { generateEmailComponents } from "@/lib/services/email-template-draft"

export const maxDuration = 60

const schema = z.object({ kinds: z.array(z.enum(EMAIL_COMPONENT_KINDS)).min(1).max(3).optional() })

/** AI copy for shared components. Returns proposals only; the client saves them with PUT. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const limit = rateLimit(`resend:components-generate:${scoped.session.user.id}`, 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests", code: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } })
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI drafting is not configured", code: "AI_NOT_CONFIGURED" }, { status: 503 })
  }
  const [biz] = await db.select().from(business).where(eq(business.id, id)).limit(1)
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 })
  try {
    const components = await generateEmailComponents(
      {
        name: biz.name, description: biz.description, persona: biz.persona, clientPersona: biz.clientPersona,
        field: biz.field, category: biz.category, tags: biz.tags, location: biz.location, language: biz.language,
        website: biz.website, instagram: biz.instagram, facebook: biz.facebook, linkedin: biz.linkedin,
        services: biz.services, serviceArea: biz.serviceArea, brandStyle: biz.brandStyle, businessModel: biz.businessModel,
        logo: biz.logo, brandColorPrimary: biz.brandColorPrimary, brandColorSecondary: biz.brandColorSecondary,
      },
      parsed.data.kinds ?? EMAIL_COMPONENT_KINDS,
    )
    return NextResponse.json({ components })
  } catch (error) {
    console.error("[resend] component draft generation failed", error)
    return NextResponse.json({ error: "Could not generate the components", code: "AI_FAILED" }, { status: 502 })
  }
}
