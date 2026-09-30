import { and, count, desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { supportConversation, supportTask, whatsappInboundMessage } from "@/lib/db/schema"
import { isConversationPending, type SupportConversationView, type SupportMessageView, type SupportTaskView } from "@/lib/support/contracts"

export function publicConversation(row: typeof supportConversation.$inferSelect, preview: string | null = null, messageType = "text"): SupportConversationView {
  return {
    id: row.id, fromPhone: row.fromPhone, contactName: row.contactName,
    lastMessageId: row.lastMessageId, lastMessageAt: row.lastMessageAt.toISOString(),
    pending: isConversationPending(row.lastMessageId, row.respondedThroughMessageId),
    triageStatus: row.triageStatus, classification: row.classification,
    summary: row.summary, suggestedReply: row.suggestedReply,
    analyzedThroughMessageId: row.analyzedThroughMessageId, errorCode: row.errorCode,
    preview, messageType,
    repositoryEvidence: row.repositoryEvidence,
  }
}

export function publicSupportTask(row: typeof supportTask.$inferSelect): SupportTaskView {
  return {
    id: row.id, sourceMessageId: row.sourceMessageId, proposal: row.proposal, status: row.status,
    rejectionReason: row.rejectionReason, githubIssueUrl: row.githubIssueUrl,
    githubIssueNumber: row.githubIssueNumber, githubRepository: row.githubRepository,
    codexStatus: row.codexStatus, errorCode: row.errorCode,
  }
}

export async function listSupportConversations(businessId: string, connectionId: string, filter: "pending" | "responded" | "all", page: number) {
  const pending = sql`${supportConversation.lastMessageId} is distinct from ${supportConversation.respondedThroughMessageId}`
  const condition = and(eq(supportConversation.businessId, businessId), eq(supportConversation.connectionId, connectionId),
    filter === "pending" ? pending : filter === "responded" ? sql`not (${pending})` : undefined)
  const [[totals], rows] = await Promise.all([
    db.select({ total: count() }).from(supportConversation).where(condition),
    db.select({ conversation: supportConversation, preview: sql<string | null>`coalesce(${whatsappInboundMessage.transcript}, ${whatsappInboundMessage.textBody})`, messageType: whatsappInboundMessage.messageType })
      .from(supportConversation).leftJoin(whatsappInboundMessage, eq(whatsappInboundMessage.id, supportConversation.lastMessageId))
      .where(condition).orderBy(desc(supportConversation.lastMessageAt), desc(supportConversation.id)).limit(25).offset(page * 25),
  ])
  return { conversations: rows.map((row) => publicConversation(row.conversation, row.preview, row.messageType ?? "unknown")), total: totals.total, page, pageSize: 25 }
}

export async function getSupportConversation(businessId: string, connectionId: string, conversationId: string) {
  const [conversation] = await db.select().from(supportConversation).where(and(
    eq(supportConversation.id, conversationId), eq(supportConversation.businessId, businessId), eq(supportConversation.connectionId, connectionId),
  )).limit(1)
  return conversation ?? null
}

export async function supportConversationDetail(conversation: typeof supportConversation.$inferSelect, before?: string | null) {
  let beforeCondition
  if (before) {
    const [boundary] = await db.select().from(whatsappInboundMessage).where(and(eq(whatsappInboundMessage.id, before), eq(whatsappInboundMessage.conversationId, conversation.id))).limit(1)
    if (!boundary) throw new Error("INVALID_CURSOR")
    beforeCondition = sql`(${whatsappInboundMessage.receivedAt}, ${whatsappInboundMessage.createdAt}, ${whatsappInboundMessage.id}) < (${boundary.receivedAt}, ${boundary.createdAt}, ${boundary.id})`
  }
  const [rows, tasks] = await Promise.all([
    db.select().from(whatsappInboundMessage).where(and(eq(whatsappInboundMessage.conversationId, conversation.id), beforeCondition))
      .orderBy(desc(whatsappInboundMessage.receivedAt), desc(whatsappInboundMessage.createdAt), desc(whatsappInboundMessage.id)).limit(31),
    db.select().from(supportTask).where(eq(supportTask.conversationId, conversation.id)).orderBy(desc(supportTask.createdAt)).limit(10),
  ])
  const selected = rows.slice(0, 30)
  const messages: SupportMessageView[] = selected.reverse().map((row) => ({
    id: row.id, messageType: row.messageType, textBody: row.textBody,
    transcript: row.transcript, transcriptionError: row.transcriptionError,
    receivedAt: row.receivedAt.toISOString(), hasAudio: row.messageType === "audio" && !!row.mediaId, isVoiceNote: row.isVoiceNote,
  }))
  return {
    conversation: publicConversation(conversation), messages,
    nextBefore: rows.length > 30 ? messages[0]?.id : null,
    tasks: tasks.map(publicSupportTask),
  }
}
