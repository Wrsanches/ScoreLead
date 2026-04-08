import { leadHasDirectContact } from "./lead-utils"

export type ScoreCategory = "reach" | "trust" | "offer" | "profile" | "social"

export interface LeadScoreSignal {
  label: string
  value: number
  category: ScoreCategory
}

export interface LeadScoreBreakdown {
  score: number
  rawScore: number
  positives: LeadScoreSignal[]
  risks: LeadScoreSignal[]
  categories: Record<ScoreCategory, number>
}

interface ScoringLead {
  website?: string | null
  email?: string | null
  phone?: string | null
  emails?: string[] | null
  phones?: string[] | null
  googleRating?: number | null
  googleReviewCount?: number | null
  services?: string[] | null
  ownerName?: string | null
  teamMembers?: { name: string; role?: string }[] | null
  pricingInfo?: string | null
  operatingHours?: string | null
  socialMedia?: Record<string, string> | null
  amenities?: string[] | null
  firecrawlEnriched?: boolean
  description?: string | null
  aiSummary?: string | null
}

function clampScore(value: number) {
  return Math.min(5, Math.max(1, Math.round(value * 2) / 2))
}

function clampCategory(value: number) {
  return Math.min(5, Math.max(0, Math.round(value * 2) / 2))
}

export function getLeadScoreBreakdown(lead: ScoringLead): LeadScoreBreakdown {
  const positives: LeadScoreSignal[] = []
  const risks: LeadScoreSignal[] = []

  const addPositive = (label: string, value: number, category: ScoreCategory) =>
    positives.push({ label, value, category })
  const addRisk = (label: string, value: number, category: ScoreCategory) =>
    risks.push({ label, value, category })

  // ── Reach: contact info ──────────────────────────────────
  if (lead.website) addPositive("Has website", 0.8, "reach")
  else addRisk("No website", -0.6, "reach")

  if (lead.email) addPositive("Has email", 0.9, "reach")
  if (lead.phone) addPositive("Has phone", 0.5, "reach")

  const extraContacts = new Set([
    ...(lead.emails ?? []),
    ...(lead.phones ?? []),
  ]).size
  if (extraContacts >= 2) addPositive("Multiple contacts", 0.35, "reach")

  if (!leadHasDirectContact(lead)) {
    addRisk("No direct contact", -0.8, "reach")
  }

  // ── Trust: reputation ────────────────────────────────────
  if (lead.googleRating != null) {
    if (lead.googleRating >= 4.6) addPositive("Strong rating", 0.8, "trust")
    else if (lead.googleRating >= 4.1) addPositive("Good rating", 0.5, "trust")
    else if (lead.googleRating < 3.8) addRisk("Low rating", -0.3, "trust")
  }

  if (lead.googleReviewCount != null) {
    if (lead.googleReviewCount >= 80) addPositive("High social proof", 0.8, "trust")
    else if (lead.googleReviewCount >= 20) addPositive("Social proof", 0.5, "trust")
    else if (lead.googleReviewCount < 5) addRisk("Few reviews", -0.15, "trust")
  }

  // ── Offer: services & pricing ────────────────────────────
  const serviceCount = lead.services?.length ?? 0
  if (serviceCount >= 3) addPositive("Broad offering", 0.75, "offer")
  else if (serviceCount >= 1) addPositive("Has services", 0.45, "offer")

  if (lead.pricingInfo) addPositive("Published pricing", 0.2, "offer")

  // ── Profile: business detail ─────────────────────────────
  if (lead.ownerName) addPositive("Owner identified", 0.25, "profile")
  if ((lead.teamMembers?.length ?? 0) >= 2) addPositive("Visible team", 0.25, "profile")
  if (lead.operatingHours) addPositive("Published hours", 0.15, "profile")
  if ((lead.amenities?.length ?? 0) >= 2) addPositive("Detailed listing", 0.15, "profile")
  if (lead.firecrawlEnriched) addPositive("Enriched data", 0.2, "profile")
  if (lead.aiSummary) addPositive("Rich content", 0.15, "profile")
  if (lead.description && lead.description.length > 100) addPositive("Good description", 0.1, "profile")

  // ── Social: online presence ──────────────────────────────
  const socialCount = Object.values(lead.socialMedia || {}).filter(Boolean).length
  if (socialCount >= 3) addPositive("Strong social presence", 0.4, "social")
  else if (socialCount >= 1) addPositive("Social presence", 0.2, "social")

  // ── Compute category scores (0-5 scale) ──────────────────
  const allSignals = [...positives, ...risks]
  const categoryMaxes: Record<ScoreCategory, number> = {
    reach: 2.55,  // website(0.8) + email(0.9) + phone(0.5) + multiple(0.35)
    trust: 1.6,   // rating(0.8) + reviews(0.8)
    offer: 0.95,  // services(0.75) + pricing(0.2)
    profile: 1.25, // owner(0.25) + team(0.25) + hours(0.15) + amenities(0.15) + enriched(0.2) + content(0.15) + desc(0.1)
    social: 0.4,  // social(0.4)
  }

  const categoryTotals: Record<ScoreCategory, number> = { reach: 0, trust: 0, offer: 0, profile: 0, social: 0 }
  for (const signal of allSignals) {
    categoryTotals[signal.category] += signal.value
  }

  const categories: Record<ScoreCategory, number> = {
    reach: clampCategory((categoryTotals.reach / categoryMaxes.reach) * 5),
    trust: clampCategory((categoryTotals.trust / categoryMaxes.trust) * 5),
    offer: clampCategory((categoryTotals.offer / categoryMaxes.offer) * 5),
    profile: clampCategory((categoryTotals.profile / categoryMaxes.profile) * 5),
    social: clampCategory((categoryTotals.social / categoryMaxes.social) * 5),
  }

  const rawScore =
    positives.reduce((sum, s) => sum + s.value, 0) +
    risks.reduce((sum, s) => sum + s.value, 0)

  return {
    score: clampScore(rawScore),
    rawScore,
    positives,
    risks,
    categories,
  }
}

export function calculateLeadScore(lead: ScoringLead): number {
  return getLeadScoreBreakdown(lead).score
}
