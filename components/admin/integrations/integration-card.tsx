"use client"

import { ArrowRight, Loader2 } from "lucide-react"
import { Link } from "@/i18n/routing"
import { getSocialConfig, type SocialPlatform } from "@/components/admin/social-icon"
import { BrandLogo } from "@/components/admin/brand-logo"

export type IntegrationStatus =
  | "loading"
  | "connected"
  | "reconnect"
  | "disconnected"
  | "coming_soon"
  | "unavailable"

const STATUS_STYLES: Record<Exclude<IntegrationStatus, "loading">, string> = {
  connected:
    "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25",
  reconnect:
    "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-amber-500/25",
  disconnected:
    "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 ring-zinc-500/20",
  coming_soon:
    "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 ring-zinc-500/20",
  unavailable:
    "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20",
}

export function IntegrationCard({
  platform,
  name,
  tagline,
  status,
  statusLabel,
  detail,
  href,
  actionLabel,
}: {
  platform: SocialPlatform
  name: string
  tagline: string
  status: IntegrationStatus
  statusLabel: string
  /** Secondary line under the status, e.g. the connected handle. */
  detail?: string | null
  href: string
  actionLabel: string
}) {
  const brand = getSocialConfig(platform)
  const connected = status === "connected"

  return (
    <Link
      href={href}
      className={`glass-card group relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:ring-1 hover:ring-black/[0.08] dark:hover:ring-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
        connected ? "ring-1 ring-emerald-500/20" : ""
      }`}
    >
      {/* Brand wash in the corner so each card reads as its own service */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ backgroundColor: brand.color }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <BrandLogo platform={platform} className="size-11 shrink-0" />
        {status === "loading" ? (
          <Loader2 className="mt-1 size-4 animate-spin text-zinc-400" />
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_STYLES[status]}`}
          >
            {connected && (
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            )}
            {statusLabel}
          </span>
        )}
      </div>

      <div className="relative mt-4 flex-1">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{name}</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{tagline}</p>
        {detail && (
          <p className="mt-3 truncate text-xs font-medium text-zinc-500">{detail}</p>
        )}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-black/[0.06] pt-4 text-sm font-medium dark:border-white/[0.08]">
        <span className={connected ? "text-zinc-700 dark:text-zinc-300" : "text-emerald-700 dark:text-emerald-300"}>
          {actionLabel}
        </span>
        <ArrowRight className="size-4 text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
      </div>
    </Link>
  )
}
