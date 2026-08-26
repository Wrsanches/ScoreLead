import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { whatsappSignupNonce } from "@/lib/db/schema"
import { can, getUserPlan } from "@/lib/plan"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { getBusinessAccess } from "@/lib/business-access"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const access = await getBusinessAccess(session.user.id, id)
  if (!access || access.readOnly) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }
  if (!access.isPlatformAdmin && !hasWhatsAppEarlyAccess(access.ownerEmail)) {
    return NextResponse.json(
      { error: "WhatsApp integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
      { status: 403 },
    )
  }
  if (!can(await getUserPlan(access.ownerUserId), "whatsappAutomation")) {
    return NextResponse.json({ error: "WhatsApp automation requires Growth or Pro", code: "PLAN_LIMIT", action: "whatsappAutomation" }, { status: 402 })
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
