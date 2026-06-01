"use client"

import { useState } from "react"
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

export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("billing")
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
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
        plan: "pro",
        successUrl,
        cancelUrl: current,
      })
      if (error) {
        toast.error(error.message || t("upgradeFailed"))
        setLoading(false)
      }
    } catch {
      toast.error(t("upgradeFailed"))
      setLoading(false)
    }
  }

  const perks = [
    t("perkBusinesses"),
    t("perkDiscovery"),
    t("perkContent"),
    t("perkImages"),
    t("perkOutreach"),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
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

        <div className="flex items-baseline gap-1 py-1">
          <span className="text-3xl font-semibold text-white">{t("proPrice")}</span>
          <span className="text-sm text-zinc-500">{t("perMonth")}</span>
        </div>

        <ul className="space-y-2">
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm text-zinc-300">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              {perk}
            </li>
          ))}
        </ul>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? t("redirecting") : t("upgradeCta")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
