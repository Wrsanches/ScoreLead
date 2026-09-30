import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supportConversation } from "@/lib/db/schema"
import { conversationUpdateSchema } from "@/lib/support/contracts"
import { getSupportConversation, supportConversationDetail } from "@/lib/support/data"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"

type Context = { params: Promise<{ id: string; conversationId: string }> }

export async function GET(request: Request, { params }: Context) {
  const { id, conversationId } = await params
  const scoped = await scopeWhatsAppRoute(id, "view")
  if ("error" in scoped) return scoped.error
  const conversation = await getSupportConversation(id, scoped.connection.id, conversationId)
  if (!conversation) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 })
  try {
    return NextResponse.json(await supportConversationDetail(conversation, new URL(request.url).searchParams.get("before")), { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CURSOR") return NextResponse.json({ code: "INVALID_CURSOR" }, { status: 400 })
    return NextResponse.json({ code: "INBOX_LOAD_FAILED" }, { status: 502 })
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const { id, conversationId } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error
  const conversation = await getSupportConversation(id, scoped.connection.id, conversationId)
  if (!conversation) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 })
  const parsed = conversationUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 })
  const input = parsed.data
  const base = and(eq(supportConversation.id, conversationId), eq(supportConversation.businessId, id), eq(supportConversation.connectionId, scoped.connection.id))
  const now = new Date()
  const [updated] = input.action === "responded"
    ? await db.update(supportConversation).set({ respondedThroughMessageId: input.messageId, respondedAt: now, updatedAt: now })
      .where(and(base, eq(supportConversation.lastMessageId, input.messageId))).returning()
    : input.action === "pending"
      ? await db.update(supportConversation).set({ respondedThroughMessageId: null, respondedAt: null, updatedAt: now }).where(base).returning()
      : await db.update(supportConversation).set({ suggestedReply: input.suggestedReply, updatedAt: now })
        .where(and(base, eq(supportConversation.lastMessageId, input.messageId), eq(supportConversation.analyzedThroughMessageId, input.messageId), eq(supportConversation.triageStatus, "ready"))).returning()
  if (!updated) return NextResponse.json({ code: "CONVERSATION_CHANGED" }, { status: 409 })
  return NextResponse.json(await supportConversationDetail(updated))
}
