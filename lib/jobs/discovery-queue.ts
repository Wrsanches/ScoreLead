import { sql, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { business, discoveryJob } from "@/lib/db/schema"
import { runDiscoveryJob } from "@/lib/services/discovery-pipeline"

/**
 * Postgres-backed queue for discovery jobs.
 *
 * Jobs are inserted as "queued" and claimed atomically with
 * FOR UPDATE SKIP LOCKED, so any number of instances can pump the queue
 * without double-running a job. Two caps keep load bounded:
 *  - a global cap on concurrently running jobs (protects our server and
 *    the third-party APIs the pipeline hammers)
 *  - one running job per user (one user can't monopolize the slots)
 *
 * Workers heartbeat through the pipeline's progress writes; jobs whose
 * heartbeat goes stale (killed instance, crash) are requeued up to
 * MAX_ATTEMPTS, then failed.
 */

const MAX_CONCURRENT_JOBS = Math.max(
  1,
  Number(process.env.DISCOVERY_MAX_CONCURRENT ?? 3),
)
const MAX_ATTEMPTS = 3
const STALE_MINUTES = 10

async function requeueStaleJobs() {
  await db.execute(sql`
    UPDATE discovery_job SET
      status = CASE WHEN attempts >= ${MAX_ATTEMPTS} THEN 'failed' ELSE 'queued' END,
      "errorMessage" = CASE
        WHEN attempts >= ${MAX_ATTEMPTS}
        THEN 'Job stalled and exceeded the retry limit'
        ELSE "errorMessage"
      END,
      "completedAt" = CASE WHEN attempts >= ${MAX_ATTEMPTS} THEN now() ELSE "completedAt" END
    WHERE status = 'running'
      AND "heartbeatAt" < now() - (${STALE_MINUTES} * interval '1 minute')
  `)
}

/**
 * Atomically claim the oldest queued job, respecting the global and
 * per-user concurrency caps. Returns the claimed job id, or null when
 * nothing is claimable.
 */
async function claimNextJob(): Promise<string | null> {
  const result = await db.execute<{ id: string }>(sql`
    UPDATE discovery_job SET
      status = 'running',
      attempts = attempts + 1,
      "startedAt" = COALESCE("startedAt", now()),
      "heartbeatAt" = now()
    WHERE id = (
      SELECT j.id FROM discovery_job j
      WHERE j.status = 'queued'
        AND (SELECT count(*) FROM discovery_job r WHERE r.status = 'running') < ${MAX_CONCURRENT_JOBS}
        AND NOT EXISTS (
          SELECT 1 FROM discovery_job r
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

async function executeJob(jobId: string) {
  const [job] = await db
    .select()
    .from(discoveryJob)
    .where(eq(discoveryJob.id, jobId))
  if (!job) return

  const [biz] = await db
    .select()
    .from(business)
    .where(eq(business.id, job.businessId))

  if (!biz) {
    await db
      .update(discoveryJob)
      .set({
        status: "failed",
        errorMessage: "Business no longer exists",
        completedAt: new Date(),
      })
      .where(eq(discoveryJob.id, jobId))
    return
  }

  let keywords: string[]
  try {
    keywords = JSON.parse(job.keywords)
  } catch {
    keywords = []
  }

  try {
    await runDiscoveryJob(jobId, {
      business: {
        id: biz.id,
        name: biz.name,
        description: biz.description,
        persona: biz.persona,
        clientPersona: biz.clientPersona,
        field: biz.field,
        category: biz.category,
        tags: biz.tags,
        businessModel: biz.businessModel,
        services: biz.services,
        serviceArea: biz.serviceArea,
        location: biz.location,
        language: biz.language,
        competitors: biz.competitors,
        website: biz.website,
      },
      keywords,
      location: job.location,
      maxResults: job.maxResults,
    })
  } catch (error) {
    // runDiscoveryJob already marked the job failed; just log here.
    console.error(`[discovery-queue] job ${jobId.slice(0, 8)} failed:`, error)
  }
}

// Avoid redundant pumps from the same instance (e.g. several status polls
// landing at once). Claims are atomic, so this is purely an optimization.
let pumping = false

/**
 * Drain the queue: claim jobs up to the concurrency caps and run them.
 * Safe to call from anywhere (job creation, status polls, cron) - it's a
 * no-op when there's nothing claimable.
 */
export async function processDiscoveryQueue() {
  if (pumping) return
  pumping = true
  try {
    await requeueStaleJobs()

    let claimed: string[]
    do {
      claimed = []
      // Claim as many jobs as the caps allow, then run them concurrently.
      for (let i = 0; i < MAX_CONCURRENT_JOBS; i++) {
        const jobId = await claimNextJob()
        if (!jobId) break
        claimed.push(jobId)
      }
      if (claimed.length > 0) {
        console.log(`[discovery-queue] running ${claimed.length} job(s)`)
        await Promise.allSettled(claimed.map((id) => executeJob(id)))
      }
      // Loop again: jobs queued while we were running (or freed per-user
      // slots) may be claimable now.
    } while (claimed.length > 0)
  } finally {
    pumping = false
  }
}

let lastPumpAt = 0

/**
 * Throttled pump for hot paths like job-status polling: recovers stalled
 * or stranded queued jobs without adding queue queries to every poll.
 */
export async function pumpQueueIfDue(intervalMs = 30_000) {
  const now = Date.now()
  if (now - lastPumpAt < intervalMs) return
  lastPumpAt = now
  await processDiscoveryQueue()
}
