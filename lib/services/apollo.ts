import { getWebsiteDomain, isValidBusinessEmail } from "./lead-utils"

/**
 * Apollo.io enrichment. Adds firmographics (industry, headcount, revenue, tech
 * keywords) and optional decision-maker contacts to a lead, keyed off the
 * lead's website domain.
 *
 * Credit-metered: callers gate this behind plan tier and a per-job top-N cap.
 * Decision-maker People Search is a heavier credit cost than org enrichment, so
 * it is off by default and toggled via APOLLO_FETCH_PEOPLE.
 */

const APOLLO_BASE = "https://api.apollo.io/api/v1"

export interface DecisionMaker {
  name: string
  title?: string
  linkedin?: string
  email?: string
}

export interface ApolloEnrichment {
  industry?: string
  /** Estimated headcount (a point estimate from Apollo). */
  employeeCount?: number
  /** Human-readable revenue band, e.g. "$10M-$50M". */
  revenueRange?: string
  foundedYear?: string
  /** Apollo "keywords" - a useful proxy for tech stack / focus areas. */
  techStack?: string[]
  linkedinUrl?: string
  /** Corporate contact email when Apollo exposes one. */
  email?: string
  emailVerified?: boolean
  decisionMakers?: DecisionMaker[]
}

function getApiKey(): string | null {
  return process.env.APOLLO_API_KEY || null
}

async function apolloFetch(
  path: string,
  init: RequestInit & { apiKey: string },
): Promise<unknown | null> {
  const { apiKey, ...rest } = init
  try {
    const res = await fetch(`${APOLLO_BASE}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
        ...(rest.headers || {}),
      },
    })
    if (!res.ok) {
      console.warn(`[apollo] ${path} -> ${res.status}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn(`[apollo] ${path} failed:`, err)
    return null
  }
}

/** Format Apollo's numeric annual revenue into a compact band string. */
export function formatRevenueRange(amount: unknown): string | undefined {
  const n = typeof amount === "number" ? amount : Number(amount)
  if (!Number.isFinite(n) || n <= 0) return undefined
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

/** Map a raw Apollo organization object into our enrichment shape. */
export function mapOrganization(org: Record<string, unknown>): ApolloEnrichment {
  const result: ApolloEnrichment = {}

  if (typeof org.industry === "string" && org.industry) result.industry = org.industry

  if (typeof org.estimated_num_employees === "number") {
    result.employeeCount = org.estimated_num_employees
  }

  const revenue =
    (org.annual_revenue as { amount?: unknown })?.amount ??
    (org.estimated_annual_revenue as { amount?: unknown })?.amount ??
    org.annual_revenue ??
    org.organization_revenue
  const revenueRange = formatRevenueRange(revenue)
  if (revenueRange) result.revenueRange = revenueRange

  if (typeof org.founded_year === "number") {
    result.foundedYear = String(org.founded_year)
  }

  if (Array.isArray(org.keywords) && org.keywords.length > 0) {
    result.techStack = (org.keywords as unknown[])
      .filter((k): k is string => typeof k === "string")
      .slice(0, 20)
  }

  if (typeof org.linkedin_url === "string" && org.linkedin_url) {
    result.linkedinUrl = org.linkedin_url
  }

  return result
}

/** Map an Apollo person record into a decision-maker contact. */
export function mapPerson(person: Record<string, unknown>): DecisionMaker | null {
  const name =
    (typeof person.name === "string" && person.name) ||
    [person.first_name, person.last_name].filter(Boolean).join(" ").trim()
  if (!name) return null

  const dm: DecisionMaker = { name }
  if (typeof person.title === "string" && person.title) dm.title = person.title
  if (typeof person.linkedin_url === "string" && person.linkedin_url) {
    dm.linkedin = person.linkedin_url
  }
  // Apollo locks real emails behind credits; keep only valid, non-placeholder
  // addresses (its locked emails use placeholder domains the validator rejects).
  if (
    typeof person.email === "string" &&
    !person.email.includes("email_not_unlocked") &&
    isValidBusinessEmail(person.email)
  ) {
    dm.email = person.email
  }
  return dm
}

/** Enrich one company by its website domain. Returns null on miss/failure. */
export async function enrichByDomain(
  websiteOrDomain: string,
): Promise<ApolloEnrichment | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const domain = getWebsiteDomain(websiteOrDomain)
  if (!domain) return null

  const data = (await apolloFetch(
    `/organizations/enrich?domain=${encodeURIComponent(domain)}`,
    { method: "GET", apiKey },
  )) as { organization?: Record<string, unknown> } | null

  const org = data?.organization
  if (!org) return null

  const enrichment = mapOrganization(org)

  // Optional, heavier credit cost: pull a few decision-makers.
  if (process.env.APOLLO_FETCH_PEOPLE === "true") {
    const people = await findDecisionMakers(domain, apiKey)
    if (people.length > 0) {
      enrichment.decisionMakers = people
      const withEmail = people.find((p) => p.email)
      if (withEmail?.email) {
        enrichment.email = withEmail.email
        enrichment.emailVerified = true
      }
    }
  }

  return enrichment
}

/** Best-effort People Search for senior contacts at a domain. */
async function findDecisionMakers(
  domain: string,
  apiKey: string,
): Promise<DecisionMaker[]> {
  const data = (await apolloFetch(`/mixed_people/search`, {
    method: "POST",
    apiKey,
    body: JSON.stringify({
      q_organization_domains: domain,
      person_seniorities: ["owner", "founder", "c_suite", "vp", "director"],
      page: 1,
      per_page: 5,
    }),
  })) as { people?: Record<string, unknown>[] } | null

  if (!Array.isArray(data?.people)) return []
  return data.people
    .map(mapPerson)
    .filter((p): p is DecisionMaker => p !== null)
}
