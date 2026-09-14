import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  supportConversation,
  supportReply,
  whatsappInboundMessage,
} from "@/lib/db/schema"
import { scopeSupport } from "@/lib/support/data"

type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) {
  const { id } = await context.params,
    scope = await scopeSupport(id, false, request)
  if (scope.error) return scope.error
  const conversationId = new URL(request.url).searchParams.get("conversation")
  if (!conversationId) {
    const conversations = await db
      .select()
      .from(supportConversation)
      .where(eq(supportConversation.businessId, id))
      .orderBy(desc(supportConversation.lastMessageAt))
      .limit(30)
    return NextResponse.json(
      { conversations },
      { headers: { "Cache-Control": "no-store" } },
    )
  }
  const [chat] = await db
    .select()
    .from(supportConversation)
    .where(
      and(
        eq(supportConversation.id, conversationId),
        eq(supportConversation.businessId, id),
      ),
    )
  if (!chat) return NextResponse.json({ code: "not_found" }, { status: 404 })
  const inbound = await db
    .select({
      id: whatsappInboundMessage.id,
      body: whatsappInboundMessage.textBody,
      at: whatsappInboundMessage.receivedAt,
      type: whatsappInboundMessage.messageType,
    })
    .from(whatsappInboundMessage)
    .where(
      and(
        eq(whatsappInboundMessage.connectionId, chat.connectionId),
        eq(whatsappInboundMessage.fromPhone, chat.phone),
      ),
    )
    .orderBy(desc(whatsappInboundMessage.receivedAt))
    .limit(30)
  const replies = await db
    .select({
      id: supportReply.id,
      body: supportReply.body,
      at: supportReply.updatedAt,
      status: supportReply.status,
    })
    .from(supportReply)
    .where(eq(supportReply.conversationId, chat.id))
    .orderBy(desc(supportReply.createdAt))
    .limit(30)
  return NextResponse.json(
    {
      messages: [
        ...inbound.map((row) => ({
          ...row,
          direction: "inbound",
          status: "received",
        })),
        ...replies.map((row) => ({
          ...row,
          direction: "outbound",
          type: "text",
        })),
      ]
        .sort((a, b) => a.at.getTime() - b.at.getTime())
        .slice(-30),
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params,
    scope = await scopeSupport(id, false, request)
  if (scope.error) return scope.error
  const input = z
    .object({
      conversationId: z.string().min(1),
      mode: z.enum(["bot", "human"]),
    })
    .strict()
    .safeParse(await request.json().catch(() => null))
  if (!input.success)
    return NextResponse.json({ code: "invalid_settings" }, { status: 400 })
  const changed = await db.transaction(async (tx) => {
    const [chat] = await tx
      .update(supportConversation)
      .set({ mode: input.data.mode })
      .where(
        and(
          eq(supportConversation.id, input.data.conversationId),
          eq(supportConversation.businessId, id),
        ),
      )
      .returning()
    if (!chat) return false
    // Resuming only handles future messages, never replays old questions.
    await tx
      .update(supportReply)
      .set({ status: "skipped", updatedAt: sql`NOW()` })
      .where(
        and(
          eq(supportReply.conversationId, chat.id),
          inArray(supportReply.status, ["queued", "generating"]),
        ),
      )
    return true
  })
  return changed
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ code: "not_found" }, { status: 404 })
}
