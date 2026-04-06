import { scrapeUrl } from "./firecrawl"
import { searchBusiness } from "./brave-search"
import { extractBusinessProfile, type BusinessProfile } from "./openai"

interface OnboardingLinks {
  website?: string
  instagram?: string
  facebook?: string
  linkedin?: string
  other?: string
  location?: string
}

export async function runOnboardingPipeline(links: OnboardingLinks): Promise<BusinessProfile> {
  const urlsToScrape: { label: string; url: string }[] = []

  if (links.website) urlsToScrape.push({ label: "Website", url: links.website })
  if (links.instagram) urlsToScrape.push({ label: "Instagram", url: links.instagram })
  if (links.facebook) urlsToScrape.push({ label: "Facebook", url: links.facebook })
  if (links.linkedin) urlsToScrape.push({ label: "LinkedIn", url: links.linkedin })
  if (links.other) urlsToScrape.push({ label: "Other", url: links.other })

  // Scrape all URLs in parallel
  let detectedLanguage: string | undefined
  const scrapeResults = await Promise.allSettled(
    urlsToScrape.map(async ({ label, url }) => {
      const result = await scrapeUrl(url)
      // Capture language from the first successful scrape (prioritize website)
      if (result.language && !detectedLanguage) {
        detectedLanguage = result.language
      }
      return `--- ${label} (${url}) ---\n${result.markdown}`
    })
  )

  const scrapedContent = scrapeResults
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value)

  // Search Brave for additional context
  const searchQuery = links.website
    ? new URL(links.website).hostname.replace("www.", "")
    : urlsToScrape[0]?.url || ""

  let searchContent = ""
  if (searchQuery) {
    try {
      const results = await searchBusiness(searchQuery)
      searchContent = results
        .map((r) => `${r.title}: ${r.description}`)
        .join("\n")
    } catch {
      // Brave search is supplementary, don't fail the pipeline
    }
  }

  // Combine all content
  const allContent = [
    ...scrapedContent,
    searchContent ? `--- Brave Search Results ---\n${searchContent}` : "",
    links.location ? `--- Location ---\n${links.location}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  if (!allContent.trim()) {
    throw new Error("No content could be extracted from the provided links")
  }

  return extractBusinessProfile(allContent, detectedLanguage, links.location)
}
