import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  whatsappInboundMessage,
  whatsappSequence,
  whatsappSequenceStep,
} from "@/lib/db/schema"

export async function cancelWhatsAppSequencesForRecipient(input: {
  businessId: string
  phoneE164: string
  reason: string
}) {
  const now = new Date()
  const sequences = await db
    .update(whatsappSequence)
    .set({
      status: "cancelled",
      cancelledAt: now,
      pauseReason: input.reason,
      updatedAt: now,
    })
    .where(and(
      eq(whatsappSequence.businessId, input.businessId),
      eq(whatsappSequence.recipientPhone, input.phoneE164),
      inArray(whatsappSequence.status, ["draft", "scheduled", "paused"]),
    ))
    .returning({ id: whatsappSequence.id })
  if (sequences.length > 0) {
    await db
      .update(whatsappSequenceStep)
      .set({ status: "cancelled", errorCode: input.reason, updatedAt: now })
      .where(and(
        inArray(whatsappSequenceStep.sequenceId, sequences.map((row) => row.id)),
        eq(whatsappSequenceStep.status, "queued"),
      ))
    await db
      .update(whatsappSequenceStep)
      .set({
        status: "needs_review",
        errorCode: "cancelled_during_provider_request",
        errorMessage: "Cancellation arrived after the provider request may have started; review delivery status.",
        updatedAt: now,
      })
      .where(and(
        inArray(whatsappSequenceStep.sequenceId, sequences.map((row) => row.id)),
        eq(whatsappSequenceStep.status, "sending"),
      ))
  }
}

export async function pauseWhatsAppSequencesForReply(input: {
  businessId: string
  phoneE164: string
}) {
  const now = new Date()
  const sequences = await db
    .update(whatsappSequence)
    .set({ status: "paused", pausedAt: now, pauseReason: "recipient_replied", updatedAt: now })
    .where(and(
      eq(whatsappSequence.businessId, input.businessId),
      eq(whatsappSequence.recipientPhone, input.phoneE164),
      eq(whatsappSequence.status, "scheduled"),
    ))
    .returning({ id: whatsappSequence.id })
  if (sequences.length > 0) {
    await db
      .update(whatsappSequenceStep)
      .set({ status: "blocked", errorCode: "recipient_replied", updatedAt: now })
      .where(and(
        inArray(whatsappSequenceStep.sequenceId, sequences.map((row) => row.id)),
        eq(whatsappSequenceStep.status, "queued"),
      ))
  }
}

export async function listWhatsAppSequences(leadId: string) {
  const sequences = await db
    .select()
    .from(whatsappSequence)
    .where(eq(whatsappSequence.leadId, leadId))
    .orderBy(desc(whatsappSequence.createdAt))
    .limit(10)
  if (sequences.length === 0) return []
  const steps = await db
    .select()
    .from(whatsappSequenceStep)
    .where(inArray(whatsappSequenceStep.sequenceId, sequences.map((row) => row.id)))
    .orderBy(whatsappSequenceStep.position)
  const [lastReply] = await db
    .select()
    .from(whatsappInboundMessage)
    .where(eq(whatsappInboundMessage.leadId, leadId))
    .orderBy(desc(whatsappInboundMessage.receivedAt))
    .limit(1)
  return sequences.map((sequence) => ({
    ...sequence,
    steps: steps.filter((step) => step.sequenceId === sequence.id),
    lastReply: lastReply ?? null,
  }))
}
