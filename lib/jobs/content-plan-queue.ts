import { and, eq, gte, isNull, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { business, contentPlanJob, contentPost } from "@/lib/db/schema"
import { generateContentPlan } from "@/lib/services/content-calendar-generator"
import { removePublicImage } from "@/lib/services/content-image-generator"
import { releaseUsage } from "@/lib/plan"

/**
 * Postgres-backed queue for AI content-plan generation.
 *
 * Generation is one long LLM call, so it cannot run inside the request that
 * starts it: the user navigates away or closes the tab and the work dies with
 * the connection. The route enqueues a `content_plan_job` row and returns 202;
 * this worker claims it with FOR UPDATE SKIP LOCKED so any number of instances
 * can pump without double-running, and the page polls the job to show progress
 * or the finished posts when the user comes back.
 *
 * Because the LLM call reports no intermediate progress, the worker bumps
 * heartbeatAt on a timer while it waits - otherwise a slow-but-healthy run
 * would look stalled and get requeued underneath itself.
 */

const MAX_CONCURRENT_JOBS = Math.max(
  1,
  Number(process.env.CONTENT_PLAN_MAX_CONCURRENT ?? 2),
)
const MAX_ATTEMPTS = 3
const STALE_MINUTES = 10
const HEARTBEAT_MS = 30_000
/** Backoff before a requeued job becomes claimable again (per attempt). */
const RETRY_BACKOFF_MINUTES = 2

/** The job shape the calendar UI consumes. */
export function serializeJob(job: typeof contentPlanJob.$inferSelect) {
  return {
    id: job.id,
    month: job.month,
    status: job.status,
    insertedPosts: job.insertedPosts,
    postIds: job.postIds ?? [],
    errorMessage: job.errorMessage,
    createdAt: job.createdAt?.toISOString() ?? null,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  }
}

export type ContentPlanJobView = ReturnType<typeof serializeJob>

/** UTC month bounds for a "YYYY-MM" key. */
export function monthBounds(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number)
  return {
    start: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)),
    end: new Date(Date.UTC(y, m, 1, 0, 0, 0)),
  }
}

/**
 * Requeue jobs whose worker died mid-run, and fail the ones that have burned
 * through their attempts. Refunding the content-plan credit for the terminal
 * failures is handled by the caller-visible sweep below, so this only moves
 * status.
 */
async function requeueStaleJobs() {
  const exhausted = await db.execute<{ id: string; userId: string }>(sql`
    UPDATE content_plan_job SET
      status = 'failed',
      "errorMessage" = 'Generation stalled and exceeded the retry limit',
      "completedAt" = now()
    WHERE status = 'running'
      AND "heartbeatAt" < now() - (${STALE_MINUTES} * interval '1 minute')
      AND attempts >= ${MAX_ATTEMPTS}
    RETURNING id, "userId"
  `)

  // No backoff here: a job stranded by a killed instance has already waited out
  // STALE_MINUTES, so make it immediately claimable rather than delaying the
  // recovery a user is sitting there waiting for.
  await db.execute(sql`
    UPDATE content_plan_job SET
      status = 'queued',
      "nextAttemptAt" = NULL
    WHERE status = 'running'
      AND "heartbeatAt" < now() - (${STALE_MINUTES} * interval '1 minute')
      AND attempts < ${MAX_ATTEMPTS}
  `)

  // A job that will never run should not keep the credit it reserved.
  for (const row of exhausted.rows) {
    await releaseUsage(row.userId, "contentPlan").catch(() => {})
  }
}

/**
 * Atomically claim the oldest queued job, respecting the global cap and one
 * running job per user.
 */
async function claimNextJob(): Promise<string | null> {
  const result = await db.execute<{ id: string }>(sql`
    UPDATE content_plan_job SET
      status = 'running',
      attempts = attempts + 1,
      "startedAt" = COALESCE("startedAt", now()),
      "heartbeatAt" = now()
    WHERE id = (
      SELECT j.id FROM content_plan_job j
      WHERE j.status = 'queued'
        AND (j."nextAttemptAt" IS NULL OR j."nextAttemptAt" <= now())
        AND (SELECT count(*) FROM content_plan_job r WHERE r.status = 'running') < ${MAX_CONCURRENT_JOBS}
        AND NOT EXISTS (
          SELECT 1 FROM content_plan_job r
          WHERE r.status = 'running' AND r."userId" = j."userId"
        )
      ORDER BY j."createdAt"
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `)
  return result.rows[0]?.id ?? null
}

/**
 * Drop this month's untouched AI drafts so a regeneration replaces them.
 *
 * "Untouched" means aiGenerated, still draft, no images, and never edited
 * beyond the original insert (updatedAt within ~30s of createdAt). Anything the
 * user actually worked on survives a regenerate.
 */
async function clearUntouchedDrafts(
  userId: string,
  businessId: string,
  start: Date,
  end: Date,
) {
  const untouched = and(
    eq(contentPost.userId, userId),
    eq(contentPost.businessId, businessId),
    eq(contentPost.aiGenerated, true),
    eq(contentPost.status, "draft"),
    isNull(contentPost.images),
    gte(contentPost.scheduledFor, start),
    lt(contentPost.scheduledFor, end),
    sql`${contentPost.updatedAt} <= ${contentPost.createdAt} + interval '30 seconds'`,
  )

  const stale = await db.select().from(contentPost).where(untouched)
  if (stale.length === 0) return

  await Promise.all(
    stale.flatMap((p) => (p.images ?? []).map((img) => removePublicImage(img.url))),
  )
  await db.delete(contentPost).where(untouched)
}

