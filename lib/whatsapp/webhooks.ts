import { randomUUID } from "node:crypto"
import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  whatsappConnection,
  whatsappConsentEvent,
  whatsappInboundMessage,
  whatsappSequence,
  whatsappSequenceStep,
  whatsappTemplate,
  whatsappWebhookEvent,
} from "@/lib/db/schema"
import { getLatestWhatsAppConsent } from "@/lib/whatsapp/data"
import { metaPhoneToE164 } from "@/lib/whatsapp/security"
import {
  cancelWhatsAppSequencesForRecipient,
  pauseWhatsAppSequencesForReply,
} from "@/lib/whatsapp/sequences"
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types"

const OPT_OUT_WORDS = new Set([
  "STOP",
  "UNSUBSCRIBE",
  "CANCEL",
  "PARAR",
  "SAIR",
  "CANCELAR",
  "DETENER",
  "BAJA",
])

export function isWhatsAppOptOut(text: string | null | undefined): boolean {
  return !!text && OPT_OUT_WORDS.has(text.trim().toUpperCase())
}

async function claimEvent(eventKey: string, eventType: string): Promise<boolean> {
  const [inserted] = await db
    .insert(whatsappWebhookEvent)
    .values({ id: randomUUID(), eventKey, eventType })
    .onConflictDoNothing({ target: whatsappWebhookEvent.eventKey })
    .returning({ id: whatsappWebhookEvent.id })
  return !!inserted
}

function timestamp(value: unknown): Date {
  const seconds = typeof value === "string" || typeof value === "number" ? Number(value) : NaN
  return Number.isFinite(seconds) ? new Date(seconds * 1000) : new Date()
}

function inboundText(message: Record<string, unknown>): string | null {
  if (message.type === "text") {
    const text = message.text as { body?: unknown } | undefined
    return typeof text?.body === "string" ? text.body : null
  }
  if (message.type === "interactive") {
    const interactive = message.interactive as Record<string, unknown> | undefined
    const reply = interactive?.button_reply ?? interactive?.list_reply
    if (reply && typeof reply === "object") {
      const title = (reply as { title?: unknown }).title
      return typeof title === "string" ? title : null
    }
  }
  return null
}

async function handleInbound(connection: typeof whatsappConnection.$inferSelect, message: Record<string, unknown>) {
  const messageId = typeof message.id === "string" ? message.id : null
  const from = typeof message.from === "string" ? metaPhoneToE164(message.from) : null
  if (!messageId || !from) return
  const textBody = inboundText(message)
  const [recentSequence] = await db
    .select({ leadId: whatsappSequence.leadId })
    .from(whatsappSequence)
    .where(and(
      eq(whatsappSequence.businessId, connection.businessId),
      eq(whatsappSequence.recipientPhone, from),
    ))
    .orderBy(desc(whatsappSequence.createdAt))
    .limit(1)
  const [inserted] = await db
    .insert(whatsappInboundMessage)
    .values({
      id: randomUUID(),
      connectionId: connection.id,
      leadId: recentSequence?.leadId ?? null,
      metaMessageId: messageId,
      fromPhone: from,
      messageType: typeof message.type === "string" ? message.type : "unknown",
      textBody,
      receivedAt: timestamp(message.timestamp),
    })
    .onConflictDoNothing({ target: whatsappInboundMessage.metaMessageId })
    .returning({ id: whatsappInboundMessage.id })
  if (!inserted) return

  const optedOut = isWhatsAppOptOut(textBody)
  if (optedOut && recentSequence) {
    const latest = await getLatestWhatsAppConsent(recentSequence.leadId, from)
    if (latest?.status === "granted") {
      await db.insert(whatsappConsentEvent).values({
        id: randomUUID(),
        businessId: connection.businessId,
        leadId: recentSequence.leadId,
        recordedByUserId: null,
        phoneE164: from,
        status: "revoked",
        purpose: "marketing",
        source: latest.source,
        capturedAt: new Date(),
        evidenceNote: `Recipient opted out via WhatsApp: ${textBody}`,
      })
    }
    await cancelWhatsAppSequencesForRecipient({
      businessId: connection.businessId,
      phoneE164: from,
      reason: "recipient_opted_out",
    })
  } else {
    await pauseWhatsAppSequencesForReply({ businessId: connection.businessId, phoneE164: from })
  }
}

async function refreshSequenceCompletion(sequenceId: string) {
  const [unfinished] = await db
    .select({ id: whatsappSequenceStep.id })
    .from(whatsappSequenceStep)
    .where(and(
      eq(whatsappSequenceStep.sequenceId, sequenceId),
      inArray(whatsappSequenceStep.status, ["queued", "sending", "accepted"]),
    ))
    .limit(1)
  if (!unfinished) {
    await db
      .update(whatsappSequence)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(whatsappSequence.id, sequenceId), eq(whatsappSequence.status, "scheduled")))
  }
}

