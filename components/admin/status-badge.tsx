"use client"

import { CheckCircle2, AlertCircle, Clock, Loader2, XCircle, PlusCircle } from "lucide-react"
import { useTranslations } from "next-intl"

type Status =
  | "running"
  | "queued"
  | "pending"
  | "completed"
  | "partial"
  | "exhausted"
  | "failed"
  | "cancelled"

const config: Record<Status, { icon: React.ElementType; color: string; bg: string; labelKey: string; ping?: boolean }> = {
  running: { icon: Loader2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", labelKey: "badgeRunning", ping: true },
  queued: { icon: Clock, color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", labelKey: "badgeQueued" },
  pending: { icon: Clock, color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", labelKey: "badgePending" },
  completed: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", labelKey: "badgeCompleted" },
  partial: { icon: PlusCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", labelKey: "badgePartial" },
  exhausted: { icon: CheckCircle2, color: "text-zinc-500", bg: "bg-zinc-500/10 border-zinc-500/20", labelKey: "badgeExhausted" },
  failed: { icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/20", labelKey: "badgeFailed" },
  cancelled: { icon: XCircle, color: "text-zinc-500", bg: "bg-zinc-500/10 border-zinc-500/20", labelKey: "badgeCancelled" },
}

interface StatusBadgeProps {
  status: string
  showLabel?: boolean
}

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const t = useTranslations("dashboard")
  const cfg = config[status as Status] || config.pending
  const Icon = cfg.icon

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.ping ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {showLabel && <span>{t(cfg.labelKey)}</span>}
    </div>
  )
}

/** Just the icon, for compact lists */
export function StatusIcon({ status }: { status: string }) {
  const cfg = config[status as Status] || config.pending
  const Icon = cfg.icon
  return <Icon className={`w-3.5 h-3.5 ${cfg.color} ${status === "running" ? "animate-spin" : ""}`} />
}
