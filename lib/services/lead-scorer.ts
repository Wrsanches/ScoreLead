import { leadHasDirectContact } from "./lead-utils"
import { nameSimilarity } from "./lead-utils"

export type ScoreCategory = "reach" | "trust" | "offer" | "profile" | "social" | "fit"

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
  name?: string | null
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
  // Discovery context used for ICP fit (set during enrichment)
  businessCategory?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  // Graded relevance (0-1) produced by the enrichment LLM step (Phase 2)
  relevanceScore?: number | null
  // Firmographics (Apollo, Phase 3/4)
  industry?: string | null
  employeeCount?: number | null
  techStack?: string[] | null
  emailVerified?: boolean | null
}

/**
 * Ideal Customer Profile, derived from the searcher's `business` row. Scoring
 * is relative to this: the same lead is a better or worse fit depending on who
 * is looking. When omitted, the `fit` category stays neutral (0) and the score
 * behaves exactly as the pre-ICP absolute-quality version did.
 */
export interface ScoringICP {
  field?: string | null
  category?: string | null
  clientPersona?: string | null
  services?: string | null
  serviceArea?: string | null // "local" | "regional" | "national"
  competitors?: string | null
  location?: string | null // the searcher's own location
}

function clampScore(value: number) {
  return Math.min(5, Math.max(1, Math.round(value * 2) / 2))
}

function clampCategory(value: number) {
  return Math.min(5, Math.max(0, Math.round(value * 2) / 2))
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "are", "our", "your", "you",
  "who", "what", "from", "have", "has", "all", "any", "can", "will", "they",
  "their", "them", "its", "into", "out", "over", "more", "most", "such",
  "business", "businesses", "company", "companies", "client", "clients",
  "customer", "customers", "service", "services", "products", "product",
  "small", "medium", "large", "local", "based", "looking", "need", "needs",
  "want", "wants", "owner", "owners", "team", "people", "those", "near",
])

/** Tokenize free text into a set of meaningful lowercase keywords (len >= 3). */
function tokenize(...texts: Array<string | null | undefined>): Set<string> {
  const tokens = new Set<string>()
  for (const text of texts) {
    if (!text) continue
    for (const raw of text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)) {
      if (raw.length >= 3 && !STOPWORDS.has(raw)) tokens.add(raw)
    }
  }
  return tokens
}

/** Loose location-overlap check (shared token between two location strings). */
function locationsOverlap(a: string, b: string): boolean {
  const ta = tokenize(a)
  const tb = tokenize(b)
  for (const t of ta) if (tb.has(t)) return true
  return false
}

/**
 * Score how well a lead matches the searcher's ICP. Deterministic (no LLM) so
 * it stays cheap and unit-testable; the graded LLM relevance signal is folded
 * in separately via `lead.relevanceScore`.
 */
