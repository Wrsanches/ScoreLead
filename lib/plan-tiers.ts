/**
 * Client-safe tier metadata. lib/plan.ts is the server-side authority but it
 * imports the db, so anything rendering in the browser reads the ordering and
 * checkout wiring from here instead. Keep the ids and order in lockstep with
 * `Plan` / `PLAN_RANK` in lib/plan.ts.
 */

export type PlanId = "free" | "starter" | "growth" | "pro"

export const PLAN_IDS: PlanId[] = ["free", "starter", "growth", "pro"]

export const PAID_PLAN_IDS = ["starter", "growth", "pro"] as const satisfies readonly PlanId[]

export type PaidPlanId = (typeof PAID_PLAN_IDS)[number]

const RANK: Record<PlanId, number> = { free: 0, starter: 1, growth: 2, pro: 3 }

export function planRank(plan: PlanId): number {
  return RANK[plan] ?? 0
}

/** True when `candidate` is a strictly higher tier than `current`. */
export function isUpgrade(current: PlanId, candidate: PlanId): boolean {
  return planRank(candidate) > planRank(current)
}

/**
 * The Better Auth / Stripe plan name to send to `subscription.upgrade` for a
 * tier. A first-time Starter purchase goes through the `starter_trial` SKU so
 * the buyer gets the $2.95/7-day offer; an existing subscriber switching to
 * Starter pays the plain monthly price with no second trial.
 */
export function checkoutPlanName(plan: PaidPlanId, currentPlan: PlanId): string {
  if (plan === "starter" && currentPlan === "free") return "starter_trial"
  return plan
}

/** Gate actions the server reports on a 402, mapped to the cheapest tier that clears them. */
export const ACTION_MIN_PLAN: Record<string, PaidPlanId> = {
  business: "growth", // Free and Starter are both capped at 1 business
  discoveryJob: "starter",
  outreachMessage: "starter",
  // The content calendar (and its AI images) start at Growth.
  contentPlan: "growth",
  aiImage: "growth",
  csvExport: "starter",
  leadsPerJob: "starter",
  continueJob: "growth",
  whatsappAutomation: "growth",
  decisionMakers: "pro",
}

/**
 * Which tier to preselect in the upgrade dialog: the cheapest one that both
 * clears the limit the user hit and is actually an upgrade from where they are.
 */
export function suggestedPlan(currentPlan: PlanId, action?: string | null): PaidPlanId {
  const floor = (action && ACTION_MIN_PLAN[action]) || "starter"
  for (const candidate of PAID_PLAN_IDS) {
    if (planRank(candidate) >= planRank(floor) && isUpgrade(currentPlan, candidate)) {
      return candidate
    }
  }
  return "pro"
}