async function executeJob(jobId: string) {
  const [job] = await db
    .select()
    .from(contentPlanJob)
    .where(eq(contentPlanJob.id, jobId))
  if (!job) return

  const fail = async (message: string) => {
    // Retry a transient failure; only give up (and refund) on the last attempt.
    const terminal = job.attempts >= MAX_ATTEMPTS
    await db
      .update(contentPlanJob)
      .set({
        status: terminal ? "failed" : "queued",
        errorMessage: message,
        completedAt: terminal ? new Date() : null,
        // Hold the retry back so this pump's drain loop can't immediately
        // re-claim it and spend the remaining attempts on the same outage.
        nextAttemptAt: terminal
          ? null
          : new Date(Date.now() + job.attempts * RETRY_BACKOFF_MINUTES * 60_000),
      })
      .where(eq(contentPlanJob.id, jobId))
    if (terminal) await releaseUsage(job.userId, "contentPlan").catch(() => {})
  }

  const [biz] = await db
    .select()
    .from(business)
    .where(eq(business.id, job.businessId))
  if (!biz) {
    // Never going to succeed - fail it outright rather than burning retries.
    await db
      .update(contentPlanJob)
      .set({
        status: "failed",
        errorMessage: "Business no longer exists",
        completedAt: new Date(),
      })
      .where(eq(contentPlanJob.id, jobId))
    await releaseUsage(job.userId, "contentPlan").catch(() => {})
    return
  }

  const { start, end } = monthBounds(job.month)

  // The LLM call is opaque and can run for minutes; keep the row looking alive
  // so the stale sweep doesn't requeue a job that is still working.
  const heartbeat = setInterval(() => {
    db.update(contentPlanJob)
      .set({ heartbeatAt: new Date() })
      .where(eq(contentPlanJob.id, jobId))
      .catch(() => {})
  }, HEARTBEAT_MS)

  try {
    const plan = await generateContentPlan(
      {
        name: biz.name,
        description: biz.description,
        persona: biz.persona,
        clientPersona: biz.clientPersona,
        field: biz.field,
        category: biz.category,
        tags: biz.tags,
        services: biz.services,
        location: biz.location,
        language: biz.language,
        brandStyle: biz.brandStyle,
        brandColorPrimary: biz.brandColorPrimary,
        brandColorSecondary: biz.brandColorSecondary,
        instagram: biz.instagram,
      },
      start,
      end,
      // undefined lets the model pick a count tuned to the profile and month.
      job.postCount ?? undefined,
    )

    if (plan.length === 0) {
      await fail("Content generation returned nothing. Try again.")
      return
    }

    if (job.replaceExisting) {
      await clearUntouchedDrafts(job.userId, job.businessId, start, end)
    }

    const toInsert = plan.map((p) => ({
      id: crypto.randomUUID(),
      userId: job.userId,
      businessId: job.businessId,
      provider: "instagram",
      scheduledFor: p.scheduledFor,
      postType: p.postType,
      pillar: p.pillar,
      caption: p.caption,
      hashtags: p.hashtags,
      visualIdea: p.visualIdea,
      callToAction: p.callToAction,
      status: "draft",
      aiGenerated: true,
    }))

    await db.insert(contentPost).values(toInsert)

    await db
      .update(contentPlanJob)
      .set({
        status: "completed",
        insertedPosts: toInsert.length,
        postIds: toInsert.map((p) => p.id),
        errorMessage: null,
        completedAt: new Date(),
        heartbeatAt: new Date(),
        nextAttemptAt: null,
      })
      .where(eq(contentPlanJob.id, jobId))

    console.log(
      `[content-plan-queue] job ${jobId.slice(0, 8)} inserted ${toInsert.length} post(s)`,
    )
  } catch (error) {
    console.error(`[content-plan-queue] job ${jobId.slice(0, 8)} failed:`, error)
    await fail(error instanceof Error ? error.message : "Generation failed")
  } finally {
    clearInterval(heartbeat)
  }
}

// Avoid redundant pumps from the same instance (e.g. several status polls
// landing at once). Claims are atomic, so this is purely an optimization.
let pumping = false

/**
 * Drain the queue: claim jobs up to the concurrency caps and run them. Safe to
 * call from anywhere (job creation, status polls, cron) - a no-op when there is
 * nothing claimable.
 */
export async function processContentPlanQueue() {
  if (pumping) return
  pumping = true
  try {
    await requeueStaleJobs()

    let claimed: string[]
    do {
      claimed = []
      for (let i = 0; i < MAX_CONCURRENT_JOBS; i++) {
        const jobId = await claimNextJob()
        if (!jobId) break
        claimed.push(jobId)
      }
      if (claimed.length > 0) {
        console.log(`[content-plan-queue] running ${claimed.length} job(s)`)
        await Promise.allSettled(claimed.map((id) => executeJob(id)))
      }
      // Jobs queued while we were running (or freed per-user slots) may be
      // claimable now.
    } while (claimed.length > 0)
  } finally {
    pumping = false
  }
}

let lastPumpAt = 0

/**
 * Throttled pump for hot paths like the calendar load: recovers stalled or
 * stranded jobs without adding queue queries to every request.
 */
export async function pumpContentPlanQueueIfDue(intervalMs = 30_000) {
  const now = Date.now()
  if (now - lastPumpAt < intervalMs) return
  lastPumpAt = now
  await processContentPlanQueue()
}
