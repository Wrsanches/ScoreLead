import { and, eq, sql } from "drizzle-orm"
import { after, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { whatsappInboundMessage, supportConversation } from "@/lib/db/schema"
import { getSupportConversation } from "@/lib/support/data"
import { queueSupportTriage, processSupportQueue } from "@/lib/support/queue"
import { downloadWhatsAppAudio } from "@/lib/whatsapp/meta"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"
import { decryptWhatsAppToken } from "@/lib/whatsapp/security"

export const maxDuration = 300
type Context = { params: Promise<{ id: string; conversationId: string; messageId: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { id, conversationId, messageId } = await params
  const scoped = await scopeWhatsAppRoute(id, "view")
  if ("error" in scoped) return scoped.error
  if (!await getSupportConversation(id, scoped.connection.id, conversationId)) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 })
  const [message] = await db.select().from(whatsappInboundMessage).where(and(eq(whatsappInboundMessage.id, messageId), eq(whatsappInboundMessage.conversationId, conversationId))).limit(1)
  if (!message?.mediaId || message.messageType !== "audio") return NextResponse.json({ code: "AUDIO_UNAVAILABLE" }, { status: 404 })
  try {
    const audio = await downloadWhatsAppAudio({ mediaId: message.mediaId, phoneNumberId: scoped.connection.phoneNumberId,
      accessToken: decryptWhatsAppToken(scoped.connection.encryptedAccessToken!), expectedSha256: message.mediaSha256 })
    return new Response(new Uint8Array(audio.bytes), { headers: { "Content-Type": audio.mimeType,
      "Content-Length": String(audio.bytes.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } })
  } catch { return NextResponse.json({ code: "AUDIO_UNAVAILABLE" }, { status: 502 }) }
}

export async function PATCH(request: Request, { params }: Context) {
  const { id, conversationId, messageId } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error
  const conversation = await getSupportConversation(id, scoped.connection.id, conversationId)
  if (!conversation) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 })
  const parsed = z.object({ transcript: z.string().trim().min(1).max(24000) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 })
  const saved = await db.transaction(async (tx) => {
    const [locked] = await tx.select({ id: supportConversation.id }).from(supportConversation)
      .where(and(eq(supportConversation.id, conversationId), sql`${supportConversation.triageStatus} <> 'processing'`)).for("update")
    if (!locked) return null
    const [message] = await tx.update(whatsappInboundMessage).set({ transcript: parsed.data.transcript, transcriptionError: null })
      .where(and(eq(whatsappInboundMessage.id, messageId), eq(whatsappInboundMessage.conversationId, conversationId), eq(whatsappInboundMessage.messageType, "audio"))).returning({ id: whatsappInboundMessage.id })
    return message
  })
  if (!saved) return NextResponse.json({ code: "TRIAGE_BUSY" }, { status: 409 })
  await queueSupportTriage(conversationId)
  after(() => processSupportQueue({ conversationId, maxItems: 1 }))
  return NextResponse.json({ ok: true }, { status: 202 })
}
