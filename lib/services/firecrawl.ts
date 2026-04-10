import Firecrawl from "@mendable/firecrawl-js"

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
})

export interface BrandingData {
  colorScheme?: "light" | "dark"
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    textPrimary?: string
    textSecondary?: string
    link?: string
    success?: string
    warning?: string
    error?: string
    [key: string]: string | undefined
  }
  fonts?: Array<{ family: string; [key: string]: unknown }>
}

export interface ScrapeResult {
  markdown: string
  rawHtml?: string
  language?: string
  branding?: BrandingData
}

export async function scrapeUrl(
  url: string,
  options?: { includeRawHtml?: boolean; includeBranding?: boolean },
): Promise<ScrapeResult> {
  const formats: ("markdown" | "rawHtml" | "branding")[] = ["markdown"]
  if (options?.includeRawHtml) formats.push("rawHtml")
  if (options?.includeBranding) formats.push("branding")

  const result = await firecrawl.scrape(url, {
    formats,
    onlyMainContent: !options?.includeRawHtml && !options?.includeBranding,
  })

  return {
    markdown: result.markdown || "",
    rawHtml: result.rawHtml || undefined,
    language: result.metadata?.language || undefined,
    branding: result.branding as BrandingData | undefined,
  }
}
