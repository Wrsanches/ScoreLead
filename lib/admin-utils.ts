import { formatDistanceToNow } from "date-fns"

export function formatRelativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function parseKeywords(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Not JSON
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function scoreColor(score: number): string {
  if (score >= 4) return "text-emerald-400"
  if (score >= 3) return "text-amber-400"
  return "text-red-400"
}

export function scoreBadgeClasses(score: number): string {
  if (score >= 4) return "text-emerald-400 bg-emerald-500/10"
  if (score >= 3) return "text-amber-400 bg-amber-500/10"
  return "text-red-400 bg-red-500/10"
}

export function sourceName(source: string): string {
  if (source === "google_places") return "Google Places"
  if (source === "brave_search") return "Brave Search"
  return source
}
