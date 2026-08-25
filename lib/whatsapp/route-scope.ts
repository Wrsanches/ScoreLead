import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { can, getUserPlan } from "@/lib/plan"
import { getWhatsAppConnection } from "@/lib/whatsapp/data"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { getBusinessAccess } from "@/lib/business-access"

/**
 * Shared guard for WhatsApp business routes: authenticated session, business
 * ownership, a plan that unlocks WhatsApp automation (Growth and up), and a
 * connected WhatsApp integration. Returns either an
 * `error` NextResponse to return immediately, or the session + connection.
 */
export async function scopeWhatsAppRoute(
  businessId: string,
  mode: "view" | "manage" = "manage",
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const
  }
  const access = await getBusinessAccess(session.user.id, businessId)
  if (!access || (mode === "manage" && access.readOnly)) {
    return { error: NextResponse.json({ error: "Business not found" }, { status: 404 }) } as const
  }
  if (
    !access.isPlatformAdmin &&
    !hasWhatsAppEarlyAccess(access.ownerEmail)
  ) {
    return {
      error: NextResponse.json(
        { error: "WhatsApp integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
        { status: 403 },
      ),
    } as const
  }
  if (!can(await getUserPlan(access.ownerUserId), "whatsappAutomation")) {
    return {
      error: NextResponse.json(
        {
          error: "WhatsApp automation requires Growth or Pro",
          code: "PLAN_LIMIT",
          action: "whatsappAutomation",
        },
        { status: 402 },
      ),
    } as const
  }
  const connection = await getWhatsAppConnection(businessId)
  if (!connection || connection.status !== "connected") {
    return {
      error: NextResponse.json({ error: "WhatsApp is not connected" }, { status: 409 }),
    } as const
  }
  return { session, connection, access } as const
}
