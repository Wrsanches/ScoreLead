import { and, count, eq, inArray, sql } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import { db } from "@/lib/db"
import { subscription, usage, business } from "@/lib/db/schema"

/**
 * Tiered entitlement + usage metering.
 *
 * Four tiers: Free, Starter ($19.95, entered via a $2.95/7-day paid trial),
 * Growth ($29.95) and Pro ($59.95). Free meters on LIFETIME totals (a one-time
 * taste); every paid tier meters on a MONTHLY window that rolls over on the
 * calendar month. Enforcement is server-side: routes call `assertCanUse` before
 * doing the expensive work and `recordUsage` after it succeeds.
 *
 * Every tier declares the same shape in PLAN_LIMITS (Infinity for unlimited) so
 * the gate logic is one generic lookup rather than per-tier branching. Keep the
 * numbers here in sync with the marketing copy in lib/marketing/pricing.ts and
 * the `billing` namespace in i18n/locales/*.json.
 */

export type Plan = "free" | "starter" | "growth" | "pro"

/** Ordering, so the highest entitlement wins when several rows exist. */
export const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
}

/**
 * Stripe/Better Auth plan name -> entitlement tier. `starter_trial` is a
 * separate Stripe SKU (same recurring price, plus a one-time $2.95 line item
 * and a 7-day trial) that grants Starter entitlements.
 */
export const PLAN_TIER: Record<string, Plan> = {
  free: "free",
  starter_trial: "starter",
  starter: "starter",
  growth: "growth",
  pro: "pro",
}

/** Actions that consume quota. `business` is derived from the business count. */
export type GateAction =
  | "business"
  | "discoveryJob"
  | "outreachMessage"
  | "contentPlan"
  | "aiImage"

/** Boolean unlocks - either the tier has them or it does not. */
export type Capability =
  | "continueJob"
  | "whatsappAutomation"
  | "csvExport"
  | "decisionMakers"

export type QuotaWindow = "lifetime" | "month"

export interface PlanLimits {
  /** Which counter the metered caps below are measured against. */
  window: QuotaWindow
  businesses: number
  discoveryJobs: number
  leadsPerJob: number
  outreachMessages: number
  contentPlans: number
  /** On a lifetime-window tier this is the lifetime cap, not a monthly one. */
  aiImagesPerMonth: number
  aiImagesPerDay: number
  apolloEnrichmentsPerMonth: number
  continueJob: boolean
  whatsappAutomation: boolean
  csvExport: boolean
  decisionMakers: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    window: "lifetime",
    businesses: 1,
    discoveryJobs: 1,
    leadsPerJob: 10,
    outreachMessages: 3,
    // The content calendar is a Growth-and-up feature: at Free/Starter volumes
    // the image allowance could never cover a month of posts, so shipping it
    // there was a dead end. Existing posts stay readable; only generation is off.
    contentPlans: 0,
    aiImagesPerMonth: 0,
    aiImagesPerDay: 0,
    apolloEnrichmentsPerMonth: 0,
    continueJob: false,
    whatsappAutomation: false,
    csvExport: false,
    decisionMakers: false,
  },
  starter: {
    window: "month",
    businesses: 1,
    discoveryJobs: 10,
    leadsPerJob: 25,
    outreachMessages: 50,
    contentPlans: 0,
    aiImagesPerMonth: 0,
    aiImagesPerDay: 0,
    apolloEnrichmentsPerMonth: 0,
    continueJob: false,
    whatsappAutomation: false,
    csvExport: true,
    decisionMakers: false,
  },
  growth: {
    window: "month",
    businesses: 3,
    discoveryJobs: 30,
    leadsPerJob: 50,
    outreachMessages: 200,
    contentPlans: 6,
    aiImagesPerMonth: 15,
    aiImagesPerDay: 5,
    apolloEnrichmentsPerMonth: 150,
    continueJob: true,
    whatsappAutomation: true,
    csvExport: true,
    decisionMakers: false,
  },
  pro: {
    window: "month",
    businesses: Infinity,
    discoveryJobs: Infinity,
    leadsPerJob: Infinity,
    outreachMessages: Infinity,
    contentPlans: Infinity,
    aiImagesPerMonth: 30, // fair-use
    aiImagesPerDay: 10, // fair-use
    apolloEnrichmentsPerMonth: 500, // fair-use - paid, credit-metered API
    continueJob: true,
    whatsappAutomation: true,
    csvExport: true,
    decisionMakers: true,
  },
}

