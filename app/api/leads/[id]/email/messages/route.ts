import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getViewableLead } from "@/lib/whatsapp/data"
import { listLeadEmailMessages, publicEmailMessage } from "@/lib/resend/data"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const viewable = await getViewableLead(id, session.user.id)
  if (!viewable) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const messages = (await listLeadEmailMessages(id)).map(publicEmailMessage)
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } })
}
