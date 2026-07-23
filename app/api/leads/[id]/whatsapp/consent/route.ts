import { randomUUID } from "node:crypto"
import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { whatsappConsentEvent } from "@/lib/db/schema"
import { getOwnedLead, getViewableLead } from "@/lib/whatsapp/data"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { isE164 } from "@/lib/whatsapp/security"
import { WHATSAPP_CONSENT_SOURCES } from "@/lib/whatsapp/types"

const schema = z.object({
  phoneE164: z.string(),
  source: z.enum(WHATSAPP_CONSENT_SOURCES),
  capturedAt: z.string().datetime(),
  evidenceReference: z.string().trim().max(500).optional().nullable(),
  evidenceNote: z.string().trim().max(2000).optional().nullable(),
  attested: z.literal(true),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const viewable = await getViewableLead(id, session.user.id)
  if (!viewable) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
  if (
    !viewable.access.isPlatformAdmin &&
    !hasWhatsAppEarlyAccess(viewable.access.ownerEmail)
  ) {
    return NextResponse.json(
      { error: "WhatsApp integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
      { status: 403 },
    )
  }
  const history = await db
    .select()
    .from(whatsappConsentEvent)
    .where(eq(whatsappConsentEvent.leadId, id))
    .orderBy(desc(whatsappConsentEvent.createdAt))
    .limit(20)
  return NextResponse.json({ consent: history[0] ?? null, history })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasWhatsAppEarlyAccess(session.user.email)) {
    return NextResponse.json(
      { error: "WhatsApp integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
      { status: 403 },
    )
  }
  const { id } = await params
  const ownedLead = await getOwnedLead(id, session.user.id)
  if (!ownedLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !isE164(parsed.data.phoneE164)) {
    return NextResponse.json({ error: "Enter a valid E.164 phone number and consent evidence" }, { status: 400 })
  }
  const capturedAt = new Date(parsed.data.capturedAt)
  if (capturedAt > new Date(Date.now() + 5 * 60_000)) {
    return NextResponse.json({ error: "Consent timestamp cannot be in the future" }, { status: 400 })
  }
  const event = {
    id: randomUUID(),
    businessId: ownedLead.businessId,
    leadId: ownedLead.id,
    recordedByUserId: session.user.id,
    phoneE164: parsed.data.phoneE164,
    status: "granted",
    purpose: "marketing",
    source: parsed.data.source,
    capturedAt,
    evidenceReference: parsed.data.evidenceReference || null,
    evidenceNote: parsed.data.evidenceNote || null,
    createdAt: new Date(),
  }
  await db.insert(whatsappConsentEvent).values(event)
  return NextResponse.json({ consent: event }, { status: 201 })
}
