interface StatNumberProps {
  value: string | number
  className?: string
  /** Tightens letter-spacing for a more compact numeric feel */
  tight?: boolean
}

/**
 * Wrapper for numeric displays. Enforces tabular-nums, optionally tracking-tight.
 * Use anywhere a KPI, count, score, page index, or duration is shown.
 */
export function StatNumber({ value, className = "", tight = true }: StatNumberProps) {
  return (
    <span
      className={`tabular-nums ${tight ? "tracking-tight" : ""} ${className}`}
    >
      {value}
    </span>
  )
}
