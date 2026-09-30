import { randomUUID } from "node:crypto"
import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { supportConversation, whatsappInboundMessage } from "@/lib/db/schema"

export function inboundAudio(message: Record<string, unknown>) {
  const audio = message.type === "audio" && message.audio && typeof message.audio === "object"
    ? message.audio as Record<string, unknown> : null
  return {
    mediaId: audio && typeof audio.id === "string" && /^\d+$/.test(audio.id) ? audio.id : null,
    mediaMimeType: audio && typeof audio.mime_type === "string" ? audio.mime_type.slice(0, 100) : null,
    mediaSha256: audio && typeof audio.sha256 === "string" ? audio.sha256.slice(0, 128) : null,
    isVoiceNote: audio?.voice === true,
  }
}

/** Message deduplication and the conversation update commit together. */
export async function recordSupportInbound(input: {
  connectionId: string; businessId: string; leadId: string | null; metaMessageId: string
  fromPhone: string; messageType: string; textBody: string | null; receivedAt: Date
  contactName: string | null; media: ReturnType<typeof inboundAudio>
}) {
  return db.transaction(async (tx) => {
    const now = new Date()
    const [message] = await tx.insert(whatsappInboundMessage).values({
      id: randomUUID(), connectionId: input.connectionId, leadId: input.leadId,
      metaMessageId: input.metaMessageId, fromPhone: input.fromPhone,
      messageType: input.messageType, textBody: input.textBody, receivedAt: input.receivedAt,
      ...input.media, createdAt: now,
    }).onConflictDoNothing({ target: whatsappInboundMessage.metaMessageId }).returning({ id: whatsappInboundMessage.id })
    if (!message) return null
    const isNewest = sql`${supportConversation.lastMessageAt} <= excluded."lastMessageAt"`
    const [conversation] = await tx.insert(supportConversation).values({
      id: randomUUID(), connectionId: input.connectionId, businessId: input.businessId,
      fromPhone: input.fromPhone, contactName: input.contactName,
      lastMessageId: message.id, lastMessageAt: input.receivedAt, updatedAt: now,
      retryAt: new Date(now.getTime() + 8_000),
    }).onConflictDoUpdate({
      target: [supportConversation.connectionId, supportConversation.fromPhone],
      set: {
        contactName: sql`coalesce(excluded."contactName", ${supportConversation.contactName})`,
        lastMessageId: sql`case when ${isNewest} then excluded."lastMessageId" else ${supportConversation.lastMessageId} end`,
        lastMessageAt: sql`greatest(${supportConversation.lastMessageAt}, excluded."lastMessageAt")`,
        triageStatus: sql`case when ${isNewest} and ${supportConversation.triageStatus} <> 'processing' then 'queued' else ${supportConversation.triageStatus} end`,
        attemptCount: sql`case when ${isNewest} then 0 else ${supportConversation.attemptCount} end`,
        retryAt: sql`case when ${isNewest} then excluded."retryAt" else ${supportConversation.retryAt} end`,
        errorCode: sql`case when ${isNewest} then null else ${supportConversation.errorCode} end`,
        updatedAt: now,
      },
    }).returning({ id: supportConversation.id })
    await tx.update(whatsappInboundMessage).set({ conversationId: conversation.id }).where(eq(whatsappInboundMessage.id, message.id))
    return message
  })
}