/**
 * Reduced caps while the $2.95 7-day Starter trial is running, so $2.95 cannot
 * buy a full month of Starter. Leads-per-run and CSV export are deliberately
 * left at full Starter values - they are the payoff that sells the conversion.
 */
export const STARTER_TRIAL_LIMITS: PlanLimits = {
  ...PLAN_LIMITS.starter,
  discoveryJobs: 3,
  outreachMessages: 15,
}

/** Apollo enrichment runs on the top-N leads of each job. */
export const APOLLO_LEADS_PER_JOB = 10

export type PlanLimitReason = "lifetime" | "monthly" | "daily"

export class PlanLimitError extends Error {
  action: GateAction
  plan: Plan
  reason: PlanLimitReason
  constructor(action: GateAction, plan: Plan, reason: PlanLimitReason = "lifetime") {
    super(`Plan limit reached for "${action}" on the ${plan} plan`)
    this.name = "PlanLimitError"
    this.action = action
    this.plan = plan
    this.reason = reason
  }
}

function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/** Which PlanLimitError reason a metered cap on this window reports. */
function windowReason(limits: PlanLimits): PlanLimitReason {
  return limits.window === "month" ? "monthly" : "lifetime"
}

/** The limits in force, applying the trial overlay when a trial is running. */
export function limitsFor(plan: Plan, isTrialing = false): PlanLimits {
  if (isTrialing && plan === "starter") return STARTER_TRIAL_LIMITS
  return PLAN_LIMITS[plan]
}

/** Whether a tier unlocks a boolean capability. Unaffected by trial state. */
export function can(plan: Plan, capability: Capability): boolean {
  return PLAN_LIMITS[plan][capability]
}

export interface Entitlement {
  plan: Plan
  /** True while a paid trial (the $2.95 Starter offer) is still running. */
  isTrialing: boolean
  limits: PlanLimits
  /** End of the current billing period, for "resets in N days" copy. */
  periodEnd: Date | null
}

/**
 * The user's effective entitlement: the highest-ranked tier among their
 * active/trialing subscriptions, or Free when they have none.
 */
export async function getEntitlement(userId: string): Promise<Entitlement> {
  const rows = await db
    .select({
      plan: subscription.plan,
      status: subscription.status,
      periodEnd: subscription.periodEnd,
    })
    .from(subscription)
    .where(
      and(
        eq(subscription.referenceId, userId),
        inArray(subscription.status, ["active", "trialing"]),
      ),
    )

  let best: Entitlement = {
    plan: "free",
    isTrialing: false,
    limits: PLAN_LIMITS.free,
    periodEnd: null,
  }

  for (const row of rows) {
    // Unknown plan names (a Stripe SKU we don't model) grant nothing rather
    // than silently falling through to a paid tier.
    const plan = PLAN_TIER[row.plan?.toLowerCase() ?? ""]
    if (!plan) continue
    if (PLAN_RANK[plan] <= PLAN_RANK[best.plan]) continue
    const isTrialing = row.status === "trialing"
    best = {
      plan,
      isTrialing,
      limits: limitsFor(plan, isTrialing),
      periodEnd: row.periodEnd ?? null,
    }
  }

  return best
}

/** The user's effective tier. Thin wrapper over getEntitlement. */
export async function getUserPlan(userId: string): Promise<Plan> {
  return (await getEntitlement(userId)).plan
}

