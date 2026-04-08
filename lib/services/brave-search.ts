interface BraveSearchResult {
  title: string
  description: string
  url: string
}

export async function searchBusiness(query: string): Promise<BraveSearchResult[]> {
  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY!,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Brave Search failed: ${response.statusText}`)
  }

  const data = await response.json()

  return (data.web?.results || []).map((r: { title: string; description: string; url: string }) => ({
    title: r.title,
    description: r.description,
    url: r.url,
  }))
}

const USEFUL_DOMAINS = [
  "yelp.com", "facebook.com", "instagram.com",
  "tripadvisor.com", "linkedin.com",
]

/** Filter Brave results to only social/directory sites useful for secondary enrichment */
export function filterUsefulResults(results: BraveSearchResult[]): BraveSearchResult[] {
  return results.filter((r) => {
    try {
      const hostname = new URL(r.url).hostname.replace("www.", "")
      return USEFUL_DOMAINS.some((d) => hostname.includes(d))
    } catch {
      return false
    }
  }).slice(0, 3)
}
