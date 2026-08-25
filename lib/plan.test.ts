import { test, expect, describe } from "bun:test"
import {
  PLAN_LIMITS,
  PLAN_RANK,
  PLAN_TIER,
  STARTER_TRIAL_LIMITS,
  can,
  leadCap,
  limitsFor,
  type Plan,
  type PlanLimits,
} from "./plan"
import {
  ACTION_MIN_PLAN,
  PAID_PLAN_IDS,
  checkoutPlanName,
  isUpgrade,
  planRank,
  suggestedPlan,
} from "./plan-tiers"

const LADDER: Plan[] = ["free", "starter", "growth", "pro"]

const NUMERIC_CAPS = [
  "businesses",
  "discoveryJobs",
  "leadsPerJob",
  "outreachMessages",
  "contentPlans",
  "aiImagesPerMonth",
  "aiImagesPerDay",
  "apolloEnrichmentsPerMonth",
] as const satisfies readonly (keyof PlanLimits)[]

const CAPABILITIES = [
  "continueJob",
  "whatsappAutomation",
  "csvExport",
  "decisionMakers",
] as const

describe("the pricing ladder", () => {
  // A paying customer must never get less than a cheaper tier. This is the one
  // invariant a hand-maintained price table quietly violates.
  test("every numeric cap is monotonic across tiers", () => {
    for (const capKey of NUMERIC_CAPS) {
      for (let i = 1; i < LADDER.length; i++) {
        const lower = PLAN_LIMITS[LADDER[i - 1]][capKey]
        const higher = PLAN_LIMITS[LADDER[i]][capKey]
        expect(
          higher >= lower,
          `${capKey}: ${LADDER[i]} (${higher}) must be >= ${LADDER[i - 1]} (${lower})`,
        ).toBe(true)
      }
    }
  })

  test("capabilities only ever unlock as tiers go up", () => {
    for (const capability of CAPABILITIES) {
      let seenUnlocked = false
      for (const plan of LADDER) {
        const unlocked = PLAN_LIMITS[plan][capability]
        if (unlocked) seenUnlocked = true
        expect(
          !seenUnlocked || unlocked,
          `${capability} must not switch back off at ${plan}`,
        ).toBe(true)
      }
    }
  })

  test("free meters on lifetime totals and every paid tier on a month", () => {
    expect(PLAN_LIMITS.free.window).toBe("lifetime")
    for (const plan of ["starter", "growth", "pro"] as const) {
      expect(PLAN_LIMITS[plan].window).toBe("month")
    }
  })

  test("ranks are strictly increasing and match the client-side copy", () => {
    for (let i = 1; i < LADDER.length; i++) {
      expect(PLAN_RANK[LADDER[i]]).toBeGreaterThan(PLAN_RANK[LADDER[i - 1]])
    }
    // lib/plan-tiers.ts duplicates the ordering for the browser; keep them equal.
    for (const plan of LADDER) {
      expect(planRank(plan)).toBe(PLAN_RANK[plan])
    }
  })

  test("the paid tiers each cost something to unlock", () => {
    // Growth is the tier that has to justify itself, so assert the two features
    // that are its whole reason to exist.
    expect(can("starter", "whatsappAutomation")).toBe(false)
    expect(can("growth", "whatsappAutomation")).toBe(true)
    expect(PLAN_LIMITS.starter.apolloEnrichmentsPerMonth).toBe(0)
    expect(PLAN_LIMITS.growth.apolloEnrichmentsPerMonth).toBeGreaterThan(0)
    // Decision-maker contacts are Pro's exclusive unlock.
    expect(can("growth", "decisionMakers")).toBe(false)
    expect(can("pro", "decisionMakers")).toBe(true)
  })

  test("the content calendar starts at Growth", () => {
    // Below Growth the image allowance could never fill a month of posts, so
    // the calendar is off entirely rather than shipping as a dead end.
    for (const plan of ["free", "starter"] as const) {
      expect(PLAN_LIMITS[plan].contentPlans).toBe(0)
      expect(PLAN_LIMITS[plan].aiImagesPerMonth).toBe(0)
      expect(PLAN_LIMITS[plan].aiImagesPerDay).toBe(0)
    }
    expect(PLAN_LIMITS.growth.contentPlans).toBeGreaterThan(0)
    expect(PLAN_LIMITS.growth.aiImagesPerMonth).toBeGreaterThan(0)
    // A month of posts must be coverable by the image allowance, or the
    // calendar is a dead end at this tier too.
    expect(PLAN_LIMITS.growth.aiImagesPerMonth).toBeGreaterThanOrEqual(
      PLAN_LIMITS.growth.contentPlans,
    )
    // And the upgrade dialog must point at a tier that actually has it.
    expect(ACTION_MIN_PLAN.contentPlan).toBe("growth")
    expect(ACTION_MIN_PLAN.aiImage).toBe("growth")
  })
})

