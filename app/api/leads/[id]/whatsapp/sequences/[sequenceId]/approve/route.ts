import { and, eq, inArray, ne } from "drizzle-orm"
import { headers } from "next/headers"
import { after, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  whatsappSequence,
  whatsappSequenceStep,
  whatsappTemplate,
} from "@/lib/db/schema"
import { processWhatsAppQueue } from "@/lib/jobs/whatsapp-queue"
import { getUserPlan } from "@/lib/plan"
import {
  getLatestWhatsAppConsent,
  getOwnedLead,
  getWhatsAppConnection,
} from "@/lib/whatsapp/data"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { partsInTimezone } from "@/lib/whatsapp/schedule"

function databaseErrorCode(error: unknown): string | null {
  let current: unknown = error
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const candidate = current as { code?: unknown; cause?: unknown }
    if (typeof candidate.code === "string") return candidate.code
    current = candidate.cause
  }
  return null
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; sequenceId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasWhatsAppEarlyAccess(session.user.email)) {
    return NextResponse.json(
      { error: "WhatsApp integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
      { status: 403 },
    )
  }
  if (await getUserPlan(session.user.id) !== "pro") {
    return NextResponse.json({ error: "WhatsApp automation requires Pro", code: "PLAN_LIMIT" }, { status: 402 })
  }
  const { id, sequenceId } = await params
  const ownedLead = await getOwnedLead(id, session.user.id)
  if (!ownedLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  const [sequence] = await db
    .select()
    .from(whatsappSequence)
    .where(and(eq(whatsappSequence.id, sequenceId), eq(whatsappSequence.leadId, id)))
  if (!sequence || sequence.status !== "draft") {
    return NextResponse.json({ error: "Sequence is no longer awaiting approval" }, { status: 409 })
  }
  const connection = await getWhatsAppConnection(ownedLead.businessId)
  if (!connection || connection.id !== sequence.connectionId || connection.status !== "connected") {
    return NextResponse.json({ error: "WhatsApp connection is unavailable" }, { status: 409 })
  }
  const consent = await getLatestWhatsAppConsent(id, sequence.recipientPhone)
  if (!consent || consent.status !== "granted") {
    return NextResponse.json({ error: "WhatsApp consent is no longer active" }, { status: 409 })
  }
  const [active] = await db
    .select({ id: whatsappSequence.id })
    .from(whatsappSequence)
    .where(and(
      eq(whatsappSequence.businessId, sequence.businessId),
      eq(whatsappSequence.recipientPhone, sequence.recipientPhone),
      eq(whatsappSequence.status, "scheduled"),
      ne(whatsappSequence.id, sequence.id),
    ))
    .limit(1)
  if (active) return NextResponse.json({ error: "This recipient already has an active sequence" }, { status: 409 })

  const steps = await db
    .select()
    .from(whatsappSequenceStep)
    .where(eq(whatsappSequenceStep.sequenceId, sequence.id))
    .orderBy(whatsappSequenceStep.position)
  const currentTemplates = await db
    .select()
    .from(whatsappTemplate)
    .where(and(
      eq(whatsappTemplate.connectionId, connection.id),
      inArray(whatsappTemplate.metaTemplateId, steps.map((step) => step.metaTemplateId)),
      eq(whatsappTemplate.status, "APPROVED"),
      eq(whatsappTemplate.supported, true),
    ))
  if (new Set(currentTemplates.map((template) => template.metaTemplateId)).size !== new Set(steps.map((step) => step.metaTemplateId)).size) {
    return NextResponse.json({ error: "A selected template is no longer approved" }, { status: 409 })
  }
  const templateChanged = steps.some((step) => {
    const current = currentTemplates.find((template) => template.metaTemplateId === step.metaTemplateId)
    return !current || current.name !== step.templateName || current.language !== step.templateLanguage ||
      JSON.stringify(current.components) !== JSON.stringify(step.templateComponents)
  })
  if (templateChanged) {
    return NextResponse.json({ error: "A selected template changed; create a fresh preview" }, { status: 409 })
  }
  if (sequence.timezone !== connection.timezone) {
    return NextResponse.json({ error: "Sending settings changed; create a fresh preview before approval" }, { status: 409 })
  }

  const now = new Date()
  const scheduleChanged = steps.some((step) => {
    const local = partsInTimezone(step.scheduledAt, connection.timezone)
    const weekday = new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay()
    return step.scheduledAt <= now ||
      step.localSendTime < connection.sendWindowStart ||
      step.localSendTime >= connection.sendWindowEnd ||
      !connection.allowedWeekdays.includes(weekday)
  })
  if (scheduleChanged) {
    return NextResponse.json({ error: "The reviewed schedule is no longer valid; create a fresh preview" }, { status: 409 })
  }
  const scheduled = steps.map((step) => ({ id: step.id, scheduledAt: step.scheduledAt }))
  let approved: typeof whatsappSequence.$inferSelect | null
  try {
    approved = await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(whatsappSequence)
        .set({
          status: "scheduled",
          timezone: connection.timezone,
          consentSnapshot: {
            eventId: consent.id,
            status: "granted",
            phoneE164: consent.phoneE164,
            purpose: consent.purpose,
            source: consent.source,
            capturedAt: consent.capturedAt.toISOString(),
            evidenceReference: consent.evidenceReference,
          },
          approvedByUserId: session.user.id,
          approvedAt: now,
          updatedAt: now,
        })
        .where(and(eq(whatsappSequence.id, sequence.id), eq(whatsappSequence.status, "draft")))
        .returning()
      if (!claimed) return null
      for (const item of scheduled) {
        await tx
          .update(whatsappSequenceStep)
          .set({ scheduledAt: item.scheduledAt, status: "queued", retryAt: null, updatedAt: now })
          .where(eq(whatsappSequenceStep.id, item.id))
      }
      return claimed
    })
  } catch (error) {
    if (databaseErrorCode(error) === "23505") {
      return NextResponse.json({ error: "This recipient already has an active sequence" }, { status: 409 })
    }
    throw error
  }
  if (!approved) return NextResponse.json({ error: "Sequence was already processed" }, { status: 409 })
  after(() => processWhatsAppQueue())
  return NextResponse.json({
    sequence: approved,
    steps: steps.map((step) => ({
      ...step,
      scheduledAt: scheduled.find((item) => item.id === step.id)!.scheduledAt,
      status: "queued",
    })),
  })
}
