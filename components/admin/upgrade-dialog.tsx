"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Check, Loader2, Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import {
  PAID_PLAN_IDS,
  checkoutPlanName,
  isUpgrade,
  suggestedPlan,
  type PaidPlanId,
  type PlanId,
} from "@/lib/plan-tiers"

/**
 * Tier picker shown when a plan limit is hit (402 PLAN_LIMIT) or the user asks
 * to change plans. Preselects the cheapest tier that actually clears the limit
 * they ran into, so the default choice is the honest one rather than the most
 * expensive one.
 */
export function UpgradeDialog({
  open,
  onOpenChange,
  currentPlan,
  action,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: PlanId
  action?: string | null
}) {
  const t = useTranslations("billing")
  const [loading, setLoading] = useState<PaidPlanId | null>(null)
  const [selected, setSelected] = useState<PaidPlanId>(() =>
    suggestedPlan(currentPlan, action),
  )
  const [annual, setAnnual] = useState(false)

  // Re-derive the suggestion each time the dialog opens: the limit that
  // triggered it (and the user's tier) may differ from last time.
  useEffect(() => {
    if (open) setSelected(suggestedPlan(currentPlan, action))
  }, [open, currentPlan, action])

  // Only tiers above the current one can be bought here; downgrades go through
  // the Stripe billing portal.
  const options = PAID_PLAN_IDS.filter((id) => isUpgrade(currentPlan, id))

  // The $2.95 trial is a monthly-only offer, so hide the annual switch while
  // it's the thing being bought.
  const isTrialOffer = checkoutPlanName(selected, currentPlan) === "starter_trial"

  async function handleUpgrade() {
    setLoading(selected)
    try {
      const current = typeof window !== "undefined" ? window.location.href : "/admin"
      // On success, return to the current page tagged with ?upgraded=1 so the
      // app can pop the congrats modal and refresh the plan.
      const successUrl = (() => {
        try {
          const u = new URL(current)
          u.searchParams.set("upgraded", "1")
          return u.toString()
        } catch {
          return current
        }
      })()
      // Redirects to Stripe Checkout; returns to these URLs on success/cancel.
      const { error } = await authClient.subscription.upgrade({
        plan: checkoutPlanName(selected, currentPlan),
        annual: isTrialOffer ? false : annual,
        successUrl,
        cancelUrl: current,
      })
      if (error) {
        toast.error(error.message || t("upgradeFailed"))
        setLoading(null)
      }
    } catch {
      toast.error(t("upgradeFailed"))
      setLoading(null)
    }
  }

  if (options.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15">
              <Zap className="w-4 h-4 text-emerald-400" />
            </span>
            <DialogTitle className="text-zinc-100">{t("upgradeTitle")}</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            {t("upgradeDescription")}
          </DialogDescription>
        </DialogHeader>

        {!isTrialOffer && (
          <div
            role="radiogroup"
            aria-label={t("monthly")}
            className="inline-flex self-start rounded-lg border border-zinc-800 p-0.5 text-xs"
          >
            {([false, true] as const).map((isAnnual) => (
              <button
                key={String(isAnnual)}
                type="button"
                role="radio"
                aria-checked={annual === isAnnual}
                onClick={() => setAnnual(isAnnual)}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  annual === isAnnual
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isAnnual ? t("annual") : t("monthly")}
                {isAnnual && (
                  <span className="ml-1.5 text-emerald-400">{t("annualSave")}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2" role="radiogroup" aria-label={t("upgradeTitle")}>
          {options.map((id) => {
            const active = selected === id
            const trialForThis = checkoutPlanName(id, currentPlan) === "starter_trial"
            const perks = t.raw(`planPerks.${id}`) as string[]
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-emerald-500/50 bg-emerald-500/[0.06]"
                    : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-zinc-100">
                    {t(`planName.${id}`)}
                  </span>
                  <span className="text-right">
                    <span className="text-lg font-semibold text-white">
                      {trialForThis ? t("trialPrice") : t(`planPrice.${id}`)}
                    </span>
                    <span className="ml-1 text-xs text-zinc-500">
                      {trialForThis ? t("trialCadence") : t("perMonth")}
                    </span>
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {trialForThis ? t("trialNote") : t(`planTagline.${id}`)}
                </p>
                {active && (
                  <ul className="mt-3 space-y-1.5">
                    {perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-start gap-2 text-xs text-zinc-300"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            )
          })}
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={loading !== null}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {loading !== null && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading !== null
            ? t("redirecting")
            : isTrialOffer
              ? t("ctaStartTrial")
              : t("ctaChoose", { plan: t(`planName.${selected}`) })}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
