"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function BillingSection() {
  const t = useTranslations("settings")

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-3">
            <Sparkles className="w-3 h-3" />
            {t("freePlan")}
          </div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
            {t("billing")}
          </h2>
          <p className="text-sm text-zinc-500 max-w-md">
            {t("freePlanDescription")}
          </p>
        </div>
      </div>

      <div className="pt-2">
        <Button type="button" disabled>
          {t("upgradeSoon")}
        </Button>
      </div>
    </section>
  )
}
