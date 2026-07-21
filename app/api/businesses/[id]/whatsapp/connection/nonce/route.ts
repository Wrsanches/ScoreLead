import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { whatsappSignupNonce } from "@/lib/db/schema"
import { getUserPlan } from "@/lib/plan"
import { getOwnedBusiness } from "@/lib/whatsapp/data"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (await getUserPlan(session.user.id) !== "pro") {
    return NextResponse.json({ error: "WhatsApp automation requires Pro", code: "PLAN_LIMIT" }, { status: 402 })
  }
  const { id } = await params
  if (!(await getOwnedBusiness(id, session.user.id))) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }
  const appId = process.env.META_APP_ID
  const configId = process.env.META_WHATSAPP_CONFIG_ID
  if (!appId || !configId || !process.env.META_APP_SECRET) {
    return NextResponse.json({ error: "WhatsApp is not configured on this server" }, { status: 503 })
  }

  const nonce = randomUUID()
  await db.insert(whatsappSignupNonce).values({
    id: nonce,
    businessId: id,
    userId: session.user.id,
    expiresAt: new Date(Date.now() + 10 * 60_000),
  })
  return NextResponse.json({
    nonce,
    appId,
    configId,
    graphVersion: process.env.META_GRAPH_API_VERSION || "v23.0",
  })
}
