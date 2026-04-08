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

  // Scrape all URLs in parallel (include HTML for website to extract brand design)
  let detectedLanguage: string | undefined
  let websiteHtml: string | undefined
  const scrapeResults = await Promise.allSettled(
    urlsToScrape.map(async ({ label, url }) => {
      const isWebsite = label === "Website"
      const result = await scrapeUrl(url, { includeHtml: isWebsite })
      // Capture language from the first successful scrape (prioritize website)
      if (result.language && !detectedLanguage) {
        detectedLanguage = result.language
      }
      if (isWebsite && result.html) {
        websiteHtml = result.html
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

  // Truncate HTML to just the <head> and first portion of <body> for design extraction
  let designHtml = ""
  if (websiteHtml) {
    const headMatch = websiteHtml.match(/<head[\s\S]*?<\/head>/i)
    const styleMatches = websiteHtml.match(/<style[\s\S]*?<\/style>/gi)
    const bodyStart = websiteHtml.match(/<body[\s\S]{0,3000}/i)
    designHtml = [
      headMatch?.[0] || "",
      ...(styleMatches || []),
      bodyStart?.[0] || "",
    ].filter(Boolean).join("\n").slice(0, 15000)
  }

  // Combine all content
  const allContent = [
    ...scrapedContent,
    designHtml ? `--- Website HTML (for brand design extraction) ---\n${designHtml}` : "",
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