function scoreFit(
  lead: ScoringLead,
  icp: ScoringICP,
  add: (label: string, value: number, category: ScoreCategory) => void,
  addRisk: (label: string, value: number, category: ScoreCategory) => void,
) {
  // Keywords describing the ideal customer / the searcher's space.
  const icpKeywords = tokenize(
    icp.clientPersona,
    icp.field,
    icp.category,
    icp.services,
  )

  // Text describing the lead's actual business (incl. Apollo firmographics).
  const leadKeywords = tokenize(
    lead.businessCategory,
    lead.industry,
    (lead.services ?? []).join(" "),
    (lead.techStack ?? []).join(" "),
    lead.description,
    lead.aiSummary,
    lead.name,
  )

  if (icpKeywords.size > 0 && leadKeywords.size > 0) {
    let overlap = 0
    for (const kw of icpKeywords) if (leadKeywords.has(kw)) overlap++

    if (overlap >= 4) add("Strong ICP match", 0.9, "fit")
    else if (overlap >= 2) add("Good ICP match", 0.5, "fit")
    else if (overlap >= 1) add("Partial ICP match", 0.2, "fit")
    else addRisk("Outside ICP", -0.4, "fit")
  }

  // Graded relevance from the enrichment LLM (Phase 2). Below the hard-drop
  // floor the lead never reaches scoring, so we only reward the upper band.
  if (lead.relevanceScore != null) {
    if (lead.relevanceScore >= 0.7) add("High relevance", 0.6, "fit")
    else if (lead.relevanceScore >= 0.4) add("Moderate relevance", 0.3, "fit")
    else if (lead.relevanceScore < 0.4) addRisk("Low relevance", -0.3, "fit")
  }

  // Service-area proximity: only matters when the searcher works locally or
  // regionally. National sellers are location-agnostic, so stay neutral.
  const area = (icp.serviceArea ?? "").toLowerCase()
  if ((area === "local" || area === "regional") && icp.location) {
    // Match on city/state granularity only - country alone (e.g. "USA") is too
    // coarse to mean "local" and would match every lead in the country.
    const leadLocation = [lead.city, lead.state].filter(Boolean).join(" ")
    if (leadLocation) {
      if (locationsOverlap(icp.location, leadLocation)) {
        add("In service area", 0.4, "fit")
      } else if (area === "local") {
        addRisk("Outside service area", -0.3, "fit")
      }
    }
  }

  // Company-size fit: if the ICP text signals a target size (e.g. "SMB" or
  // "enterprise") and Apollo gave us a headcount, reward a match. Read raw text
  // since size words ("small", "large") are tokenizer stopwords.
  if (lead.employeeCount != null) {
    const icpText = [icp.clientPersona, icp.field, icp.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    const wantsSmall = /\b(smb|smbs|small business|startup|solopreneur|freelancer|boutique|local business)\b/.test(icpText)
    const wantsLarge = /\b(enterprise|enterprises|corporation|corporate|large compan|fortune)\b/.test(icpText)
    if (wantsSmall && lead.employeeCount <= 50) add("Company size fit", 0.3, "fit")
    else if (wantsLarge && lead.employeeCount >= 250) add("Company size fit", 0.3, "fit")
  }

  // Competitor guard: a lead whose name closely matches a listed competitor is
  // likely a rival, not a customer.
  if (icp.competitors && lead.name) {
    const competitors = icp.competitors
      .split(/[,;\n]/)
      .map((c) => c.trim())
      .filter(Boolean)
    if (competitors.some((c) => nameSimilarity(c, lead.name as string) >= 0.8)) {
      addRisk("Looks like a competitor", -0.5, "fit")
    }
  }
}

export function getLeadScoreBreakdown(
  lead: ScoringLead,
  icp?: ScoringICP,
): LeadScoreBreakdown {
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
  if (lead.emailVerified) addPositive("Verified email", 0.3, "reach")
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

  // ── Fit: relevance to the searcher's ICP ─────────────────
  // Only when an ICP is supplied; otherwise the fit category stays neutral and
  // the score matches the pre-ICP absolute-quality behavior.
  if (icp) scoreFit(lead, icp, addPositive, addRisk)

  // ── Compute category scores (0-5 scale) ──────────────────
  const allSignals = [...positives, ...risks]
  const categoryMaxes: Record<ScoreCategory, number> = {
    reach: 2.85,  // website(0.8) + email(0.9) + verified(0.3) + phone(0.5) + multiple(0.35)
    trust: 1.6,   // rating(0.8) + reviews(0.8)
    offer: 0.95,  // services(0.75) + pricing(0.2)
    profile: 1.25, // owner(0.25) + team(0.25) + hours(0.15) + amenities(0.15) + enriched(0.2) + content(0.15) + desc(0.1)
    social: 0.4,  // social(0.4)
    fit: 2.2,     // icp match(0.9) + relevance(0.6) + service area(0.4) + size(0.3)
  }

  const categoryTotals: Record<ScoreCategory, number> = {
    reach: 0, trust: 0, offer: 0, profile: 0, social: 0, fit: 0,
  }
  for (const signal of allSignals) {
    categoryTotals[signal.category] += signal.value
  }

  const categories: Record<ScoreCategory, number> = {
    reach: clampCategory((categoryTotals.reach / categoryMaxes.reach) * 5),
    trust: clampCategory((categoryTotals.trust / categoryMaxes.trust) * 5),
    offer: clampCategory((categoryTotals.offer / categoryMaxes.offer) * 5),
    profile: clampCategory((categoryTotals.profile / categoryMaxes.profile) * 5),
    social: clampCategory((categoryTotals.social / categoryMaxes.social) * 5),
    fit: clampCategory((categoryTotals.fit / categoryMaxes.fit) * 5),
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

export function calculateLeadScore(lead: ScoringLead, icp?: ScoringICP): number {
  return getLeadScoreBreakdown(lead, icp).score
}
