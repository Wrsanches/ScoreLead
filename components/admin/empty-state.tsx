interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {Icon && (
        <div className="w-11 h-11 rounded-xl bg-zinc-900/60 border border-zinc-800/70 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-zinc-500" />
        </div>
      )}
      <p className="text-zinc-300 text-sm font-medium mb-1">{title}</p>
      {description && (
        <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
