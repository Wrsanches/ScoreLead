"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { BrandLogo } from "@/components/admin/brand-logo"
import { useInstagramConnection } from "@/components/admin/instagram-connection-card"

/**
 * Compact header chip showing whether Instagram publishing is live for this
 * business. Clicking it opens the Instagram integration page.
 */
export function InstagramStatusButton({ businessId }: { businessId: string }) {
  const t = useTranslations("integrations")
  const { data, connected, loadError } = useInstagramConnection(businessId)
  // A failed lookup reads as inactive rather than spinning forever.
  const loading = !data && !loadError
  const active = connected

  return (
    <Link
      href="/admin/integrations/instagram"
      title={t("instagramSetupTitle")}
      className="glass-hover inline-flex h-10 items-center gap-2 rounded-xl pl-1.5 pr-3 text-xs ring-1 ring-inset ring-black/[0.05] transition-colors dark:ring-white/[0.08]"
    >
      <BrandLogo platform="instagram" className="size-7" />
      <span className="font-medium text-zinc-800 dark:text-zinc-200">Instagram</span>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
          loading
            ? "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20"
            : active
              ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
              : "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400"
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${loading ? "bg-zinc-400 animate-pulse" : active ? "bg-emerald-500" : "bg-zinc-400"}`}
        />
        {loading ? "…" : active ? t("active") : t("inactive")}
      </span>
    </Link>
  )
}