export interface UsageSnapshot {
  discoveryJobs: number
  discoveryJobsMonth: number
  discoveryJobsMonthKey: string | null
  outreachMessages: number
  outreachMessagesMonth: number
  outreachMessagesMonthKey: string | null
  contentPlans: number
  contentPlansMonth: number
  contentPlansMonthKey: string | null
  aiImages: number
  aiImagesMonth: number
  aiImagesMonthKey: string | null
  aiImagesDay: number
  aiImagesDayKey: string | null
  apolloEnrichments: number
  apolloEnrichmentsMonth: number
  apolloEnrichmentsMonthKey: string | null
}

const EMPTY_USAGE: UsageSnapshot = {
  discoveryJobs: 0,
  discoveryJobsMonth: 0,
  discoveryJobsMonthKey: null,
  outreachMessages: 0,
  outreachMessagesMonth: 0,
  outreachMessagesMonthKey: null,
  contentPlans: 0,
  contentPlansMonth: 0,
  contentPlansMonthKey: null,
  aiImages: 0,
  aiImagesMonth: 0,
  aiImagesMonthKey: null,
  aiImagesDay: 0,
  aiImagesDayKey: null,
  apolloEnrichments: 0,
  apolloEnrichmentsMonth: 0,
  apolloEnrichmentsMonthKey: null,
}

export async function getUsage(userId: string): Promise<UsageSnapshot> {
  const [row] = await db.select().from(usage).where(eq(usage.userId, userId))
  if (!row) return { ...EMPTY_USAGE }
  return {
    discoveryJobs: row.discoveryJobs,
    discoveryJobsMonth: row.discoveryJobsMonth,
    discoveryJobsMonthKey: row.discoveryJobsMonthKey,
    outreachMessages: row.outreachMessages,
    outreachMessagesMonth: row.outreachMessagesMonth,
    outreachMessagesMonthKey: row.outreachMessagesMonthKey,
    contentPlans: row.contentPlans,
    contentPlansMonth: row.contentPlansMonth,
    contentPlansMonthKey: row.contentPlansMonthKey,
    aiImages: row.aiImages,
    aiImagesMonth: row.aiImagesMonth,
    aiImagesMonthKey: row.aiImagesMonthKey,
    aiImagesDay: row.aiImagesDay,
    aiImagesDayKey: row.aiImagesDayKey,
    apolloEnrichments: row.apolloEnrichments,
    apolloEnrichmentsMonth: row.apolloEnrichmentsMonth,
    apolloEnrichmentsMonthKey: row.apolloEnrichmentsMonthKey,
  }
}

/**
 * Column + limit wiring for the three simply-metered actions. Each tracks a
 * lifetime total (Free) and a month-keyed bucket (every paid tier).
 */
type MeteredAction = "discoveryJob" | "outreachMessage" | "contentPlan"

interface Meter {
  lifetimeKey: keyof UsageSnapshot
  monthKeyField: keyof UsageSnapshot
  monthCountField: keyof UsageSnapshot
  limitKey: "discoveryJobs" | "outreachMessages" | "contentPlans"
  lifetimeColumn: AnyPgColumn
  monthColumn: AnyPgColumn
  lifetimeName: string
  monthName: string
  monthKeyName: string
}

const METERS: Record<MeteredAction, Meter> = {
  discoveryJob: {
    lifetimeKey: "discoveryJobs",
    monthCountField: "discoveryJobsMonth",
    monthKeyField: "discoveryJobsMonthKey",
    limitKey: "discoveryJobs",
    lifetimeColumn: usage.discoveryJobs,
    monthColumn: usage.discoveryJobsMonth,
    lifetimeName: "discoveryJobs",
    monthName: "discoveryJobsMonth",
    monthKeyName: "discoveryJobsMonthKey",
  },
  outreachMessage: {
    lifetimeKey: "outreachMessages",
    monthCountField: "outreachMessagesMonth",
    monthKeyField: "outreachMessagesMonthKey",
    limitKey: "outreachMessages",
    lifetimeColumn: usage.outreachMessages,
    monthColumn: usage.outreachMessagesMonth,
    lifetimeName: "outreachMessages",
    monthName: "outreachMessagesMonth",
    monthKeyName: "outreachMessagesMonthKey",
  },
  contentPlan: {
    lifetimeKey: "contentPlans",
    monthCountField: "contentPlansMonth",
    monthKeyField: "contentPlansMonthKey",
    limitKey: "contentPlans",
    lifetimeColumn: usage.contentPlans,
    monthColumn: usage.contentPlansMonth,
    lifetimeName: "contentPlans",
    monthName: "contentPlansMonth",
    monthKeyName: "contentPlansMonthKey",
  },
}

