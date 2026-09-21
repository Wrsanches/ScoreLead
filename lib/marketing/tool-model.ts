export type ScoringInput = { score: number; weight: number }

/** Weights are relative; callers need not make them add up to 100. */
export function calculateLeadScore(inputs: ScoringInput[], disqualified = false) {
  const valid = inputs.length > 0 && inputs.every(({ score, weight }) =>
    Number.isFinite(score) && score >= 0 && score <= 100 &&
    Number.isFinite(weight) && weight >= 0 && weight <= 100,
  )
  const totalWeight = inputs.reduce((sum, input) => sum + input.weight, 0)
  if (!valid || totalWeight <= 0) return { score: null, status: "invalid" as const }
  const score = Math.round(inputs.reduce((sum, input) => sum + input.score * input.weight, 0) / totalWeight)
  return { score, status: disqualified ? "disqualified" as const : score >= 75 ? "priority" as const : score >= 50 ? "research" as const : "hold" as const }
}

/** CSV exports contain values, never executable spreadsheet formulas. */
export function toCsv(rows: readonly (readonly (string | number)[])[]) {
  return "\uFEFF" + rows.map((row) => row.map((cell) => {
    const value = String(cell)
    let start = 0
    while (start < value.length && (value.charCodeAt(start) <= 31 || /\s/.test(value[start]))) start += 1
    const safe = /^[=+@-]/.test(value.slice(start)) ? `'${value}` : value
    return `"${safe.replaceAll('"', '""')}"`
  }).join(",")).join("\r\n") + "\r\n"
}
