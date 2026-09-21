import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { can, getUserPlan } from "@/lib/plan"
import { getBusinessAccess } from "@/lib/business-access"
import { getResendConnection, type ResendConnectionRow } from "@/lib/resend/data"
import { isResendIntegrationEnabled } from "@/lib/resend/feature-access"

/**
 * Shared guard for Resend business routes, in the same order as the WhatsApp
 * guard: session, business access (read-only viewers cannot manage), rollout
 * flag, the owner's plan, and optionally a connected account.
 */
export async function scopeResendRoute(
  businessId: string,
  mode: "view" | "manage" = "manage",
  options: { requireConnection?: boolean } = {},
) {
  const requireConnection = options.requireConnection ?? true
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const
  }
  const access = await getBusinessAccess(session.user.id, businessId)
  if (!access || (mode === "manage" && access.readOnly)) {
    return { error: NextResponse.json({ error: "Business not found" }, { status: 404 }) } as const
  }
  if (!access.isPlatformAdmin && !isResendIntegrationEnabled()) {
    return {
      error: NextResponse.json(
        { error: "Email integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
        { status: 403 },
      ),
    } as const
  }
  const plan = await getUserPlan(access.ownerUserId)
  if (!can(plan, "emailOutreach")) {
    return {
      error: NextResponse.json(
        { error: "Email outreach requires Growth or Pro", code: "PLAN_LIMIT", action: "emailOutreach" },
        { status: 402 },
      ),
    } as const
  }
  const connection: ResendConnectionRow | null = await getResendConnection(businessId)
  if (requireConnection && (!connection || connection.status === "disconnected")) {
    return {
      error: NextResponse.json({ error: "Resend is not connected", code: "NOT_CONNECTED" }, { status: 409 }),
    } as const
  }
  return { session, access, plan, connection } as const
}
