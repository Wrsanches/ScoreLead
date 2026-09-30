import { NextResponse } from "next/server"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"
import { listSupportConversations } from "@/lib/support/data"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeWhatsAppRoute(id, "view")
  if ("error" in scoped) return scoped.error
  const url = new URL(request.url)
  const filter = url.searchParams.get("filter") ?? "pending"
  const page = Number(url.searchParams.get("page") ?? 0)
  if (!["pending", "responded", "all"].includes(filter) || !Number.isInteger(page) || page < 0 || page > 10000) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 })
  return NextResponse.json(await listSupportConversations(id, scoped.connection.id, filter as "pending" | "responded" | "all", page), { headers: { "Cache-Control": "no-store" } })
}
