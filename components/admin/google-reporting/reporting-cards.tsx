"use client"
import {
  Bot,
  ChartNoAxesColumnIncreasing,
  Search,
  ArrowRight,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { useReporting } from "./use-reporting"
export function ReportingCards({ businessId }: { businessId: string }) {
  const t = useTranslations("googleReporting")
  const { data, error, loading } = useReporting(businessId)
  return (
    <>
      {(
        [
          {
            provider: "ga4",
            title: "Google Analytics 4",
            icon: ChartNoAxesColumnIncreasing,
            copy: "gaTagline",
          },
          {
            provider: "search_console",
            title: "Google Search Console",
            icon: Search,
            copy: "searchTagline",
          },
        ] as const
      ).map(({ provider, title, icon: Icon, copy }) => {
        const connections =
          data?.connections.filter((c) => c.provider === provider) || []
        const count = connections.reduce(
          (sum, c) => sum + c.resources.length,
          0,
        )
        const status = loading
          ? t("loading")
          : error
            ? t("loadErrorShort")
            : connections.some((c) => c.status === "reconnect")
              ? t("reconnect")
              : count
                ? t("selectedCount", { count })
                : t("notConnected")
        return (
          <Link
            key={provider}
            href="/admin/integrations/google"
            className="glass-card flex flex-col gap-4 rounded-2xl p-5 transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <div className="flex items-center justify-between gap-3">
              <Icon
                className={`size-9 ${provider === "ga4" ? "text-amber-400" : "text-sky-400"}`}
                aria-hidden="true"
              />
              <span className="text-xs text-zinc-400">{status}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{t(copy)}</p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
              <span>{t("manage")}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </div>
          </Link>
        )
      })}
      <Link
        href="/admin/integrations/google#assistants"
        className="glass-card flex flex-col gap-4 rounded-2xl p-5 transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      >
        <Bot className="size-9 text-emerald-400" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="text-base font-semibold">{t("assistantsTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {t("assistantsTagline")}
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
          <span>{t("setup")}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </div>
      </Link>
    </>
  )
}
