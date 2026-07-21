import { and, count, eq, gte, inArray, lt, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  business,
  whatsappConnection,
  whatsappInboundMessage,
  whatsappSequence,
  whatsappSequenceStep,
  whatsappTemplate,
} from "@/lib/db/schema"
import { getUserPlan } from "@/lib/plan"
import { getLatestWhatsAppConsent } from "@/lib/whatsapp/data"
import { MetaGraphError, sendTemplateMessage } from "@/lib/whatsapp/meta"
import { decryptWhatsAppToken } from "@/lib/whatsapp/security"
import {
  businessDayBounds,
  isWithinSendWindow,
} from "@/lib/whatsapp/schedule"
import { buildScheduledAtInPostgres } from "@/lib/whatsapp/schedule-db"

const MAX_CONCURRENT = Math.max(1, Math.min(10, Number(process.env.WHATSAPP_MAX_CONCURRENT ?? 3)))
const MAX_THROTTLE_ATTEMPTS = 3

async function markSequencePaused(sequenceId: string, reason: string, failed = false) {
  await db
    .update(whatsappSequence)
    .set({
      status: failed ? "failed" : "paused",
      pausedAt: new Date(),
      pauseReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(whatsappSequence.id, sequenceId))
}

async function blockStep(stepId: string, sequenceId: string, reason: string) {
  const now = new Date()
  await db
    .update(whatsappSequenceStep)
    .set({ status: "blocked", errorCode: reason, requestStartedAt: null, updatedAt: now })
    .where(eq(whatsappSequenceStep.id, stepId))
  await markSequencePaused(sequenceId, reason)
}

async function requeueOrphanedSendingSteps() {
  const result = await db.execute<{ sequenceId: string }>(sql`
    UPDATE whatsapp_sequence_step
    SET status = 'needs_review',
        "errorCode" = 'ambiguous_worker_loss',
        "errorMessage" = 'The sender stopped after the provider request began; review before retrying.',
        "updatedAt" = now()
    WHERE status = 'sending'
      AND "requestStartedAt" < now() - interval '10 minutes'
    RETURNING "sequenceId"
  `)
  const sequenceIds = Array.from(new Set(result.rows.map((row) => row.sequenceId)))
  if (sequenceIds.length > 0) {
    await db
      .update(whatsappSequence)
      .set({ status: "paused", pausedAt: new Date(), pauseReason: "ambiguous_worker_loss", updatedAt: new Date() })
      .where(inArray(whatsappSequence.id, sequenceIds))
  }
}

async function claimNextStep(): Promise<string | null> {
  const result = await db.execute<{ id: string }>(sql`
    UPDATE whatsapp_sequence_step
    SET status = 'sending',
        "attemptCount" = "attemptCount" + 1,
        "requestStartedAt" = now(),
        "updatedAt" = now()
    WHERE id = (
      SELECT step.id
      FROM whatsapp_sequence_step step
      INNER JOIN whatsapp_sequence sequence ON sequence.id = step."sequenceId"
      INNER JOIN whatsapp_connection connection ON connection.id = sequence."connectionId"
      WHERE step.status = 'queued'
        AND sequence.status = 'scheduled'
        AND step."scheduledAt" <= now()
        AND (step."retryAt" IS NULL OR step."retryAt" <= now())
        AND NOT EXISTS (
          SELECT 1
          FROM whatsapp_sequence_step active_step
          INNER JOIN whatsapp_sequence active_sequence ON active_sequence.id = active_step."sequenceId"
          WHERE active_sequence."connectionId" = sequence."connectionId"
            AND active_step.status = 'sending'
        )
      ORDER BY step."scheduledAt", step."createdAt"
      LIMIT 1
      FOR UPDATE OF step, connection SKIP LOCKED
    )
    RETURNING id
  `)
  return result.rows[0]?.id ?? null
}

async function executeStep(stepId: string) {
  const [row] = await db
    .select({
      step: whatsappSequenceStep,
      sequence: whatsappSequence,
      connection: whatsappConnection,
      ownerId: business.userId,
    })
    .from(whatsappSequenceStep)
    .innerJoin(whatsappSequence, eq(whatsappSequenceStep.sequenceId, whatsappSequence.id))
    .innerJoin(whatsappConnection, eq(whatsappSequence.connectionId, whatsappConnection.id))
    .innerJoin(business, eq(whatsappSequence.businessId, business.id))
    .where(eq(whatsappSequenceStep.id, stepId))
  if (!row || row.step.status !== "sending" || row.sequence.status !== "scheduled") return

  const { step, sequence, connection } = row
  if (await getUserPlan(row.ownerId) !== "pro") {
    await blockStep(step.id, sequence.id, "plan_inactive")
    return
  }
  if (connection.status !== "connected" || !connection.encryptedAccessToken) {
    await blockStep(step.id, sequence.id, "connection_unavailable")
    return
  }
  const consent = await getLatestWhatsAppConsent(sequence.leadId, sequence.recipientPhone)
  if (!consent || consent.status !== "granted") {
    await blockStep(step.id, sequence.id, "consent_missing")
    return
  }
  const [template] = await db
    .select()
    .from(whatsappTemplate)
    .where(and(
      eq(whatsappTemplate.connectionId, connection.id),
      eq(whatsappTemplate.metaTemplateId, step.metaTemplateId),
    ))
  if (
    !template ||
    template.status !== "APPROVED" ||
    !template.supported ||
    template.name !== step.templateName ||
    template.language !== step.templateLanguage ||
    JSON.stringify(template.components) !== JSON.stringify(step.templateComponents)
  ) {
    await blockStep(step.id, sequence.id, "template_unavailable")
    return
  }
  const [reply] = await db
    .select({ id: whatsappInboundMessage.id })
    .from(whatsappInboundMessage)
    .where(and(
      eq(whatsappInboundMessage.connectionId, connection.id),
      eq(whatsappInboundMessage.fromPhone, sequence.recipientPhone),
      gte(whatsappInboundMessage.receivedAt, sequence.approvedAt ?? sequence.createdAt),
    ))
    .limit(1)
  if (reply) {
    await blockStep(step.id, sequence.id, "recipient_replied")
    return
  }

  const now = new Date()
  if (!isWithinSendWindow({
    now,
    timezone: connection.timezone,
    allowedWeekdays: connection.allowedWeekdays,
    start: connection.sendWindowStart,
    end: connection.sendWindowEnd,
  })) {
    const retryAt = await buildScheduledAtInPostgres({
      now,
      offsetDays: 0,
      localSendTime: connection.sendWindowStart,
      timezone: connection.timezone,
      allowedWeekdays: connection.allowedWeekdays,
    })
    await db
      .update(whatsappSequenceStep)
      .set({ status: "queued", requestStartedAt: null, retryAt, updatedAt: now })
      .where(eq(whatsappSequenceStep.id, step.id))
    return
  }
  const bounds = businessDayBounds(now, connection.timezone)
  const [daily] = await db
    .select({ value: count() })
    .from(whatsappSequenceStep)
    .innerJoin(whatsappSequence, eq(whatsappSequenceStep.sequenceId, whatsappSequence.id))
    .where(and(
      eq(whatsappSequence.connectionId, connection.id),
      or(
        and(
          gte(whatsappSequenceStep.acceptedAt, bounds.start),
          lt(whatsappSequenceStep.acceptedAt, bounds.end),
        ),
        and(
          eq(whatsappSequenceStep.status, "needs_review"),
          gte(whatsappSequenceStep.requestStartedAt, bounds.start),
          lt(whatsappSequenceStep.requestStartedAt, bounds.end),
        ),
      ),
    ))
  if ((daily?.value ?? 0) >= connection.dailyLimit) {
    const retryAt = await buildScheduledAtInPostgres({
      now,
      offsetDays: 1,
      localSendTime: connection.sendWindowStart,
      timezone: connection.timezone,
      allowedWeekdays: connection.allowedWeekdays,
    })
    await db
      .update(whatsappSequenceStep)
      .set({ status: "queued", requestStartedAt: null, retryAt, updatedAt: now })
      .where(eq(whatsappSequenceStep.id, step.id))
    return
  }

  try {
    const result = await sendTemplateMessage({
      phoneNumberId: connection.phoneNumberId,
      accessToken: decryptWhatsAppToken(connection.encryptedAccessToken),
      toE164: sequence.recipientPhone,
      templateName: step.templateName,
      language: step.templateLanguage,
      parameters: step.templateParameters,
    })
    await db
      .update(whatsappSequenceStep)
      .set({
        status: "accepted",
        metaMessageId: result.messageId,
        acceptedAt: new Date(),
        requestStartedAt: null,
        retryAt: null,
        errorCode: null,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(whatsappSequenceStep.id, step.id))
  } catch (error) {
    const now = new Date()
    if (error instanceof MetaGraphError && (error.status === 401 || error.status === 403)) {
      await db
        .update(whatsappConnection)
        .set({ status: "needs_action", updatedAt: now })
        .where(eq(whatsappConnection.id, connection.id))
    }
    if (error instanceof MetaGraphError && error.status === 429 && step.attemptCount < MAX_THROTTLE_ATTEMPTS) {
      const delayMinutes = Math.min(60, 2 ** step.attemptCount * 2)
      await db
        .update(whatsappSequenceStep)
        .set({
          status: "queued",
          retryAt: new Date(now.getTime() + delayMinutes * 60_000),
          requestStartedAt: null,
          errorCode: error.code ?? "rate_limited",
          errorMessage: error.message,
          updatedAt: now,
        })
        .where(eq(whatsappSequenceStep.id, step.id))
      return
    }
    const definitive = error instanceof MetaGraphError && error.status >= 400 && error.status < 500
    await db
      .update(whatsappSequenceStep)
      .set({
        status: definitive ? "failed" : "needs_review",
        failedAt: definitive ? now : null,
        errorCode: error instanceof MetaGraphError ? error.code ?? String(error.status) : "ambiguous_send_failure",
        errorMessage: error instanceof Error ? error.message : "Unknown send failure",
        updatedAt: now,
      })
      .where(eq(whatsappSequenceStep.id, step.id))
    await markSequencePaused(
      sequence.id,
      definitive ? "provider_rejected_message" : "ambiguous_send_failure",
      definitive,
    )
  }
}

let pumping = false

export async function processWhatsAppQueue() {
  if (pumping) return
  pumping = true
  try {
    await requeueOrphanedSendingSteps()
    let claimed: string[]
    do {
      claimed = []
      for (let index = 0; index < MAX_CONCURRENT; index += 1) {
        const id = await claimNextStep()
        if (!id) break
        claimed.push(id)
      }
      if (claimed.length > 0) await Promise.allSettled(claimed.map(executeStep))
    } while (claimed.length > 0)
  } finally {
    pumping = false
  }
}
