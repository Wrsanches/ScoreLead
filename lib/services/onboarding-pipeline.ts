import { scrapeUrl, type ScrapeResult } from "./firecrawl"
import { searchBusiness } from "./brave-search"
import { extractBusinessProfile, type BusinessProfile } from "./openai"
import { extractBrandFromScrape, type BrandProfile } from "./brand-extractor"

interface OnboardingLinks {
  website?: string
  instagram?: string
  facebook?: string
  linkedin?: string
  other?: string
  location?: string
}

export type OnboardingProfile = BusinessProfile & BrandProfile

export async function runOnboardingPipeline(links: OnboardingLinks): Promise<OnboardingProfile> {
  const urlsToScrape: { label: string; url: string }[] = []

  if (links.website) urlsToScrape.push({ label: "Website", url: links.website })
  if (links.instagram) urlsToScrape.push({ label: "Instagram", url: links.instagram })
  if (links.facebook) urlsToScrape.push({ label: "Facebook", url: links.facebook })
  if (links.linkedin) urlsToScrape.push({ label: "LinkedIn", url: links.linkedin })
  if (links.other) urlsToScrape.push({ label: "Other", url: links.other })

  // Scrape all URLs in parallel. For the website we also request rawHtml +
  // branding so we can run brand extraction against it later.
  let detectedLanguage: string | undefined
  let websiteScrape: ScrapeResult | null = null

  const scrapeResults = await Promise.allSettled(
    urlsToScrape.map(async ({ label, url }) => {
      const isWebsite = label === "Website"
      const result = await scrapeUrl(url, {
        includeRawHtml: isWebsite,
        includeBranding: isWebsite,
      })
      if (result.language && !detectedLanguage) {
        detectedLanguage = result.language
      }
      if (isWebsite) {
        websiteScrape = result
      }
      return `--- ${label} (${url}) ---\n${result.markdown}`
    }),
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

  // Run business profile extraction and brand extraction in parallel -
  // they depend on different parts of the scraped content and don't share state.
  const [profile, brand] = await Promise.all([
    extractBusinessProfile(allContent, detectedLanguage, links.location),
    websiteScrape
      ? extractBrandFromScrape(websiteScrape)
      : Promise.resolve<BrandProfile>({
          brandColors: null,
          brandFonts: null,
          brandStyle: null,
        }),
  ])

  return { ...profile, ...brand }
}
