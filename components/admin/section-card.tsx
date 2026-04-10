export type SectionAccent = "none" | "emerald" | "sky" | "violet" | "amber"

const ACCENT_CLASSES: Record<SectionAccent, string> = {
  none:    "border-zinc-800/60",
  emerald: "border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.04] to-transparent",
  sky:     "border-sky-500/25 bg-gradient-to-b from-sky-500/[0.04] to-transparent",
  violet:  "border-violet-500/25 bg-gradient-to-b from-violet-500/[0.04] to-transparent",
  amber:   "border-amber-500/25 bg-gradient-to-b from-amber-500/[0.04] to-transparent",
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
      className={`border rounded-xl p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] ${ACCENT_CLASSES[accent]} ${className || ""}`}
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
