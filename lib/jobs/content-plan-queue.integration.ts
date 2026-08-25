/**
 * Integration test for the content-plan queue. Needs a real database, so it is
 * deliberately NOT named *.test.ts - `bun test` must stay DB-free. Run it with:
 *
 *   bun test lib/jobs/content-plan-queue.integration.ts
 *
 * The OpenAI call is mocked, so this costs nothing.
 */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test"
import { and, eq, sql } from "drizzle-orm"

const BIZ = "zz-cpq-business"
const UID = "zz-cpq-user"
const MONTH = "2031-07"

// Mocked before the queue module is imported, so the worker picks up the stub.
let planLength = 3
let planThrows: string | null = null

mock.module("@/lib/services/content-calendar-generator", () => ({
  generateContentPlan: async () => {
    if (planThrows) throw new Error(planThrows)
    return Array.from({ length: planLength }, (_, i) => ({
      scheduledFor: new Date(Date.UTC(2031, 6, i + 1, 12)),
      postType: "single" as const,
      pillar: "educate" as const,
      caption: `caption ${i}`,
      hashtags: ["#a"],
      visualIdea: "idea",
      callToAction: "cta",
    }))
  },
}))
mock.module("@/lib/services/content-image-generator", () => ({
  removePublicImage: async () => {},
}))

// Loaded after mock.module has registered, so the worker picks up the stubs.
// (Static imports would be hoisted above the mocks and capture the real ones.)
type DbModule = typeof import("@/lib/db")
type SchemaModule = typeof import("@/lib/db/schema")
type QueueModule = typeof import("@/lib/jobs/content-plan-queue")
type PlanModule = typeof import("@/lib/plan")

let db: DbModule["db"]
let business: SchemaModule["business"]
let contentPlanJob: SchemaModule["contentPlanJob"]
let contentPost: SchemaModule["contentPost"]
let usage: SchemaModule["usage"]
let user: SchemaModule["user"]
let processContentPlanQueue: QueueModule["processContentPlanQueue"]
let getUsage: PlanModule["getUsage"]
let recordUsage: PlanModule["recordUsage"]

beforeAll(async () => {
  ;({ db } = await import("@/lib/db"))
  ;({ business, contentPlanJob, contentPost, usage, user } = await import(
    "@/lib/db/schema"
  ))
  ;({ processContentPlanQueue } = await import("@/lib/jobs/content-plan-queue"))
  ;({ getUsage, recordUsage } = await import("@/lib/plan"))
})

async function enqueue(overrides: Record<string, unknown> = {}) {
  const id = `zz-cpq-job-${Math.floor(Math.random() * 1e9)}`
  await db.insert(contentPlanJob).values({
    id,
    businessId: BIZ,
    userId: UID,
    month: MONTH,
    status: "queued",
    ...overrides,
  })
  return id
}

async function jobRow(id: string) {
  const [row] = await db
    .select()
    .from(contentPlanJob)
    .where(eq(contentPlanJob.id, id))
  return row
}

async function postCount() {
  const rows = await db
    .select()
    .from(contentPost)
    .where(and(eq(contentPost.businessId, BIZ), eq(contentPost.userId, UID)))
  return rows.length
}

async function cleanup() {
  await db.delete(contentPlanJob).where(eq(contentPlanJob.userId, UID))
  await db.delete(contentPost).where(eq(contentPost.userId, UID))
  await db.delete(usage).where(eq(usage.userId, UID))
  await db.delete(business).where(eq(business.id, BIZ))
  await db.delete(user).where(eq(user.id, UID))
}

beforeEach(async () => {
  planLength = 3
  planThrows = null
  await cleanup()
  await db.insert(user).values({
    id: UID, name: "CPQ", email: "zz-cpq@example.test",
    emailVerified: true, createdAt: new Date(), updatedAt: new Date(),
  })
  await db.insert(business).values({
    id: BIZ, userId: UID, name: "CPQ Studio",
    createdAt: new Date(), updatedAt: new Date(),
  })
})

afterAll(cleanup)

