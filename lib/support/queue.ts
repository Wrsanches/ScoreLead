import { randomUUID } from "node:crypto"
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  business,
  supportAssistant,
  supportConversation,
  supportReply,
  whatsappInboundMessage,
  whatsappSequence,
  whatsappSequenceStep,
  whatsappConnection,
} from "@/lib/db/schema"
import { can, getUserPlan } from "@/lib/plan"
import { sendTextMessage } from "@/lib/whatsapp/meta"
import { decryptWhatsAppToken } from "@/lib/whatsapp/security"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { generateSupportAnswer, type SupportTurn } from "./answers"
import type { SupportTransaction } from "./data"
import { withinServiceWindow } from "./policy"

export async function enqueueSupportReply(
  tx: SupportTransaction,
  input: {
    businessId: string
    connectionId: string
    inboundId: string
    phone: string
    receivedAt: Date
    text: string | null
    optedOut: boolean
  },
) {
  const [settings] = await tx
    .select()
    .from(supportAssistant)
    .where(eq(supportAssistant.businessId, input.businessId))
  if (!settings?.enabled) return
  const [conversation] = await tx
    .insert(supportConversation)
    .values({
      id: randomUUID(),
      businessId: input.businessId,
      connectionId: input.connectionId,
      phone: input.phone,
      lastMessageAt: input.receivedAt,
      mode: input.optedOut || !input.text ? "human" : "bot",
    })
    .onConflictDoUpdate({
      target: [supportConversation.connectionId, supportConversation.phone],
      set: {
        lastMessageAt: sql`GREATEST(${supportConversation.lastMessageAt}, ${input.receivedAt})`,
        ...(input.optedOut || !input.text ? { mode: "human" } : {}),
      },
    })
    .returning()
  if (
    conversation.mode !== "bot" ||
    !input.text ||
    !withinServiceWindow(input.receivedAt)
  )
    return
  await tx
    .insert(supportReply)
    .values({
      id: randomUUID(),
      conversationId: conversation.id,
      inboundId: input.inboundId,
    })
    .onConflictDoNothing()
}