/** Consumption of a metered action inside the tier's quota window. */
function meteredUsed(
  limits: PlanLimits,
  u: UsageSnapshot,
  meter: Meter,
  now = new Date(),
): number {
  if (limits.window === "lifetime") return u[meter.lifetimeKey] as number
  return u[meter.monthKeyField] === monthKey(now)
    ? (u[meter.monthCountField] as number)
    : 0
}

/** AI images already consumed in the tier's quota window. */
function imagesUsed(limits: PlanLimits, u: UsageSnapshot, now = new Date()): number {
  if (limits.window === "lifetime") return u.aiImages
  return u.aiImagesMonthKey === monthKey(now) ? u.aiImagesMonth : 0
}

function imagesUsedToday(u: UsageSnapshot, now = new Date()): number {
  return u.aiImagesDayKey === dayKey(now) ? u.aiImagesDay : 0
}

async function businessCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(business)
    .where(eq(business.userId, userId))
  return row?.n ?? 0
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
  const { plan, limits } = await getEntitlement(userId)

  if (action === "business") {
    if (!Number.isFinite(limits.businesses)) return
    const used = await businessCount(userId)
    if (used + n > limits.businesses) {
      throw new PlanLimitError(action, plan, windowReason(limits))
    }
    return
  }

  const u = await getUsage(userId)

  if (action === "aiImage") {
    if (imagesUsedToday(u) + n > limits.aiImagesPerDay) {
      throw new PlanLimitError(action, plan, "daily")
    }
    if (imagesUsed(limits, u) + n > limits.aiImagesPerMonth) {
      throw new PlanLimitError(action, plan, windowReason(limits))
    }
    return
  }

  const meter = METERS[action]
  const cap = limits[meter.limitKey]
  if (!Number.isFinite(cap)) return
  if (meteredUsed(limits, u, meter) + n > cap) {
    throw new PlanLimitError(action, plan, windowReason(limits))
  }
}

/**
 * Increments usage counters. Call AFTER the work succeeds.
 *
 * Both the lifetime and the month-keyed counter are always incremented, so a
 * user moving between a lifetime-window tier (Free) and a monthly one keeps
 * consistent history either way.
 */
export async function recordUsage(
  userId: string,
  action: GateAction,
  n = 1,
): Promise<void> {
  if (action === "business") return // derived from the business table

  const now = new Date()
  const key = monthKey(now)
  const today = dayKey(now)

  if (action === "aiImage") {
    await db
      .insert(usage)
      .values({
        userId,
        aiImages: n,
        aiImagesMonth: n,
        aiImagesMonthKey: key,
        aiImagesDay: n,
        aiImagesDayKey: today,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: usage.userId,
        set: {
          aiImages: sql`${usage.aiImages} + ${n}`,
          // reset the monthly bucket when the month rolls over
          aiImagesMonth: sql`CASE WHEN ${usage.aiImagesMonthKey} = ${key} THEN ${usage.aiImagesMonth} + ${n} ELSE ${n} END`,
          aiImagesMonthKey: key,
          aiImagesDay: sql`CASE WHEN ${usage.aiImagesDayKey} = ${today} THEN ${usage.aiImagesDay} + ${n} ELSE ${n} END`,
          aiImagesDayKey: today,
          updatedAt: now,
        },
      })
    return
  }

  const meter = METERS[action]

  await db
    .insert(usage)
    .values({
      userId,
      [meter.lifetimeName]: n,
      [meter.monthName]: n,
      [meter.monthKeyName]: key,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: usage.userId,
      set: {
        [meter.lifetimeName]: sql`${meter.lifetimeColumn} + ${n}`,
        [meter.monthName]: sql`CASE WHEN ${usage[meter.monthKeyName as "discoveryJobsMonthKey"]} = ${key} THEN ${meter.monthColumn} + ${n} ELSE ${n} END`,
        [meter.monthKeyName]: key,
        updatedAt: now,
      },
    })
}

