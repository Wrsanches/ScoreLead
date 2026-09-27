import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { business, lead, user, whatsappTemplate } from "@/lib/db/schema";
import { can, getUserPlan } from "@/lib/plan";
import { canManageBusiness } from "@/lib/business-access";
import { allowedRecipients } from "@/lib/resend/render";
import { getResendConnection, isSuppressed } from "@/lib/resend/data";
import { isResendIntegrationEnabled } from "@/lib/resend/feature-access";
import {
  getWhatsAppConnection,
  getLatestWhatsAppConsent,
} from "@/lib/whatsapp/data";
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access";
import type { Agent, AgentGraph, AudienceLead } from "./model";
import { AgentError } from "./store";
export async function businessContext(businessId: string, actorId: string) {
  if (!(await canManageBusiness(actorId, businessId)))
    throw new AgentError("FORBIDDEN", 403);
  const [row] = await db
    .select({ business, owner: user })
    .from(business)
    .innerJoin(user, eq(business.userId, user.id))
    .where(eq(business.id, businessId));
  if (!row) throw new AgentError("NOT_FOUND", 404);
  return { ...row, plan: await getUserPlan(row.owner.id) };
}
export async function leadContext(businessId: string, leadId: string) {
  const [row] = await db
    .select()
    .from(lead)
    .where(and(eq(lead.id, leadId), eq(lead.businessId, businessId)));
  if (!row) throw new AgentError("LEAD_NOT_FOUND", 404);
  const recipients = allowedRecipients(row);
  let email: string | undefined;
  for (const address of recipients) {
    if (!(await isSuppressed(businessId, address))) {
      email = address;
      break;
    }
  }
  const consent = await getLatestWhatsAppConsent(leadId);
  const audience: AudienceLead = {
    ...row,
    emailEligible: !!email,
    whatsappEligible: consent?.status === "granted",
  };
  return { lead: row, email, consent, audience };
}
export async function validateChannel(
  businessId: string,
  actorId: string,
  agent: Agent,
) {
  const ctx = await businessContext(businessId, actorId);
  if (agent.kind === "discovery" && !ctx.business.onboardingCompleted)
    throw new AgentError("BUSINESS_INCOMPLETE", 409);
  if (agent.kind === "email") {
    if (!can(ctx.plan, "emailOutreach") || !isResendIntegrationEnabled())
      throw new AgentError("EMAIL_UNAVAILABLE", 409);
    const c = await getResendConnection(businessId);
    if (!c || c.status !== "connected" || c.domainStatus !== "verified")
      throw new AgentError("EMAIL_NOT_CONNECTED", 409);
  }
  if (agent.kind === "whatsapp") {
    if (
      !can(ctx.plan, "whatsappAutomation") ||
      !hasWhatsAppEarlyAccess(ctx.owner.email)
    )
      throw new AgentError("WHATSAPP_UNAVAILABLE", 409);
    const c = await getWhatsAppConnection(businessId);
    if (!c || c.status !== "connected")
      throw new AgentError("WHATSAPP_NOT_CONNECTED", 409);
    const [t] = await db
      .select()
      .from(whatsappTemplate)
      .where(
        and(
          eq(whatsappTemplate.id, agent.templateId),
          eq(whatsappTemplate.connectionId, c.id),
          eq(whatsappTemplate.status, "APPROVED"),
          eq(whatsappTemplate.supported, true),
        ),
      );
    if (!t) throw new AgentError("TEMPLATE_UNAVAILABLE", 409);
  }
  return ctx;
}
export async function validatePublish(
  businessId: string,
  actorId: string,
  graph: AgentGraph,
) {
  if (!graph.nodes.length) throw new AgentError("EMPTY_GRAPH");
  for (const a of graph.nodes) {
    if (!a.schedule.timezoneConfirmed) throw new AgentError("TIMEZONE_CONFIRM");
    if (
      a.kind === "discovery" &&
      (!a.country.trim() || !a.location.trim() || !a.keywords.length)
    )
      throw new AgentError("DISCOVERY_CONFIG");
    if ((a.kind === "email" || a.kind === "whatsapp") && !a.instructions.trim())
      throw new AgentError("INSTRUCTIONS_REQUIRED");
    if (a.kind === "stage" && a.from === a.to)
      throw new AgentError("SAME_STAGE");
    await validateChannel(businessId, actorId, a);
  }
}
