interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {Icon && <Icon className="w-8 h-8 text-zinc-700 mb-4" />}
      <p className="text-zinc-400 text-sm mb-1">{title}</p>
      {description && <p className="text-zinc-600 text-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
