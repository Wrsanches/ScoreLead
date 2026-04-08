import { Link } from "@/i18n/routing"

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ElementType
  sub?: string
  href?: string
}

export function StatCard({ label, value, icon: Icon, sub, href }: StatCardProps) {
  const content = (
    <div className="border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700/60 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-zinc-600" />}
      </div>
      <p className="text-2xl text-white font-medium tabular-nums">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
