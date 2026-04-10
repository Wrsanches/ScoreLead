import { Link } from "@/i18n/routing"
import { StatNumber } from "./stat-number"

export type StatAccent = "emerald" | "sky" | "violet" | "amber" | "rose" | "zinc"

const ACCENTS: Record<StatAccent, {
  icon: string
  iconBg: string
  gradient: string
  ring: string
  hoverRing: string
  hoverShadow: string
}> = {
  emerald: {
    icon: "text-emerald-300",
    iconBg: "bg-emerald-500/10 ring-emerald-500/25",
    gradient: "bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent",
    ring: "ring-1 ring-emerald-500/15",
    hoverRing: "hover:ring-emerald-500/30",
    hoverShadow: "hover:shadow-[0_0_32px_-8px_rgba(16,185,129,0.35)]",
  },
  sky: {
    icon: "text-sky-300",
    iconBg: "bg-sky-500/10 ring-sky-500/25",
    gradient: "bg-gradient-to-br from-sky-500/[0.06] via-sky-500/[0.02] to-transparent",
    ring: "ring-1 ring-sky-500/15",
    hoverRing: "hover:ring-sky-500/30",
    hoverShadow: "hover:shadow-[0_0_32px_-8px_rgba(14,165,233,0.3)]",
  },
  violet: {
    icon: "text-violet-300",
    iconBg: "bg-violet-500/10 ring-violet-500/25",
    gradient: "bg-gradient-to-br from-violet-500/[0.06] via-violet-500/[0.02] to-transparent",
    ring: "ring-1 ring-violet-500/15",
    hoverRing: "hover:ring-violet-500/30",
    hoverShadow: "hover:shadow-[0_0_32px_-8px_rgba(139,92,246,0.3)]",
  },
  amber: {
    icon: "text-amber-300",
    iconBg: "bg-amber-500/10 ring-amber-500/25",
    gradient: "bg-gradient-to-br from-amber-500/[0.06] via-amber-500/[0.02] to-transparent",
    ring: "ring-1 ring-amber-500/15",
    hoverRing: "hover:ring-amber-500/30",
    hoverShadow: "hover:shadow-[0_0_32px_-8px_rgba(245,158,11,0.3)]",
  },
  rose: {
    icon: "text-rose-300",
    iconBg: "bg-rose-500/10 ring-rose-500/25",
    gradient: "bg-gradient-to-br from-rose-500/[0.06] via-rose-500/[0.02] to-transparent",
    ring: "ring-1 ring-rose-500/15",
    hoverRing: "hover:ring-rose-500/30",
    hoverShadow: "hover:shadow-[0_0_32px_-8px_rgba(244,63,94,0.3)]",
  },
  zinc: {
    icon: "text-zinc-400",
    iconBg: "bg-zinc-800/60 ring-zinc-700/50",
    gradient: "",
    ring: "ring-1 ring-zinc-800/60",
    hoverRing: "hover:ring-zinc-700/70",
    hoverShadow: "",
  },
}

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ElementType
  sub?: string
  href?: string
  accent?: StatAccent
}

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  href,
  accent = "zinc",
}: StatCardProps) {
  const a = ACCENTS[accent]
  const isLinked = !!href

  const content = (
    <div
      className={`relative overflow-hidden rounded-xl p-5 transition-all duration-200 ${a.gradient} ${a.ring} ${
        isLinked ? `${a.hoverRing} ${a.hoverShadow} hover:-translate-y-0.5` : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ring-1 ${a.iconBg}`}
          >
            <Icon className={`w-3.5 h-3.5 ${a.icon}`} />
          </div>
        )}
      </div>
      <StatNumber value={value} className="text-2xl text-white font-semibold" />
      {sub && <p className="text-xs text-zinc-500 mt-1.5 tabular-nums">{sub}</p>}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
