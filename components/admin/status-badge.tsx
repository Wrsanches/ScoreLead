import { CheckCircle2, AlertCircle, Clock, Loader2, XCircle } from "lucide-react"

type Status = "running" | "queued" | "pending" | "completed" | "failed" | "cancelled"

const config: Record<Status, { icon: React.ElementType; color: string; bg: string; label: string; ping?: boolean }> = {
  running: { icon: Loader2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Running", ping: true },
  queued: { icon: Clock, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", label: "Queued" },
  pending: { icon: Clock, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", label: "Pending" },
  completed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Completed" },
  failed: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Failed" },
  cancelled: { icon: XCircle, color: "text-zinc-500", bg: "bg-zinc-500/10 border-zinc-500/20", label: "Cancelled" },
}

interface StatusBadgeProps {
  status: string
  showLabel?: boolean
}

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const cfg = config[status as Status] || config.pending
  const Icon = cfg.icon

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className={`w-3 h-3 ${status === "running" ? "animate-spin" : ""}`} />
      {showLabel && <span>{cfg.label}</span>}
    </div>
  )
}

/** Just the icon, for compact lists */
export function StatusIcon({ status }: { status: string }) {
  const cfg = config[status as Status] || config.pending
  const Icon = cfg.icon
  return <Icon className={`w-3.5 h-3.5 ${cfg.color} ${status === "running" ? "animate-spin" : ""}`} />
}
