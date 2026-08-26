import { after } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob } from "@/lib/db/schema"
import { eq, and, inArray, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { processDiscoveryQueue } from "@/lib/jobs/discovery-queue"
import { can, getUserPlan } from "@/lib/plan"
import { getBusinessAccess } from "@/lib/business-access"

/**
 * Run the next batch of an existing discovery job ("Continue"). Re-queues the
 * same row so the pipeline pages one level deeper and accumulates new leads.
 * Growth and up; does NOT consume another discoveryJob usage credit.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const [job] = await db
    .select()
    .from(discoveryJob)
    .where(eq(discoveryJob.id, id))

  const access = job
    ? await getBusinessAccess(session.user.id, job.businessId)
    : null

  if (!job || !access || access.readOnly) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  // Continuing a batch unlocks at Growth.
  const plan = await getUserPlan(access.ownerUserId)
  if (!can(plan, "continueJob")) {
    return NextResponse.json(
      {
        error: "Upgrade to Growth to keep discovering more leads in this area.",
        code: "PLAN_LIMIT",
        action: "continueJob",
      },
      { status: 402 },
    )
  }

  if (job.exhausted) {
    return NextResponse.json(
      { error: "No more new leads to find in this area." },
      { status: 400 },
    )
  }

  if (job.status === "running" || job.status === "queued" || job.status === "pending") {
    return NextResponse.json(
      { error: "Job is already working." },
      { status: 400 },
    )
  }

  // Atomic, concurrency-safe re-queue: only flips to queued if the row is
  // still in a continuable state, so a double-click can't queue it twice.
  const requeued = await db
    .update(discoveryJob)
    .set({
      status: "queued",
      runs: sql`${discoveryJob.runs} + 1`,
      currentQuery: null,
      errorMessage: null,
    })
    .where(
      and(
        eq(discoveryJob.id, id),
        inArray(discoveryJob.status, ["partial", "completed"]),
        eq(discoveryJob.exhausted, false),
      ),
    )
    .returning({ id: discoveryJob.id })

  if (requeued.length === 0) {
    return NextResponse.json(
      { error: "Job can no longer be continued." },
      { status: 409 },
    )
  }

  // Drain the queue out-of-band, mirroring the start route.
  after(() => processDiscoveryQueue())

  return NextResponse.json({ jobId: id }, { status: 202 })
}
