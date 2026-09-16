export type SectionAccent = "none" | "emerald" | "sky" | "violet" | "amber"

// Accents tint the glass with a soft top-down wash and a colored edge. The
// ring composes with glass-card's inset edge instead of replacing it.
const ACCENT_CLASSES: Record<SectionAccent, string> = {
  none:    "",
  emerald: "ring-1 ring-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent",
  sky:     "ring-1 ring-sky-500/20 bg-gradient-to-b from-sky-500/[0.06] to-transparent",
  violet:  "ring-1 ring-violet-500/20 bg-gradient-to-b from-violet-500/[0.06] to-transparent",
  amber:   "ring-1 ring-amber-500/20 bg-gradient-to-b from-amber-500/[0.06] to-transparent",
}

interface SectionCardProps {
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  accent?: SectionAccent
}

export function SectionCard({
  title,
  children,
  actions,
  className,
  accent = "none",
}: SectionCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-5 ${ACCENT_CLASSES[accent]} ${className || ""}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              {title}
            </p>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
