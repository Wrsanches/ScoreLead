import Firecrawl from "@mendable/firecrawl-js"

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
})

export interface ScrapeResult {
  markdown: string
  html?: string
  language?: string
}

export async function scrapeUrl(url: string, options?: { includeHtml?: boolean }): Promise<ScrapeResult> {
  const formats: ("markdown" | "html")[] = ["markdown"]
  if (options?.includeHtml) formats.push("html")

  const result = await firecrawl.scrape(url, {
    formats,
    onlyMainContent: !options?.includeHtml,
  })

  return {
    markdown: result.markdown || "",
    html: result.html || undefined,
    language: result.metadata?.language || undefined,
  }
}
