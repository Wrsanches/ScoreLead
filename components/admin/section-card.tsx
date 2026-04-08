interface SectionCardProps {
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function SectionCard({ title, children, actions, className }: SectionCardProps) {
  return (
    <div className={`border border-zinc-800/60 rounded-xl p-5 ${className || ""}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{title}</p>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
