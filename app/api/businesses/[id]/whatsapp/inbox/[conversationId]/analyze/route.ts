import { after, NextResponse } from "next/server"
import { getSupportConversation } from "@/lib/support/data"
import { processSupportQueue, queueSupportTriage } from "@/lib/support/queue"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"
import { db } from "@/lib/db"
import { whatsappInboundMessage } from "@/lib/db/schema"
import { and, eq, isNotNull } from "drizzle-orm"

export const maxDuration = 300
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; conversationId: string }> }) {
  const { id, conversationId } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error
  if (!await getSupportConversation(id, scoped.connection.id, conversationId)) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 })
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ code: "AI_NOT_CONFIGURED" }, { status: 503 })
  if (!await queueSupportTriage(conversationId)) return NextResponse.json({ code: "TRIAGE_BUSY" }, { status: 409 })
  await db.update(whatsappInboundMessage).set({ transcriptionError: null })
    .where(and(eq(whatsappInboundMessage.conversationId, conversationId), isNotNull(whatsappInboundMessage.transcriptionError)))
  after(() => processSupportQueue({ conversationId, maxItems: 1 }))
  return NextResponse.json({ ok: true }, { status: 202 })
}