/**
 * Give back `n` units of a metered action that were recorded but not delivered
 * - a queued job that ultimately failed, for example. Mirrors releaseImages:
 * best-effort, and floors every counter at 0 so a release can never drive usage
 * negative. `business` is derived from the business table, so it is a no-op.
 */
export async function releaseUsage(
  userId: string,
  action: GateAction,
  n = 1,
): Promise<void> {
  if (n <= 0 || action === "business") return

  if (action === "aiImage") {
    await releaseImages(userId, n)
    return
  }

  const meter = METERS[action]
  await db
    .update(usage)
    .set({
      [meter.lifetimeName]: sql`GREATEST(${meter.lifetimeColumn} - ${n}, 0)`,
      [meter.monthName]: sql`GREATEST(${meter.monthColumn} - ${n}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(usage.userId, userId))
}

/**
 * Atomically reserve `n` AI image credits BEFORE generation. This closes the
 * check-then-record race that assertCanUse + recordUsage leave open: because
 * generation takes several seconds between the check and the record,
 * concurrent requests could each pass the cap check on a stale count and all
 * generate. Here the check-and-increment runs under a per-user, transaction-
 * scoped advisory lock, so concurrent reservations are serialized. The lock is
 * held only for this short transaction, never across the slow generation.
 *
 * Throws PlanLimitError if the reservation would exceed the plan. Roll back any
 * credits you reserved but didn't use (fewer images produced, or failure) with
 * releaseImages.
 */
export async function reserveImages(userId: string, n = 1): Promise<void> {
  if (n <= 0) return
  const { plan, limits } = await getEntitlement(userId)
  const now = new Date()
  const key = monthKey(now)
  const today = dayKey(now)

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`aiImage:${userId}`}))`,
    )

    const [row] = await tx.select().from(usage).where(eq(usage.userId, userId))
    const u: UsageSnapshot = row
      ? {
          ...EMPTY_USAGE,
          aiImages: row.aiImages,
          aiImagesMonth: row.aiImagesMonth,
          aiImagesMonthKey: row.aiImagesMonthKey,
          aiImagesDay: row.aiImagesDay,
          aiImagesDayKey: row.aiImagesDayKey,
        }
      : { ...EMPTY_USAGE }

    if (imagesUsedToday(u, now) + n > limits.aiImagesPerDay) {
      throw new PlanLimitError("aiImage", plan, "daily")
    }
    if (imagesUsed(limits, u, now) + n > limits.aiImagesPerMonth) {
      throw new PlanLimitError("aiImage", plan, windowReason(limits))
    }

    await tx
      .insert(usage)
      .values({
        userId,
        aiImages: n,
        aiImagesMonth: n,
        aiImagesMonthKey: key,
        aiImagesDay: n,
        aiImagesDayKey: today,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: usage.userId,
        set: {
          aiImages: sql`${usage.aiImages} + ${n}`,
          aiImagesMonth: sql`CASE WHEN ${usage.aiImagesMonthKey} = ${key} THEN ${usage.aiImagesMonth} + ${n} ELSE ${n} END`,
          aiImagesMonthKey: key,
          aiImagesDay: sql`CASE WHEN ${usage.aiImagesDayKey} = ${today} THEN ${usage.aiImagesDay} + ${n} ELSE ${n} END`,
          aiImagesDayKey: today,
          updatedAt: now,
        },
      })
  })
}

/**
 * Roll back `n` AI image credits reserved via reserveImages that were not used
 * (generation failed, or produced fewer images than reserved). Best-effort;
 * floors every counter at 0 so a rollback can never make usage negative.
 */
