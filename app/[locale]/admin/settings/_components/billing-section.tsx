"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Loader2 } from "lucide-react"
import { usePlan } from "@/components/admin/plan-context"
import { authClient } from "@/lib/auth-client"

export function BillingSection() {
  const t = useTranslations("billing")
  const { plan, usage, limits, loading, openUpgrade } = usePlan()
  const [portalLoading, setPortalLoading] = useState(false)
  const isPro = plan === "pro"

  async function handleManage() {
    setPortalLoading(true)
    try {
      const url = typeof window !== "undefined" ? window.location.href : "/admin"
      const { error } = await authClient.subscription.billingPortal({
        returnUrl: url,
      })
      if (error) {
        toast.error(error.message || t("portalFailed"))
        setPortalLoading(false)
      }
    } catch {
      toast.error(t("portalFailed"))
      setPortalLoading(false)
    }
  }

  const usageRows =
    usage && limits
      ? isPro
        ? [
            { label: t("usageImagesMonthly"), used: usage.aiImages, max: limits.aiImages },
            { label: t("usageImagesDaily"), used: usage.aiImagesToday ?? 0, max: limits.aiImagesPerDay },
          ]
        : [
            { label: t("usageBusinesses"), used: usage.businesses, max: limits.businesses },
            { label: t("usageDiscovery"), used: usage.discoveryJobs, max: limits.discoveryJobs },
            { label: t("usageOutreach"), used: usage.outreachMessages, max: limits.outreachMessages },
            { label: t("usageContent"), used: usage.contentPlans, max: limits.contentPlans },
            { label: t("usageImages"), used: usage.aiImages, max: limits.aiImages },
          ]
      : []

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium mb-3 ${
              isPro
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {isPro ? <Zap className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {isPro ? t("proPlan") : t("freePlan")}
          </div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
            {t("billingTitle")}
          </h2>
          <p className="text-sm text-zinc-500 max-w-md">
            {isPro ? t("proBlurb") : t("freeBlurb")}
          </p>
        </div>
      </div>

      {usageRows.length > 0 && (
        <div className="space-y-3 mb-6 max-w-sm">
          {usageRows.map((row) => {
            const unlimited = !Number.isFinite(row.max)
            const pct = unlimited
              ? 0
              : Math.min(100, Math.round((row.used / Math.max(row.max, 1)) * 100))
            const atLimit = !unlimited && row.used >= row.max
            const near = !unlimited && !atLimit && pct >= 66
            const barColor = atLimit
              ? "bg-red-500"
              : near
                ? "bg-amber-500"
                : "bg-emerald-500"
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400">{row.label}</span>
                  <span
                    className={`tabular-nums ${atLimit ? "text-red-600 dark:text-red-400 font-medium" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {unlimited ? t("unlimited") : `${row.used} / ${row.max}`}
                  </span>
                </div>
                {!unlimited && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="pt-1">
        {isPro ? (
          <Button type="button" variant="outline" onClick={handleManage} disabled={portalLoading}>
            {portalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("manageBilling")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={openUpgrade}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Zap className="w-4 h-4" />
            {t("upgradeCta")}
          </Button>
        )}
      </div>
    </section>
  )
}