describe("PLAN_TIER", () => {
  test("maps the paid-trial SKU onto Starter entitlements", () => {
    expect(PLAN_TIER.starter_trial).toBe("starter")
    expect(PLAN_TIER.starter).toBe("starter")
  })

  test("has an entry for every tier, so no plan resolves to undefined", () => {
    for (const plan of LADDER) {
      expect(PLAN_TIER[plan]).toBe(plan)
    }
  })

  test("does not resolve an unknown Stripe plan name", () => {
    expect(PLAN_TIER["enterprise_legacy"]).toBeUndefined()
  })
})

describe("limitsFor", () => {
  test("applies the reduced trial overlay only while trialing on Starter", () => {
    expect(limitsFor("starter", true)).toBe(STARTER_TRIAL_LIMITS)
    expect(limitsFor("starter", false)).toBe(PLAN_LIMITS.starter)
    // A trialing Growth/Pro subscription (a Stripe-side free trial) keeps full caps.
    expect(limitsFor("growth", true)).toBe(PLAN_LIMITS.growth)
    expect(limitsFor("pro", true)).toBe(PLAN_LIMITS.pro)
  })

  test("the trial overlay is never more generous than Starter itself", () => {
    for (const capKey of NUMERIC_CAPS) {
      expect(STARTER_TRIAL_LIMITS[capKey]).toBeLessThanOrEqual(
        PLAN_LIMITS.starter[capKey],
      )
    }
  })

  test("the trial still keeps the features that sell the conversion", () => {
    expect(STARTER_TRIAL_LIMITS.csvExport).toBe(true)
    expect(STARTER_TRIAL_LIMITS.leadsPerJob).toBe(PLAN_LIMITS.starter.leadsPerJob)
  })
})

describe("leadCap", () => {
  test("clamps to the tier cap", () => {
    expect(leadCap("free", 50)).toBe(10)
    expect(leadCap("starter", 50)).toBe(25)
    expect(leadCap("growth", 500)).toBe(50)
  })

  test("never raises a smaller request", () => {
    expect(leadCap("growth", 5)).toBe(5)
    expect(leadCap("free", 3)).toBe(3)
  })

  test("passes any request through on an uncapped tier", () => {
    expect(leadCap("pro", 500)).toBe(500)
  })
})

describe("checkoutPlanName", () => {
  test("sends a Free user to the $2.95 trial SKU", () => {
    expect(checkoutPlanName("starter", "free")).toBe("starter_trial")
  })

  test("does not hand a second trial to an existing subscriber", () => {
    expect(checkoutPlanName("starter", "growth")).toBe("starter")
    expect(checkoutPlanName("starter", "pro")).toBe("starter")
  })

  test("leaves the higher tiers alone", () => {
    expect(checkoutPlanName("growth", "free")).toBe("growth")
    expect(checkoutPlanName("pro", "free")).toBe("pro")
  })
})

describe("suggestedPlan", () => {
  test("preselects the cheapest tier that clears the limit that was hit", () => {
    expect(suggestedPlan("free", "discoveryJob")).toBe("starter")
    expect(suggestedPlan("free", "csvExport")).toBe("starter")
    expect(suggestedPlan("free", "whatsappAutomation")).toBe("growth")
    expect(suggestedPlan("free", "continueJob")).toBe("growth")
    expect(suggestedPlan("free", "decisionMakers")).toBe("pro")
  })

  test("never suggests the tier the user is already on", () => {
    for (const current of LADDER) {
      for (const action of [null, ...Object.keys(ACTION_MIN_PLAN)]) {
        const suggestion = suggestedPlan(current, action)
        if (current === "pro") continue // nothing above Pro to suggest
        expect(
          isUpgrade(current, suggestion),
          `${current} + ${action} suggested ${suggestion}`,
        ).toBe(true)
      }
    }
  })

  test("skips past tiers that cannot clear the limit", () => {
    // A Starter user out of businesses needs Growth, not another Starter.
    expect(suggestedPlan("starter", "business")).toBe("growth")
    expect(suggestedPlan("starter", "whatsappAutomation")).toBe("growth")
    expect(suggestedPlan("growth", "decisionMakers")).toBe("pro")
  })

  test("falls back to the next tier up for an unrecognized action", () => {
    expect(suggestedPlan("free", "something_new")).toBe("starter")
    expect(suggestedPlan("growth", null)).toBe("pro")
  })

  test("every capability gate resolves to a tier that actually has it", () => {
    for (const capability of CAPABILITIES) {
      const floor = ACTION_MIN_PLAN[capability]
      expect(floor, `${capability} needs an ACTION_MIN_PLAN entry`).toBeDefined()
      expect(can(floor, capability), `${floor} should unlock ${capability}`).toBe(true)
    }
  })

  test("only ever suggests a real paid tier", () => {
    for (const action of Object.keys(ACTION_MIN_PLAN)) {
      expect(PAID_PLAN_IDS).toContain(suggestedPlan("free", action))
    }
  })
})
