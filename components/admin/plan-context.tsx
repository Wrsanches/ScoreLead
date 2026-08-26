"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { UpgradeDialog } from "@/components/admin/upgrade-dialog"
import { CongratsModal } from "@/components/admin/congrats-modal"
import { planRank, type PlanId } from "@/lib/plan-tiers"
import { trackMarketingEvent } from "@/lib/analytics-events"
import type { SerializedPlanStatus } from "@/lib/plan"

export type Plan = PlanId

export type PlanCapability =
  | "continueJob"
  | "whatsappAutomation"
  | "csvExport"
  | "decisionMakers"

type PlanStatus = SerializedPlanStatus

interface PlanContextValue extends Partial<PlanStatus> {
  plan: Plan
  loading: boolean
  isPaid: boolean
  isPro: boolean
  isTrialing: boolean
  /** Whether the current tier unlocks a capability. */
  can: (capability: PlanCapability) => boolean
  refresh: () => void
  /** `action` is the GateAction from a 402, used to preselect a tier. */
  openUpgrade: (action?: string | null) => void
  /** The gate action that triggered the currently open upgrade dialog. */
  upgradeAction: string | null
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({
  children,
  initialStatus,
}: {
  children: React.ReactNode
  initialStatus?: PlanStatus | null
}) {
  const [status, setStatus] = useState<PlanStatus | null>(initialStatus ?? null)
  const [loading, setLoading] = useState(!initialStatus)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeAction, setUpgradeAction] = useState<string | null>(null)
  const [congratsOpen, setCongratsOpen] = useState(false)

  const refresh = useCallback(() => {
    setLoading(true)
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PlanStatus | null) => {
        if (data) setStatus(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!initialStatus) refresh()
  }, [initialStatus, refresh])

  // Returning from Stripe Checkout: ?upgraded=1 → celebrate + refresh the plan
  // (the webhook flips the subscription async, so poll a few times), then strip
  // the param so a reload doesn't re-trigger it.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("upgraded") !== "1") return

    window.sessionStorage.setItem("scorelead:subscription-started-pending", "1")
    setCongratsOpen(true)
    refresh()
    const timers = [1500, 4000, 8000].map((ms) => setTimeout(refresh, ms))

    params.delete("upgraded")
    const qs = params.toString()
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (qs ? `?${qs}` : ""),
    )
    return () => timers.forEach(clearTimeout)
  }, [refresh])

  useEffect(() => {
    if (!status || planRank(status.plan) === 0) return
    const key = "scorelead:subscription-started-pending"
    if (window.sessionStorage.getItem(key) !== "1") return

    trackMarketingEvent("subscription_started", {
      plan: status.plan,
      is_trialing: status.isTrialing,
    })
    window.sessionStorage.removeItem(key)
  }, [status])

  const openUpgrade = useCallback((action?: string | null) => {
    setUpgradeAction(action ?? null)
    setUpgradeOpen(true)
  }, [])

  const value = useMemo<PlanContextValue>(() => {
    const plan = status?.plan ?? "free"
    const capabilities = status?.capabilities
    return {
      plan,
      isTrialing: status?.isTrialing ?? false,
      window: status?.window,
      periodEnd: status?.periodEnd,
      usage: status?.usage,
      limits: status?.limits,
      capabilities,
      loading,
      isPaid: planRank(plan) > 0,
      isPro: plan === "pro",
      // Fall back to closed while the status request is in flight, so a paid
      // feature never flashes open for a Free user on first paint.
      can: (capability) => capabilities?.[capability] ?? false,
      refresh,
      openUpgrade,
      upgradeAction,
    }
  }, [status, loading, refresh, openUpgrade, upgradeAction])

  return (
    <PlanContext.Provider value={value}>
      {children}
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={status?.plan ?? "free"}
        action={upgradeAction}
      />
      <CongratsModal
        open={congratsOpen}
        onOpenChange={setCongratsOpen}
        plan={status?.plan ?? "free"}
      />
    </PlanContext.Provider>
  )
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) {
    throw new Error("usePlan must be used within a PlanProvider")
  }
  return ctx
}
