import type { LucideIcon } from "lucide-react"

export type ActivityAccent = "emerald" | "sky" | "violet" | "amber" | "rose" | "zinc"

const ACCENTS: Record<ActivityAccent, { icon: string; bg: string; ring: string }> = {
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  sky:     { icon: "text-sky-400",     bg: "bg-sky-500/10",     ring: "ring-sky-500/20" },
  violet:  { icon: "text-violet-400",  bg: "bg-violet-500/10",  ring: "ring-violet-500/20" },
  amber:   { icon: "text-amber-400",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20" },
  rose:    { icon: "text-rose-400",    bg: "bg-rose-500/10",    ring: "ring-rose-500/20" },
  zinc:    { icon: "text-zinc-400",    bg: "bg-zinc-800/60",    ring: "ring-zinc-700/50" },
}

interface ActivityItemProps {
  icon: LucideIcon
  text: string
  time?: string
  accent?: ActivityAccent
}

/**
 * A single row in an activity/event timeline.
 * Shows a colored icon chip, a description, and a relative time.
 */
export function ActivityItem({ icon: Icon, text, time, accent = "emerald" }: ActivityItemProps) {
  const c = ACCENTS[accent]

  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ring-1 ${c.bg} ${c.ring}`}
      >
        <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-zinc-300 leading-snug">{text}</p>
        {time && <p className="text-xs text-zinc-600 mt-0.5 tabular-nums">{time}</p>}
      </div>
    </div>
  )
}
