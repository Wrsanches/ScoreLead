"use client"

import { ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname } from "@/i18n/routing"
import { isAccountAdminPath } from "@/lib/admin-routes"

/**
 * Context strip shown to platform admins while they are inside another
 * user's business. It sits flush under the top edge of the content column,
 * so it is styled as a lit hairline plus a faint tint rather than a boxed
 * alert: the situation is worth noticing on every page, not alarming.
 */
export function AdminViewBanner({
  businessName,
  ownerName,
  ownerEmail,
}: {
  businessName: string | null
  ownerName: string
  ownerEmail: string
}) {
  const t = useTranslations("adminBanner")
  const pathname = usePathname()
  if (isAccountAdminPath(pathname)) return null

  const name = businessName?.trim() || t("unnamed")
  // Owners often name the business after themselves; repeating the same
  // word twice on one line reads as a bug, so fall back to the email alone.
  const showOwnerName =
    ownerName.trim().length > 0 &&
    ownerName.trim().toLowerCase() !== name.toLowerCase()

  return (
    <div
      role="status"
      className="relative shrink-0 border-b border-amber-500/15 bg-amber-500/[0.05] px-6 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-amber-500/60 before:to-transparent dark:border-amber-400/15 dark:bg-amber-400/[0.06]"
    >
      <div className="flex h-10 items-center gap-3 text-sm">
        <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md bg-amber-500/12 px-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800 ring-1 ring-amber-500/25 ring-inset dark:bg-amber-400/12 dark:text-amber-200 dark:ring-amber-400/25">
          <ShieldCheck className="size-3" aria-hidden="true" />
          {t("badge")}
        </span>

        <p className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-400">
          <span>{t("editing")} </span>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {name}
          </span>
          <span
            className="mx-3 inline-block h-3.5 w-px translate-y-[3px] bg-zinc-900/15 dark:bg-white/15"
            aria-hidden="true"
          />
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            {t("owner")}
          </span>
          {showOwnerName && (
            <span className="ml-2 font-medium text-zinc-800 dark:text-zinc-200">
              {ownerName}
            </span>
          )}
          <a
            href={`mailto:${ownerEmail}`}
            className="ml-2 tabular-nums text-zinc-500 underline decoration-transparent underline-offset-3 transition-colors hover:text-zinc-900 hover:decoration-current dark:hover:text-white"
          >
            {ownerEmail}
          </a>
        </p>
      </div>
    </div>
  )
}
