import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import {
  generateWhatsAppTemplateDraft,
  whatsappTemplateDraftRequestSchema,
} from "@/lib/services/whatsapp-template-draft"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error

  const body = await request.json().catch(() => null)
  const parsed = whatsappTemplateDraftRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    )
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI template generation is not configured" },
      { status: 503 },
    )
  }

  const [profile] = await db
    .select({
      name: business.name,
      description: business.description,
      persona: business.persona,
      clientPersona: business.clientPersona,
      field: business.field,
      category: business.category,
      tags: business.tags,
      location: business.location,
      language: business.language,
      website: business.website,
      instagram: business.instagram,
      facebook: business.facebook,
      linkedin: business.linkedin,
      services: business.services,
      serviceArea: business.serviceArea,
      brandStyle: business.brandStyle,
      businessModel: business.businessModel,
    })
    .from(business)
    .where(eq(business.id, id))
    .limit(1)

  if (!profile) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  try {
    const template = await generateWhatsAppTemplateDraft(profile, parsed.data)
    return NextResponse.json({ template })
  } catch (error) {
    console.error("[whatsapp-template-ai] generation failed", error)
    return NextResponse.json(
      { error: "Could not generate the WhatsApp template" },
      { status: 502 },
    )
  }
}
