import { scoreBadgeClasses } from "@/lib/admin-utils"

interface ScoreBadgeProps {
  score: number
  size?: "sm" | "md"
}

export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const sizeClasses = size === "md"
    ? "text-sm font-bold px-2.5 py-1 rounded-lg"
    : "text-xs font-bold px-2 py-0.5 rounded-lg"

  return (
    <span className={`tabular-nums ${sizeClasses} ${scoreBadgeClasses(score)}`}>
      {score.toFixed(1)}
    </span>
  )
}
