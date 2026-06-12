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

export type Plan = "free" | "pro"

interface PlanUsage {
  businesses: number
  discoveryJobs: number
  outreachMessages: number
  contentPlans: number
  aiImages: number
  aiImagesToday?: number
}

interface PlanStatus {
  plan: Plan
  usage: PlanUsage
  limits: Record<string, number>
}

interface PlanContextValue extends Partial<PlanStatus> {
  plan: Plan
  loading: boolean
  isPro: boolean
  refresh: () => void
  openUpgrade: () => void
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PlanStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
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
    refresh()
  }, [refresh])

  // Returning from Stripe Checkout: ?upgraded=1 → celebrate + refresh the plan
  // (the webhook flips the subscription async, so poll a few times), then strip
  // the param so a reload doesn't re-trigger it.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("upgraded") !== "1") return

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

  const openUpgrade = useCallback(() => setUpgradeOpen(true), [])

  const value = useMemo<PlanContextValue>(
    () => ({
      plan: status?.plan ?? "free",
      usage: status?.usage,
      limits: status?.limits,
      loading,
      isPro: status?.plan === "pro",
      refresh,
      openUpgrade,
    }),
    [status, loading, refresh, openUpgrade],
  )

  return (
    <PlanContext.Provider value={value}>
      {children}
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <CongratsModal open={congratsOpen} onOpenChange={setCongratsOpen} />
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
