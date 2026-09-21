import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { can, getUserPlan } from "@/lib/plan"
import { getManageableLead } from "@/lib/whatsapp/data"
import { getEmailTemplate, getResendConnection } from "@/lib/resend/data"
import { isResendIntegrationEnabled } from "@/lib/resend/feature-access"
import { allowedRecipients } from "@/lib/resend/render"

/**
 * Validation ladder shared by the lead-level email routes, mirroring the
 * WhatsApp send route: session, manageable lead, rollout flag, the owner's
 * plan, a connected account, and a template that belongs to the business.
 */
export async function scopeLeadEmail(leadId: string, templateId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const
  const manageable = await getManageableLead(leadId, session.user.id)
  if (!manageable) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const
  const { lead, access } = manageable
  if (!access.isPlatformAdmin && !isResendIntegrationEnabled()) {
    return {
      error: NextResponse.json(
        { error: "Email integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
        { status: 403 },
      ),
    } as const
  }
  if (!can(await getUserPlan(access.ownerUserId), "emailOutreach")) {
    return {
      error: NextResponse.json(
        { error: "Email outreach requires Growth or Pro", code: "PLAN_LIMIT", action: "emailOutreach" },
        { status: 402 },
      ),
    } as const
  }
  const connection = await getResendConnection(lead.businessId)
  if (!connection || connection.status === "disconnected") {
    return {
      error: NextResponse.json({ error: "Resend is not connected", code: "NOT_CONNECTED" }, { status: 409 }),
    } as const
  }
  const template = await getEmailTemplate(lead.businessId, templateId)
  if (!template) return { error: NextResponse.json({ error: "Template not found" }, { status: 404 }) } as const
  const [biz] = await db.select().from(business).where(eq(business.id, lead.businessId)).limit(1)
  if (!biz) return { error: NextResponse.json({ error: "Business not found" }, { status: 404 }) } as const
  return {
    session,
    lead,
    access,
    connection,
    template,
    business: biz,
    recipients: allowedRecipients(lead),
  } as const
}