export async function releaseImages(userId: string, n = 1): Promise<void> {
  if (n <= 0) return
  await db
    .update(usage)
    .set({
      aiImages: sql`GREATEST(${usage.aiImages} - ${n}, 0)`,
      aiImagesMonth: sql`GREATEST(${usage.aiImagesMonth} - ${n}, 0)`,
      aiImagesDay: sql`GREATEST(${usage.aiImagesDay} - ${n}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(usage.userId, userId))
}

/**
 * How many Apollo enrichments this user may still run this month. Firmographic
 * enrichment starts at Growth (Free and Starter return 0), capped by a monthly
 * fair-use budget. Call before enriching and clamp the batch to the returned
 * number; call recordApolloUsage after.
 */
export async function apolloMonthlyRemaining(userId: string): Promise<number> {
  const { limits } = await getEntitlement(userId)
  if (limits.apolloEnrichmentsPerMonth <= 0) return 0
  const u = await getUsage(userId)
  const usedThisMonth =
    u.apolloEnrichmentsMonthKey === monthKey() ? u.apolloEnrichmentsMonth : 0
  return Math.max(0, limits.apolloEnrichmentsPerMonth - usedThisMonth)
}

/** Increment Apollo enrichment counters (lifetime + monthly). */
export async function recordApolloUsage(userId: string, n: number): Promise<void> {
  if (n <= 0) return
  const now = new Date()
  const key = monthKey(now)
  await db
    .insert(usage)
    .values({
      userId,
      apolloEnrichments: n,
      apolloEnrichmentsMonth: n,
      apolloEnrichmentsMonthKey: key,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: usage.userId,
      set: {
        apolloEnrichments: sql`${usage.apolloEnrichments} + ${n}`,
        apolloEnrichmentsMonth: sql`CASE WHEN ${usage.apolloEnrichmentsMonthKey} = ${key} THEN ${usage.apolloEnrichmentsMonth} + ${n} ELSE ${n} END`,
        apolloEnrichmentsMonthKey: key,
        updatedAt: now,
      },
    })
}

/** Clamp requested discovery results to the tier's per-job lead cap. */
export function leadCap(plan: Plan, requested: number): number {
  const cap = PLAN_LIMITS[plan].leadsPerJob
  return Number.isFinite(cap) ? Math.min(requested, cap) : requested
}

/** Shape returned by /api/billing/status for the client UI. */
export async function getPlanStatus(userId: string) {
  const [{ plan, isTrialing, limits, periodEnd }, u, businesses] = await Promise.all([
    getEntitlement(userId),
    getUsage(userId),
    businessCount(userId),
  ])
  return {
    plan,
    isTrialing,
    window: limits.window,
    periodEnd,
    usage: {
      businesses,
      discoveryJobs: meteredUsed(limits, u, METERS.discoveryJob),
      outreachMessages: meteredUsed(limits, u, METERS.outreachMessage),
      contentPlans: meteredUsed(limits, u, METERS.contentPlan),
      aiImages: imagesUsed(limits, u),
      aiImagesToday: imagesUsedToday(u),
    },
    limits: {
      businesses: limits.businesses,
      discoveryJobs: limits.discoveryJobs,
      outreachMessages: limits.outreachMessages,
      contentPlans: limits.contentPlans,
      aiImages: limits.aiImagesPerMonth,
      aiImagesPerDay: limits.aiImagesPerDay,
      leadsPerJob: limits.leadsPerJob,
      apolloEnrichments: limits.apolloEnrichmentsPerMonth,
    },
    capabilities: {
      continueJob: limits.continueJob,
      whatsappAutomation: limits.whatsappAutomation,
      csvExport: limits.csvExport,
      decisionMakers: limits.decisionMakers,
    },
  }
}

/** JSON/RSC-safe shape shared by the billing API and the hydrated admin shell. */
export function serializePlanStatus(
  status: Awaited<ReturnType<typeof getPlanStatus>>,
) {
  return {
    ...status,
    periodEnd: status.periodEnd?.toISOString() ?? null,
    limits: Object.fromEntries(
      Object.entries(status.limits).map(([key, value]) => [
        key,
        Number.isFinite(value) ? value : null,
      ]),
    ) as Record<keyof typeof status.limits, number | null>,
  }
}

export type SerializedPlanStatus = ReturnType<typeof serializePlanStatus>