async function handleStatus(status: Record<string, unknown>) {
  const messageId = typeof status.id === "string" ? status.id : null
  const state = typeof status.status === "string" ? status.status : null
  if (!messageId || !state || !["sent", "delivered", "read", "failed"].includes(state)) return
  const eventTime = timestamp(status.timestamp)
  if (!(await claimEvent(`status:${messageId}:${state}:${eventTime.getTime()}`, "message_status"))) return
  const [step] = await db
    .select()
    .from(whatsappSequenceStep)
    .where(eq(whatsappSequenceStep.metaMessageId, messageId))
  if (!step) return
  const rank: Record<string, number> = { accepted: 0, sent: 1, delivered: 2, read: 3 }
  if (state !== "failed" && (rank[step.status] ?? -1) >= (rank[state] ?? -1)) return
  const errors = Array.isArray(status.errors) ? status.errors : []
  const firstError = errors[0] as { code?: unknown; title?: unknown; message?: unknown } | undefined
  const updates: Partial<typeof whatsappSequenceStep.$inferInsert> = {
    status: state,
    updatedAt: new Date(),
  }
  if (state === "sent") updates.sentAt = eventTime
  if (state === "delivered") updates.deliveredAt = eventTime
  if (state === "read") updates.readAt = eventTime
  if (state === "failed") {
    updates.failedAt = eventTime
    updates.errorCode = firstError?.code != null ? String(firstError.code) : "delivery_failed"
    updates.errorMessage = typeof firstError?.title === "string"
      ? firstError.title
      : typeof firstError?.message === "string"
        ? firstError.message
        : "WhatsApp delivery failed"
  }
  await db.update(whatsappSequenceStep).set(updates).where(eq(whatsappSequenceStep.id, step.id))
  if (state === "failed") {
    await db
      .update(whatsappSequence)
      .set({ status: "failed", pauseReason: "delivery_failed", updatedAt: new Date() })
      .where(eq(whatsappSequence.id, step.sequenceId))
  } else {
    await refreshSequenceCompletion(step.sequenceId)
  }
}

async function handleMessages(value: Record<string, unknown>) {
  const metadata = value.metadata as { phone_number_id?: unknown } | undefined
  const phoneNumberId = typeof metadata?.phone_number_id === "string" ? metadata.phone_number_id : null
  if (!phoneNumberId) return
  const [connection] = await db
    .select()
    .from(whatsappConnection)
    .where(eq(whatsappConnection.phoneNumberId, phoneNumberId))
  if (!connection) return
  const messages = Array.isArray(value.messages) ? value.messages : []
  const statuses = Array.isArray(value.statuses) ? value.statuses : []
  for (const message of messages) {
    if (message && typeof message === "object") await handleInbound(connection, message as Record<string, unknown>)
  }
  for (const status of statuses) {
    if (status && typeof status === "object") await handleStatus(status as Record<string, unknown>)
  }
}

async function handleTemplateStatus(
  wabaId: string | undefined,
  entryTime: number | undefined,
  value: Record<string, unknown>,
) {
  const metaTemplateId = value.message_template_id != null ? String(value.message_template_id) : null
  const event = typeof value.event === "string" ? value.event.toUpperCase() : null
  if (!wabaId || !metaTemplateId || !event) return
  if (!(await claimEvent(`template:${wabaId}:${metaTemplateId}:${event}:${entryTime ?? "unknown"}`, "template_status"))) return
  const [connection] = await db
    .select({ id: whatsappConnection.id })
    .from(whatsappConnection)
    .where(eq(whatsappConnection.wabaId, wabaId))
  if (!connection) return
  await db
    .update(whatsappTemplate)
    .set({
      status: event,
      ...(event === "APPROVED" ? {} : { supported: false }),
      rejectionReason: typeof value.reason === "string" && value.reason !== "NONE" ? value.reason : null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(whatsappTemplate.connectionId, connection.id),
      eq(whatsappTemplate.metaTemplateId, metaTemplateId),
    ))
  if (event !== "APPROVED") {
    const affected = await db
      .select({ sequenceId: whatsappSequenceStep.sequenceId })
      .from(whatsappSequenceStep)
      .innerJoin(whatsappSequence, eq(whatsappSequenceStep.sequenceId, whatsappSequence.id))
      .where(and(
        eq(whatsappSequence.connectionId, connection.id),
        eq(whatsappSequence.status, "scheduled"),
        eq(whatsappSequenceStep.metaTemplateId, metaTemplateId),
        eq(whatsappSequenceStep.status, "queued"),
      ))
    const ids = Array.from(new Set(affected.map((row) => row.sequenceId)))
    if (ids.length > 0) {
      await db
        .update(whatsappSequence)
        .set({ status: "paused", pausedAt: new Date(), pauseReason: "template_unavailable", updatedAt: new Date() })
        .where(inArray(whatsappSequence.id, ids))
      await db
        .update(whatsappSequenceStep)
        .set({ status: "blocked", errorCode: "template_unavailable", updatedAt: new Date() })
        .where(and(
          inArray(whatsappSequenceStep.sequenceId, ids),
          eq(whatsappSequenceStep.metaTemplateId, metaTemplateId),
          eq(whatsappSequenceStep.status, "queued"),
        ))
    }
  }
}

export async function processWhatsAppWebhook(payload: WhatsAppWebhookPayload) {
  if (payload.object !== "whatsapp_business_account") return
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (!change.value) continue
      if (change.field === "messages") await handleMessages(change.value)
      if (change.field === "message_template_status_update") {
        await handleTemplateStatus(entry.id, entry.time, change.value)
      }
    }
  }
}
