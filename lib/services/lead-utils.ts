/** Strip common language/country subdomains (en., pt., es., fr., de., etc.) */
function stripLangSubdomain(hostname: string): string {
  return hostname.replace(/^(?:en|pt|es|fr|de|it|nl|ja|ko|zh|ru|ar|hi|pl|sv|da|no|fi|tr|cs|el|he|th|vi|uk|ro|hu|bg|hr|sk|sl|lt|lv|et|mt|ga|is)\./i, "")
}

export function normalizeWebsiteUrl(value?: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`)
    url.protocol = "https:"
    url.hostname = stripLangSubdomain(url.hostname.replace(/^www\./i, "").toLowerCase())
    url.hash = ""

    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]) {
      url.searchParams.delete(key)
    }

    url.pathname = url.pathname.replace(/\/+$/, "")

    const normalized = `${url.hostname}${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}`
    return normalized || url.hostname
  } catch {
    return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "")
  }
}

export function getWebsiteDomain(value?: string | null): string | null {
  const normalized = normalizeWebsiteUrl(value)
  if (!normalized) return null
  const domain = normalized.split("/")[0] ?? null
  return domain ? stripLangSubdomain(domain) : null
}

/** Strip accents, common business suffixes, and punctuation for fuzzy name matching */
export function normalizeBusinessName(value?: string | null): string {
  if (!value) return ""
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Clean a page title into a business name (strip SEO spam, separators, limit length) */
export function cleanBusinessName(raw: string): string {
  // Take the first segment before common separators
  let name = raw.split(/\s*[|–—·•]\s*/)[0] || raw
  // Also split on " - " (but not inside the name, e.g. "A - B" is fine if short)
  if (name.length > 60) {
    name = name.split(/\s+-\s+/)[0] || name
  }
  // Strip leading phone numbers
  name = name.replace(/^\(?\d[\d\s().-]{7,}\s*/, "").trim()
  // Limit length
  if (name.length > 80) {
    name = name.slice(0, 80).replace(/\s+\S*$/, "").trim()
  }
  return name || raw.slice(0, 80)
}

/** Dice coefficient (bigram similarity) - returns 0..1 where 1 is identical */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeBusinessName(a)
  const nb = normalizeBusinessName(b)
  if (na === nb) return 1
  if (na.length < 2 || nb.length < 2) return 0

  const bigrams = (s: string) => {
    const set = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i++) {
      const pair = s.slice(i, i + 2)
      set.set(pair, (set.get(pair) || 0) + 1)
    }
    return set
  }

  const bg1 = bigrams(na)
  const bg2 = bigrams(nb)
  let overlap = 0

  for (const [pair, count] of bg1) {
    overlap += Math.min(count, bg2.get(pair) || 0)
  }

  const total = na.length - 1 + nb.length - 1
  return (2 * overlap) / total
}

export function mergeDiscoveryQueries(...queryLists: Array<string[] | undefined>) {
  return [...new Set(queryLists.flatMap((queries) => queries ?? []).filter(Boolean))]
}

export function leadHasDirectContact(lead: { email?: string | null; phone?: string | null; emails?: string[] | null; phones?: string[] | null }) {
  return Boolean(lead.email || lead.phone || lead.emails?.length || lead.phones?.length)
}
