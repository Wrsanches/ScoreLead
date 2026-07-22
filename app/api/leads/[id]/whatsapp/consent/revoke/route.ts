import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { whatsappConsentEvent } from "@/lib/db/schema"
import { getLatestWhatsAppConsent, getOwnedLead } from "@/lib/whatsapp/data"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { cancelWhatsAppSequencesForRecipient } from "@/lib/whatsapp/sequences"

export async function POST(
  _request: Request,
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
  const latest = await getLatestWhatsAppConsent(id)
  if (!latest || latest.status !== "granted") {
    return NextResponse.json({ error: "No active WhatsApp consent" }, { status: 409 })
  }
  const event = {
    id: randomUUID(),
    businessId: ownedLead.businessId,
    leadId: ownedLead.id,
    recordedByUserId: session.user.id,
    phoneE164: latest.phoneE164,
    status: "revoked",
    purpose: "marketing",
    source: latest.source,
    capturedAt: new Date(),
    evidenceReference: null,
    evidenceNote: "Revoked manually in ScoreLead",
    createdAt: new Date(),
  }
  await db.insert(whatsappConsentEvent).values(event)
  await cancelWhatsAppSequencesForRecipient({
    businessId: ownedLead.businessId,
    phoneE164: latest.phoneE164,
    reason: "consent_revoked",
  })
  return NextResponse.json({ consent: event })
}
