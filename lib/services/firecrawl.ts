import Firecrawl from "@mendable/firecrawl-js"

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
})

export interface ScrapeResult {
  markdown: string
  language?: string
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const result = await firecrawl.scrape(url, {
    formats: ["markdown"],
    onlyMainContent: true,
  })

  return {
    markdown: result.markdown || "",
    language: result.metadata?.language || undefined,
  }
}
