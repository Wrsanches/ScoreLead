/**
 * Shared types and status config for the leads pages.
 * Both the list-detail view (page.tsx) and the kanban view (_components/leads-kanban.tsx)
 * import from here so we have ONE source of truth for status colors/labels.
 */

/** Allowed lead statuses — must match LEAD_STATUSES on the server. */
export const LEAD_STATUS_KEYS = [
  "new",
  "contacted",
  "interested",
  "no_profile",
  "not_interested",
  "customer",
] as const

export type LeadStatus = (typeof LEAD_STATUS_KEYS)[number]

/** Unified status config: dot + pill bg + text + ring. */
export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; dot: string; text: string; bg: string; ring: string }
> = {
  new:            { label: "New",            dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", ring: "ring-emerald-500/25" },
  contacted:      { label: "Contacted",      dot: "bg-sky-400",     text: "text-sky-300",     bg: "bg-sky-500/10",     ring: "ring-sky-500/25" },
  interested:     { label: "Interested",     dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   ring: "ring-amber-500/25" },
  no_profile:     { label: "No profile",     dot: "bg-zinc-500",    text: "text-zinc-300",    bg: "bg-zinc-800/60",    ring: "ring-zinc-700/60" },
  not_interested: { label: "Not interested", dot: "bg-rose-400",    text: "text-rose-300",    bg: "bg-rose-500/10",    ring: "ring-rose-500/25" },
  customer:       { label: "Customer",       dot: "bg-emerald-300", text: "text-emerald-200", bg: "bg-emerald-500/15", ring: "ring-emerald-400/35" },
}

export function getStatus(s: string) {
  return STATUS_CONFIG[s as LeadStatus] || STATUS_CONFIG.new
}

/** Lead record as returned from /api/leads. */
export interface Lead {
  id: string
  name: string | null
  website: string | null
  websiteDomain: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  description: string | null
  photoUrl: string | null
  googleRating: number | null
  googleReviews: { author: string; rating: number; text: string; date: string }[] | null
  googleReviewCount: number | null
  socialMedia: Record<string, string> | null
  instagramHandle: string | null
  services: string[] | null
  ownerName: string | null
  teamMembers: { name: string; role?: string }[] | null
  operatingHours: string | null
  pricingInfo: string | null
  aiSummary: string | null
  score: number
  scoreBreakdown: {
    positives: { label: string; value: number; category: string }[]
    risks: { label: string; value: number; category: string }[]
    categories: Record<string, number>
  } | null
  source: string
  firecrawlEnriched: boolean
  status: string
  createdAt: string
  outreachMessages: { step: number; label: string; subject?: string; body: string }[] | null
}