describe("content-plan queue", () => {
  test("runs a queued job to completion and records what it created", async () => {
    const id = await enqueue()
    await processContentPlanQueue()

    const job = await jobRow(id)
    expect(job.status).toBe("completed")
    expect(job.insertedPosts).toBe(3)
    expect(job.postIds).toHaveLength(3)
    expect(job.startedAt).not.toBeNull()
    expect(job.completedAt).not.toBeNull()
    expect(await postCount()).toBe(3)

    // postIds must be the rows that actually exist - Undo depends on it.
    const rows = await db
      .select()
      .from(contentPost)
      .where(eq(contentPost.businessId, BIZ))
    expect(new Set(job.postIds!)).toEqual(new Set(rows.map((r) => r.id)))
  })

  test("a second active job for the same business+month is rejected", async () => {
    await enqueue()
    // The partial unique index is the guard that stops a returning user from
    // starting a duplicate generation on top of the first.
    await expect(enqueue()).rejects.toThrow()
  })

  test("allows a new job once the previous one finished", async () => {
    const first = await enqueue()
    await processContentPlanQueue()
    expect((await jobRow(first)).status).toBe("completed")
    const second = await enqueue()
    expect(await jobRow(second)).toBeDefined()
  })

  test("a different month can generate concurrently", async () => {
    await enqueue()
    const other = await enqueue({ month: "2031-08" })
    expect(await jobRow(other)).toBeDefined()
  })

  test("replaceExisting drops untouched drafts but keeps edited ones", async () => {
    const keepEdited = "zz-cpq-keep-edited"
    const keepImage = "zz-cpq-keep-image"
    const drop = "zz-cpq-drop"
    const base = {
      userId: UID, businessId: BIZ, provider: "instagram",
      scheduledFor: new Date(Date.UTC(2031, 6, 15, 12)),
      postType: "single", caption: "x", status: "draft", aiGenerated: true,
    }
    await db.insert(contentPost).values([
      { ...base, id: drop },
      { ...base, id: keepImage, images: [{ url: "u", headline: "h", prompt: "p" }] },
      { ...base, id: keepEdited },
    ])
    // Simulate a real edit: updatedAt well past createdAt.
    await db.execute(
      sql`UPDATE content_post SET "updatedAt" = "createdAt" + interval '5 minutes' WHERE id = ${keepEdited}`,
    )

    const id = await enqueue({ replaceExisting: true })
    await processContentPlanQueue()
    expect((await jobRow(id)).status).toBe("completed")

    const surviving = await db
      .select({ id: contentPost.id })
      .from(contentPost)
      .where(eq(contentPost.businessId, BIZ))
    const ids = surviving.map((r) => r.id)
    expect(ids).toContain(keepEdited)
    expect(ids).toContain(keepImage)
    expect(ids).not.toContain(drop)
  })

  test("retries a transient failure instead of giving up", async () => {
    planThrows = "boom"
    const id = await enqueue()
    await processContentPlanQueue()

    const job = await jobRow(id)
    // Requeued for another attempt, not failed.
    expect(job.status).toBe("queued")
    expect(job.attempts).toBe(1)
    expect(job.errorMessage).toBe("boom")
    expect(await postCount()).toBe(0)
    // Backed off, so this pump's drain loop cannot immediately re-claim it and
    // spend the remaining attempts on the same outage.
    expect(job.nextAttemptAt).not.toBeNull()
    expect(job.nextAttemptAt!.getTime()).toBeGreaterThan(Date.now())
  })

  test("a backed-off retry is not claimable until its delay elapses", async () => {
    planThrows = "boom"
    const id = await enqueue()
    await processContentPlanQueue()
    expect((await jobRow(id)).attempts).toBe(1)

    // A second pump right away must leave it alone.
    await processContentPlanQueue()
    expect((await jobRow(id)).attempts).toBe(1)

    // Once the backoff passes it runs again - and now succeeds.
    planThrows = null
    await db.execute(
      sql`UPDATE content_plan_job SET "nextAttemptAt" = now() - interval '1 minute' WHERE id = ${id}`,
    )
    await processContentPlanQueue()

    const job = await jobRow(id)
    expect(job.status).toBe("completed")
    expect(job.attempts).toBe(2)
    expect(job.nextAttemptAt).toBeNull()
    expect(await postCount()).toBe(3)
  })

  test("fails and refunds the content-plan credit after the last attempt", async () => {
    planThrows = "permanent"
    // The route charges on enqueue; simulate that.
    await recordUsage(UID, "contentPlan")
    expect((await getUsage(UID)).contentPlans).toBe(1)

    const id = await enqueue({ attempts: 3 })
    await processContentPlanQueue()

    const job = await jobRow(id)
    expect(job.status).toBe("failed")
    expect(job.completedAt).not.toBeNull()
    // Credit given back, so a transient outage doesn't cost a scarce plan.
    expect((await getUsage(UID)).contentPlans).toBe(0)
  })

  test("an empty plan is treated as a failure, not a silent success", async () => {
    planLength = 0
    const id = await enqueue({ attempts: 3 })
    await processContentPlanQueue()

    const job = await jobRow(id)
    expect(job.status).toBe("failed")
    expect(await postCount()).toBe(0)
  })

  test("requeues a job stranded by a killed worker", async () => {
    const id = await enqueue()
    // Pretend a worker claimed it and then died.
    await db
      .update(contentPlanJob)
      .set({ status: "running", attempts: 1 })
      .where(eq(contentPlanJob.id, id))
    await db.execute(
      sql`UPDATE content_plan_job SET "heartbeatAt" = now() - interval '30 minutes' WHERE id = ${id}`,
    )

    await processContentPlanQueue()
    // The sweep requeues it and the same pump then runs it.
    const job = await jobRow(id)
    expect(job.status).toBe("completed")
    expect(await postCount()).toBe(3)
  })

  test("gives up on a stalled job that exhausted its attempts, and refunds", async () => {
    await recordUsage(UID, "contentPlan")

    const id = await enqueue()
    await db
      .update(contentPlanJob)
      .set({ status: "running", attempts: 3 })
      .where(eq(contentPlanJob.id, id))
    await db.execute(
      sql`UPDATE content_plan_job SET "heartbeatAt" = now() - interval '30 minutes' WHERE id = ${id}`,
    )

    await processContentPlanQueue()
    const job = await jobRow(id)
    expect(job.status).toBe("failed")
    expect(job.errorMessage).toContain("retry limit")
    expect((await getUsage(UID)).contentPlans).toBe(0)
  })

  test("fails outright when the business is gone", async () => {
    const id = await enqueue()
    await db.delete(business).where(eq(business.id, BIZ))
    // FK cascade removes the job row with the business, so nothing to assert
    // beyond it being gone - the worker must not crash the whole pump.
    await processContentPlanQueue()
    expect(await jobRow(id)).toBeUndefined()
  })
})
