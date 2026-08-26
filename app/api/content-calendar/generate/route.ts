import { and, desc, eq, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse, after } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { contentPlanJob } from "@/lib/db/schema"
import { resolveManageableBusiness } from "@/lib/active-business"
import { assertCanUse, recordUsage, releaseUsage, PlanLimitError } from "@/lib/plan"
import {
  processContentPlanQueue,
  serializeJob,
} from "@/lib/jobs/content-plan-queue"

/**
 * Start an AI content-plan generation for a month.
 *
 * The work runs in a queue rather than in this request: generation is a single
 * long LLM call, and doing it inline meant closing the tab lost the plan. This
 * enqueues a job, returns 202, and the client polls
 * `GET /api/content-calendar` (which carries the job) so leaving and coming back
 * shows either the run in progress or the finished posts.
 */

const schema = z.object({
  businessId: z.string().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  postCount: z.number().int().min(4).max(40).optional(),
  replaceExisting: z.boolean().optional(),
})

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const access = await resolveManageableBusiness(
    session.user.id,
    body?.businessId,
  )
  if (!access) {
    return NextResponse.json(
      { error: "Complete onboarding before planning content." },
      { status: 409 },
    )
  }
  const activeBusinessId = access.businessId
  const billingUserId = access.ownerUserId

  const month = parsed.data.month ?? currentMonthKey()

  // Already generating this month? Hand back the running job instead of
  // starting a second one. This is what makes the button safe to press again
  // after a reload, and it costs no extra plan credit.
  const [existing] = await db
    .select()
    .from(contentPlanJob)
    .where(
      and(
        eq(contentPlanJob.businessId, activeBusinessId),
        eq(contentPlanJob.month, month),
        inArray(contentPlanJob.status, ["queued", "running"]),
      ),
    )
    .orderBy(desc(contentPlanJob.createdAt))
  if (existing) {
    after(() => processContentPlanQueue())
    return NextResponse.json({ job: serializeJob(existing) }, { status: 202 })
  }

  try {
    await assertCanUse(billingUserId, "contentPlan")
  } catch (e) {
    if (e instanceof PlanLimitError) {
      return NextResponse.json(
        {
          error: "You've used your content plans for this period. Upgrade for more.",
          code: "PLAN_LIMIT",
          action: e.action,
        },
        { status: 402 },
      )
    }
    throw e
  }

  // Charge on enqueue so concurrent requests can't both slip past the cap; the
  // worker refunds via releaseUsage if the job ultimately fails.
  await recordUsage(billingUserId, "contentPlan")

  const jobId = crypto.randomUUID()
  try {
    await db.insert(contentPlanJob).values({
      id: jobId,
      businessId: activeBusinessId,
      userId: access.ownerUserId,
      month,
      postCount: parsed.data.postCount ?? null,
      replaceExisting: parsed.data.replaceExisting ?? false,
      status: "queued",
    })
  } catch (e) {
    // Lost a race against a concurrent request: the partial unique index on
    // (businessId, month) WHERE status IN ('queued','running') rejected us.
    // Give the credit back and return the job that won.
    await releaseUsage(billingUserId, "contentPlan").catch(() => {})
    const [winner] = await db
      .select()
      .from(contentPlanJob)
      .where(
        and(
          eq(contentPlanJob.businessId, activeBusinessId),
          eq(contentPlanJob.month, month),
          inArray(contentPlanJob.status, ["queued", "running"]),
        ),
      )
      .orderBy(desc(contentPlanJob.createdAt))
    if (winner) {
      after(() => processContentPlanQueue())
      return NextResponse.json({ job: serializeJob(winner) }, { status: 202 })
    }
    throw e
  }

  const [job] = await db
    .select()
    .from(contentPlanJob)
    .where(eq(contentPlanJob.id, jobId))

  // The job is queued; the pump claims and runs it after this response is sent,
  // so it survives the client navigating away or closing the tab.
  after(() => processContentPlanQueue())

  return NextResponse.json({ job: serializeJob(job) }, { status: 202 })
}
