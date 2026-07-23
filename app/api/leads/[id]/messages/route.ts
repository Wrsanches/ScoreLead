import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lead, discoveryJob, business } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import {
  generateOutreachMessages,
  type OutreachMessage,
  type OutreachLead,
  type OutreachSender,
} from "@/lib/services/outreach-messages"
import { assertCanUse, recordUsage, PlanLimitError } from "@/lib/plan"
import { getBusinessAccess } from "@/lib/business-access"

export const maxDuration = 60

/** Verify the lead belongs to one of the signed-in user's discovery jobs. */
async function assertLeadOwnership(leadId: string, userId: string) {
  const userJobs = await db
    .select({ id: discoveryJob.id })
    .from(discoveryJob)
    .where(eq(discoveryJob.userId, userId))

  if (userJobs.length === 0) return null

  const [row] = await db
    .select()
    .from(lead)
    .where(
      and(
        eq(lead.id, leadId),
        inArray(
          lead.jobId,
          userJobs.map((j) => j.id),
        ),
      ),
    )

  return row || null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const [row] = await db.select().from(lead).where(eq(lead.id, id)).limit(1)
  const access = row
    ? await getBusinessAccess(session.user.id, row.businessId)
    : null
  if (!row || !access) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  return NextResponse.json({ messages: row.outreachMessages ?? [] })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const row = await assertLeadOwnership(id, session.user.id)
  if (!row) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  // Gate: Free allows 3 AI outreach generations total.
  try {
    await assertCanUse(session.user.id, "outreachMessage")
  } catch (e) {
    if (e instanceof PlanLimitError) {
      return NextResponse.json(
        {
          error: "You've used your free outreach messages. Upgrade to Pro for unlimited.",
          code: "PLAN_LIMIT",
          action: e.action,
        },
        { status: 402 },
      )
    }
    throw e
  }

  // Fetch the sender's business profile so the prompt knows who is writing.
  const [senderBusiness] = await db
    .select()
    .from(business)
    .where(eq(business.id, row.businessId))

  if (!senderBusiness) {
    return NextResponse.json(
      { error: "Business profile not found for this lead." },
      { status: 400 },
    )
  }

  const sender: OutreachSender = {
    name: senderBusiness.name,
    description: senderBusiness.description,
    persona: senderBusiness.persona,
    clientPersona: senderBusiness.clientPersona,
    field: senderBusiness.field,
    category: senderBusiness.category,
    services: senderBusiness.services,
    website: senderBusiness.website,
    language: senderBusiness.language,
  }

  const recipient: OutreachLead = {
    name: row.name,
    ownerName: row.ownerName,
    city: row.city,
    state: row.state,
    country: row.country,
    description: row.description,
    services: row.services,
    googleRating: row.googleRating,
    googleReviewCount: row.googleReviewCount,
    instagramHandle: row.instagramHandle,
    website: row.website,
    pricingInfo: row.pricingInfo,
    yearEstablished: row.yearEstablished,
    amenities: row.amenities,
    aiSummary: row.aiSummary,
    operatingHours: row.operatingHours,
    teamMembers: row.teamMembers,
  }

  const messages = await generateOutreachMessages(sender, recipient)

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Failed to generate messages. Check OpenAI key and try again." },
      { status: 500 },
    )
  }

  await recordUsage(session.user.id, "outreachMessage")

  await db
    .update(lead)
    .set({ outreachMessages: messages })
    .where(eq(lead.id, id))

  return NextResponse.json({ messages })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const row = await assertLeadOwnership(id, session.user.id)
  if (!row) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as { messages?: unknown } | null
  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 })
  }

  // Sanitize payload — only keep fields we store.
  const sanitized: OutreachMessage[] = (body.messages as Array<Record<string, unknown>>)
    .filter((m) => typeof m.step === "number" && typeof m.body === "string")
    .map((m) => ({
      step: m.step as number,
      label: typeof m.label === "string" ? m.label : String(m.step),
      subject: typeof m.subject === "string" ? m.subject : undefined,
      body: m.body as string,
    }))

  await db
    .update(lead)
    .set({ outreachMessages: sanitized })
    .where(eq(lead.id, id))

  return NextResponse.json({ messages: sanitized })
}