export async function processSupportReplies() {
  // Once a send may have reached Meta, never automatically retry it.
  await db.execute(
    sql`UPDATE support_conversation SET mode='human' WHERE id IN (SELECT "conversationId" FROM support_reply WHERE status IN ('sending','generating') AND "updatedAt" < NOW() - INTERVAL '5 minutes')`,
  )
  await db.execute(
    sql`UPDATE support_reply SET status='needs_review', "errorCode"='worker_interrupted', "updatedAt"=NOW() WHERE status IN ('sending','generating') AND "updatedAt" < NOW() - INTERVAL '5 minutes'`,
  )
  const result = await db.execute<{ id: string }>(sql`
    UPDATE support_reply SET status='generating', "updatedAt"=NOW() WHERE id IN (
      SELECT candidate.id FROM support_reply candidate
      WHERE candidate.status='queued' AND NOT EXISTS (
        SELECT 1 FROM support_reply active WHERE active."conversationId"=candidate."conversationId"
        AND (active.status IN ('generating','sending') OR (active.status='queued' AND (active."createdAt", active.id) < (candidate."createdAt", candidate.id)))
      ) AND NOT EXISTS (
        SELECT 1 FROM support_conversation chat
        JOIN support_assistant source ON source."businessId"=chat."businessId"
        JOIN whatsapp_inbound_message inbound ON inbound.id=candidate."inboundId"
        WHERE chat.id=candidate."conversationId" AND source.enabled AND chat.mode='bot'
          AND source.status IN ('queued','syncing','indexing')
          AND inbound."receivedAt" > NOW() - INTERVAL '23 hours 59 minutes'
      ) ORDER BY candidate."createdAt", candidate.id FOR UPDATE SKIP LOCKED LIMIT 1
    ) RETURNING id`)
  if (!result.rows[0]) return
  const replyId = result.rows[0].id
  const [row] = await db
    .select({
      reply: supportReply,
      conversation: supportConversation,
      inbound: whatsappInboundMessage,
      settings: supportAssistant,
      connection: whatsappConnection,
      ownerId: business.userId,
    })
    .from(supportReply)
    .innerJoin(
      supportConversation,
      eq(supportConversation.id, supportReply.conversationId),
    )
    .innerJoin(
      whatsappInboundMessage,
      eq(whatsappInboundMessage.id, supportReply.inboundId),
    )
    .innerJoin(
      supportAssistant,
      eq(supportAssistant.businessId, supportConversation.businessId),
    )
    .innerJoin(
      whatsappConnection,
      eq(whatsappConnection.id, supportConversation.connectionId),
    )
    .innerJoin(business, eq(business.id, supportConversation.businessId))
    .where(eq(supportReply.id, replyId))
  if (!row) return
  const { conversation, settings, connection, inbound } = row
  const finish = async (status: string, errorCode: string | null = null) => {
    await db
      .update(supportReply)
      .set({ status, errorCode, updatedAt: new Date() })
      .where(eq(supportReply.id, replyId))
  }
  if (
    !settings.enabled ||
    conversation.mode !== "bot" ||
    !withinServiceWindow(inbound.receivedAt) ||
    !inbound.textBody ||
    connection.status !== "connected" ||
    !connection.encryptedAccessToken ||
    !hasWhatsAppEarlyAccess(null)
  ) {
    await finish("skipped")
    return
  }
  try {
    if (!can(await getUserPlan(row.ownerId), "whatsappAutomation")) {
      await finish("skipped")
      return
    }
    if (["queued", "syncing", "indexing"].includes(settings.status)) {
      await finish("queued")
      return
    }
    const [usage] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportReply)
      .innerJoin(
        supportConversation,
        eq(supportConversation.id, supportReply.conversationId),
      )
      .where(
        and(
          eq(supportConversation.businessId, conversation.businessId),
          gte(supportReply.createdAt, new Date(Date.now() - 24 * 60 * 60_000)),
          inArray(supportReply.status, [
            "sent",
            "sending",
            "generating",
            "needs_review",
          ]),
        ),
      )
    const [contactUsage] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportReply)
      .where(
        and(
          eq(supportReply.conversationId, conversation.id),
          gte(supportReply.createdAt, new Date(Date.now() - 60 * 60_000)),
          inArray(supportReply.status, ["sent", "sending", "generating"]),
        ),
      )
    if (usage.count > 100 || contactUsage.count > 15)
      throw new Error("reply_limit")
    const incoming = await db
      .select()
      .from(whatsappInboundMessage)
      .where(
        and(
          eq(whatsappInboundMessage.connectionId, connection.id),
          eq(whatsappInboundMessage.fromPhone, conversation.phone),
        ),
      )
      .orderBy(desc(whatsappInboundMessage.receivedAt))
      .limit(15)
    const outgoing = await db
      .select()
      .from(supportReply)
      .where(
        and(
          eq(supportReply.conversationId, conversation.id),
          eq(supportReply.status, "sent"),
        ),
      )
      .orderBy(desc(supportReply.createdAt))
      .limit(15)
    const templates = await db
      .select({
        body: whatsappSequenceStep.renderedBody,
        at: whatsappSequenceStep.acceptedAt,
      })
      .from(whatsappSequenceStep)
      .innerJoin(
        whatsappSequence,
        eq(whatsappSequence.id, whatsappSequenceStep.sequenceId),
      )
      .where(
        and(
          eq(whatsappSequence.connectionId, connection.id),
          eq(whatsappSequence.recipientPhone, conversation.phone),
          inArray(whatsappSequenceStep.status, [
            "accepted",
            "sent",
            "delivered",
            "read",
          ]),
        ),
      )
      .orderBy(desc(whatsappSequenceStep.acceptedAt))
      .limit(3)
    const history: SupportTurn[] = [
      ...incoming
        .filter(
          (message) =>
            message.id !== inbound.id &&
            message.textBody &&
            message.receivedAt <= inbound.receivedAt,
        )
        .map((message) => ({
          role: "user" as const,
          content: message.textBody!,
          at: message.receivedAt,
        })),
      ...outgoing
        .filter((message) => message.body)
        .map((message) => ({
          role: "assistant" as const,
          content: message.body!,
          at: message.updatedAt,
        })),
      ...templates
        .filter((message) => message.at)
        .map((message) => ({
          role: "assistant" as const,
          content: message.body,
          at: message.at!,
        })),
    ]
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(-12)
      .map(({ role, content }) => ({ role, content }))
    const answer = await generateSupportAnswer(
      settings,
      inbound.textBody,
      history,
    )
    // Revalidate tenant settings, human takeover and service window immediately before sending.
    const permitted = await db.transaction(async (tx) => {
      const [latest] = await tx
        .select()
        .from(supportAssistant)
        .where(eq(supportAssistant.businessId, conversation.businessId))
        .for("update")
      const [chat] = await tx
        .select()
        .from(supportConversation)
        .where(eq(supportConversation.id, conversation.id))
        .for("update")
      const [connected] = await tx
        .select()
        .from(whatsappConnection)
        .where(eq(whatsappConnection.id, connection.id))
      const [job] = await tx
        .select()
        .from(supportReply)
        .where(eq(supportReply.id, replyId))
        .for("update")
      if (
        job?.status !== "generating" ||
        !latest?.enabled ||
        latest.version !== settings.version ||
        latest.status !== "ready" ||
        latest.vectorStoreId !== settings.vectorStoreId ||
        chat?.mode !== "bot" ||
        connected?.status !== "connected" ||
        connected.encryptedAccessToken !== connection.encryptedAccessToken ||
        !withinServiceWindow(inbound.receivedAt)
      )
        return false
      await tx
        .update(supportReply)
        .set({
          status: "sending",
          body: answer.reply,
          handoff: answer.handoff,
          updatedAt: new Date(),
        })
        .where(eq(supportReply.id, replyId))
      if (answer.handoff)
        await tx
          .update(supportConversation)
          .set({ mode: "human" })
          .where(eq(supportConversation.id, conversation.id))
      return true
    })
    if (!permitted) {
      await finish("skipped")
      return
    }
    const sent = await sendTextMessage({
      phoneNumberId: connection.phoneNumberId,
      accessToken: decryptWhatsAppToken(connection.encryptedAccessToken),
      toE164: conversation.phone,
      text: answer.reply,
      replyTo: inbound.metaMessageId,
    })
    await db
      .update(supportReply)
      .set({
        status: "sent",
        metaMessageId: sent.messageId,
        updatedAt: new Date(),
      })
      .where(eq(supportReply.id, replyId))
  } catch {
    await db
      .update(supportConversation)
      .set({ mode: "human" })
      .where(eq(supportConversation.id, conversation.id))
    await finish("needs_review", "answer_or_delivery_failed")
  }
}
