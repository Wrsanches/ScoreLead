import { and, count, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { subscription, usage, business } from "@/lib/db/schema"

/**
 * Freemium entitlement + usage metering.
 *
 * Free caps are LIFETIME totals (a one-time taste). Pro lifts them but keeps a
 * monthly fair-use cap on the most expensive op (AI image generation) to
 * protect API costs. Enforcement is server-side: routes call `assertCanUse`
 * before doing the expensive work and `recordUsage` after it succeeds.
 */

export type Plan = "free" | "pro"

/** Actions that consume quota. `business` is derived from the business count. */
export type GateAction =
  | "business"
  | "discoveryJob"
  | "outreachMessage"
  | "contentPlan"
  | "aiImage"

export const PLAN_LIMITS = {
  free: {
    businesses: 1,
    discoveryJobs: 1,
    outreachMessages: 3,
    contentPlans: 1,
    aiImages: 3, // lifetime
    freeLeadsPerJob: 25,
  },
  pro: {
    businesses: Infinity,
    discoveryJobs: Infinity,
    outreachMessages: Infinity,
    contentPlans: Infinity,
    aiImagesPerMonth: 300, // fair-use
  },
} as const

export class PlanLimitError extends Error {
  action: GateAction
  plan: Plan
  constructor(action: GateAction, plan: Plan) {
    super(`Plan limit reached for "${action}" on the ${plan} plan`)
    this.name = "PlanLimitError"
    this.action = action
    this.plan = plan
  }
}

function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/** "pro" if the user has an active or trialing Pro subscription, else "free". */
export async function getUserPlan(userId: string): Promise<Plan> {
  const rows = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(
      and(
        eq(subscription.referenceId, userId),
        eq(subscription.plan, "pro"),
        inArray(subscription.status, ["active", "trialing"]),
      ),
    )
  return rows.length > 0 ? "pro" : "free"
}

export interface UsageSnapshot {
  discoveryJobs: number
  outreachMessages: number
  contentPlans: number
  aiImages: number
  aiImagesMonth: number
  aiImagesMonthKey: string | null
}

const EMPTY_USAGE: UsageSnapshot = {
  discoveryJobs: 0,
  outreachMessages: 0,
  contentPlans: 0,
  aiImages: 0,
  aiImagesMonth: 0,
  aiImagesMonthKey: null,
}

export async function getUsage(userId: string): Promise<UsageSnapshot> {
  const [row] = await db.select().from(usage).where(eq(usage.userId, userId))
  if (!row) return { ...EMPTY_USAGE }
  return {
    discoveryJobs: row.discoveryJobs,
    outreachMessages: row.outreachMessages,
    contentPlans: row.contentPlans,
    aiImages: row.aiImages,
    aiImagesMonth: row.aiImagesMonth,
    aiImagesMonthKey: row.aiImagesMonthKey,
  }
}

async function businessCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(business)
    .where(eq(business.userId, userId))
  return row?.n ?? 0
}

/** AI images already consumed in the current quota window for this plan. */
function imagesUsed(plan: Plan, u: UsageSnapshot): number {
  if (plan === "pro") {
    return u.aiImagesMonthKey === monthKey() ? u.aiImagesMonth : 0
  }
  return u.aiImages
}

function imagesCap(plan: Plan): number {
  return plan === "pro"
    ? PLAN_LIMITS.pro.aiImagesPerMonth
    : PLAN_LIMITS.free.aiImages
}

/**
 * Throws PlanLimitError if performing `n` more of `action` would exceed the
 * user's plan. Call BEFORE the expensive work.
 */
export async function assertCanUse(
  userId: string,
  action: GateAction,
  n = 1,
): Promise<void> {
  const plan = await getUserPlan(userId)
  if (plan === "pro" && action !== "aiImage") return // pro is unlimited except images

  if (action === "business") {
    const used = await businessCount(userId)
    if (used + n > PLAN_LIMITS.free.businesses) {
      throw new PlanLimitError(action, plan)
    }
    return
  }

  const u = await getUsage(userId)

  if (action === "aiImage") {
    if (imagesUsed(plan, u) + n > imagesCap(plan)) {
      throw new PlanLimitError(action, plan)
    }
    return
  }

  const used =
    action === "discoveryJob"
      ? u.discoveryJobs
      : action === "outreachMessage"
        ? u.outreachMessages
        : u.contentPlans
  const cap =
    action === "discoveryJob"
      ? PLAN_LIMITS.free.discoveryJobs
      : action === "outreachMessage"
        ? PLAN_LIMITS.free.outreachMessages
        : PLAN_LIMITS.free.contentPlans
  if (used + n > cap) {
    throw new PlanLimitError(action, plan)
  }
}

/** Increments usage counters. Call AFTER the work succeeds. */
export async function recordUsage(
  userId: string,
  action: GateAction,
  n = 1,
): Promise<void> {
  if (action === "business") return // derived from the business table

  const now = new Date()
  const key = monthKey(now)

  if (action === "aiImage") {
    await db
      .insert(usage)
      .values({
        userId,
        aiImages: n,
        aiImagesMonth: n,
        aiImagesMonthKey: key,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: usage.userId,
        set: {
          aiImages: sql`${usage.aiImages} + ${n}`,
          // reset the monthly bucket when the month rolls over
          aiImagesMonth: sql`CASE WHEN ${usage.aiImagesMonthKey} = ${key} THEN ${usage.aiImagesMonth} + ${n} ELSE ${n} END`,
          aiImagesMonthKey: key,
          updatedAt: now,
        },
      })
    return
  }

  const column =
    action === "discoveryJob"
      ? usage.discoveryJobs
      : action === "outreachMessage"
        ? usage.outreachMessages
        : usage.contentPlans
  const valueKey =
    action === "discoveryJob"
      ? "discoveryJobs"
      : action === "outreachMessage"
        ? "outreachMessages"
        : "contentPlans"

  await db
    .insert(usage)
    .values({ userId, [valueKey]: n, updatedAt: now })
    .onConflictDoUpdate({
      target: usage.userId,
      set: { [valueKey]: sql`${column} + ${n}`, updatedAt: now },
    })
}

/** Clamp requested discovery results to the Free per-job lead cap. */
export function freeLeadCap(plan: Plan, requested: number): number {
  if (plan === "pro") return requested
  return Math.min(requested, PLAN_LIMITS.free.freeLeadsPerJob)
}

/** Shape returned by /api/billing/status for the client UI. */
export async function getPlanStatus(userId: string) {
  const [plan, u] = await Promise.all([getUserPlan(userId), getUsage(userId)])
  const businesses = await businessCount(userId)
  return {
    plan,
    usage: {
      businesses,
      discoveryJobs: u.discoveryJobs,
      outreachMessages: u.outreachMessages,
      contentPlans: u.contentPlans,
      aiImages: imagesUsed(plan, u),
    },
    limits: {
      businesses: PLAN_LIMITS[plan === "pro" ? "pro" : "free"].businesses,
      discoveryJobs: PLAN_LIMITS.free.discoveryJobs,
      outreachMessages: PLAN_LIMITS.free.outreachMessages,
      contentPlans: PLAN_LIMITS.free.contentPlans,
      aiImages: imagesCap(plan),
    },
  }
}
