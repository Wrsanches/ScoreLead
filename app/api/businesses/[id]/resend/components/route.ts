import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { brandThemeFromBusiness } from "@/lib/emails/blocks/theme"
import { emailComponentsUpdateSchema } from "@/lib/resend/blocks"
import { getEmailComponents, upsertEmailComponents } from "@/lib/resend/components"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { resolveLanguageLabel } from "@/lib/services/content-calendar-generator"
import { buildPreviewContext } from "@/lib/resend/render"

/** Shared header/footer plus the brand theme the builder renders with. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "view", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const [biz] = await db
    .select({ brandColorPrimary: business.brandColorPrimary, brandColorSecondary: business.brandColorSecondary, brandColors: business.brandColors, brandFonts: business.brandFonts, brandStyle: business.brandStyle, logo: business.logo, productImages: business.productImages, name: business.name, language: business.language, website: business.website, services: business.services, location: business.location })
    .from(business)
    .where(eq(business.id, id))
    .limit(1)
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 })
  const connection = scoped.connection
  const previewContext = buildPreviewContext({
    business: biz,
    sender: { name: scoped.session.user.name || connection?.fromName || "", email: connection?.fromEmail || "" },
  })
  return NextResponse.json(
    { components: await getEmailComponents(id), theme: brandThemeFromBusiness(biz), logo: biz.logo, productImages: (biz.productImages ?? []).filter((img) => img.url), businessName: biz.name, languageLabel: resolveLanguageLabel(biz.language), previewContext },
    { headers: { "Cache-Control": "no-store" } },
  )
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const parsed = emailComponentsUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  const components = await upsertEmailComponents(id, parsed.data, scoped.session.user.id)
  return NextResponse.json({ components })
}
