import OpenAI from "openai"
import { BRAND_EXTRACTOR_PROMPT } from "@/lib/prompts"
import { scrapeUrl, type ScrapeResult } from "./firecrawl"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface BrandProfile {
  brandColors: string[] | null
  brandFonts: string[] | null
  brandStyle: string | null
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const GENERIC_HEX = new Set(["#000", "#000000", "#fff", "#ffffff"])

function normalizeHex(color: string): string {
  return color.trim().toLowerCase()
}

function isGenericColor(color: string): boolean {
  const n = normalizeHex(color)
  if (GENERIC_HEX.has(n)) return true
  // Reject pure grayscale (R == G == B) in #rrggbb form
  const m = n.match(/^#([0-9a-f]{6})$/)
  if (m) {
    const hex = m[1]
    if (hex.slice(0, 2) === hex.slice(2, 4) && hex.slice(2, 4) === hex.slice(4, 6)) {
      return true
    }
  }
  return false
}

function dedupeColors(colors: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of colors) {
    if (typeof c !== "string") continue
    const n = normalizeHex(c)
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(n)) continue
    if (isGenericColor(c)) continue
    if (seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
}

function dedupeFonts(fonts: string[]): string[] {
  const generic = new Set([
    "sans-serif",
    "serif",
    "monospace",
    "system-ui",
    "-apple-system",
    "inherit",
    "initial",
    "cursive",
    "fantasy",
  ])
  const seen = new Set<string>()
  const out: string[] = []
  for (const f of fonts) {
    if (typeof f !== "string") continue
    const cleaned = f.trim().replace(/^["']|["']$/g, "")
    if (!cleaned) continue
    if (generic.has(cleaned.toLowerCase())) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
  }
  return out
}

// ---------------------------------------------------------------------------
// Firecrawl native branding extraction
// ---------------------------------------------------------------------------

function extractFromFirecrawlBranding(branding: ScrapeResult["branding"]): {
  colors: string[]
  fonts: string[]
} {
  if (!branding) return { colors: [], fonts: [] }

  // Keep a meaningful order so primary/secondary/accent come first
  const colorOrder = [
    "primary",
    "secondary",
    "accent",
    "link",
    "success",
    "warning",
    "error",
    "background",
    "textPrimary",
    "textSecondary",
  ]

  const colors: string[] = []
  if (branding.colors) {
    for (const key of colorOrder) {
      const c = branding.colors[key]
      if (typeof c === "string") colors.push(c)
    }
    // Include any extra keys we didn't explicitly order
    for (const [key, value] of Object.entries(branding.colors)) {
      if (!colorOrder.includes(key) && typeof value === "string") {
        colors.push(value)
      }
    }
  }

  const fonts: string[] = []
  if (Array.isArray(branding.fonts)) {
    for (const f of branding.fonts) {
      if (f && typeof f === "object" && typeof f.family === "string") {
        fonts.push(f.family)
      }
    }
  }

  return {
    colors: dedupeColors(colors).slice(0, 6),
    fonts: dedupeFonts(fonts).slice(0, 4),
  }
}

// ---------------------------------------------------------------------------
// LLM fallback from rawHtml
// ---------------------------------------------------------------------------

interface LLMBrandResult {
  colors: string[]
  fonts: string[]
  style: string
}

async function extractWithLLM(rawHtml: string): Promise<LLMBrandResult> {
  // Prefer the <head> and <style> blocks, plus the start of <body>, so we
  // pass the parts most likely to contain CSS custom properties and styling.
  const headMatch = rawHtml.match(/<head[\s\S]*?<\/head>/i)
  const styleMatches = rawHtml.match(/<style[\s\S]*?<\/style>/gi)
  const bodyStart = rawHtml.match(/<body[\s\S]{0,4000}/i)
  const designHtml = [
    headMatch?.[0] || "",
    ...(styleMatches || []),
    bodyStart?.[0] || "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 20000)

  if (!designHtml.trim()) {
    return { colors: [], fonts: [], style: "" }
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: BRAND_EXTRACTOR_PROMPT,
        },
        {
          role: "user",
          content: designHtml,
        },
      ],
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) return { colors: [], fonts: [], style: "" }

    const parsed = JSON.parse(raw) as {
      brandColors?: unknown
      brandFonts?: unknown
      brandStyle?: unknown
    }

    const colors = Array.isArray(parsed.brandColors)
      ? parsed.brandColors.filter((c): c is string => typeof c === "string")
      : []
    const fonts = Array.isArray(parsed.brandFonts)
      ? parsed.brandFonts.filter((f): f is string => typeof f === "string")
      : []
    const style = typeof parsed.brandStyle === "string" ? parsed.brandStyle : ""

    return {
      colors: dedupeColors(colors).slice(0, 6),
      fonts: dedupeFonts(fonts).slice(0, 4),
      style,
    }
  } catch (error) {
    console.error("[brand-extractor] LLM extraction failed", error)
    return { colors: [], fonts: [], style: "" }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract a brand profile from an already-scraped Firecrawl result.
 * Merges the structured `branding` format with a rawHtml LLM analysis so we
 * get multiple colors (primary/secondary/accent) plus a style description.
 */
export async function extractBrandFromScrape(scrape: ScrapeResult): Promise<BrandProfile> {
  const fromBranding = extractFromFirecrawlBranding(scrape.branding)
  const fromLLM = scrape.rawHtml
    ? await extractWithLLM(scrape.rawHtml)
    : { colors: [], fonts: [], style: "" }

  // Colors: prefer Firecrawl if it returned >= 3, else LLM, else merge what we have
  let colors: string[]
  if (fromBranding.colors.length >= 3) {
    colors = fromBranding.colors
  } else if (fromLLM.colors.length >= 3) {
    colors = fromLLM.colors
  } else {
    colors = dedupeColors([...fromBranding.colors, ...fromLLM.colors]).slice(0, 6)
  }

  // Fonts: prefer Firecrawl (structured), fall back to LLM
  const fonts = fromBranding.fonts.length ? fromBranding.fonts : fromLLM.fonts

  // Style: only the LLM produces this
  const style = fromLLM.style || null

  return {
    brandColors: colors.length ? colors : null,
    brandFonts: fonts.length ? fonts : null,
    brandStyle: style,
  }
}

/**
 * Scrape a website URL and extract its brand profile.
 * Used by the refresh endpoint to re-extract brand data for existing businesses.
 */
export async function extractBrandProfile(websiteUrl: string): Promise<BrandProfile> {
  const scrape = await scrapeUrl(websiteUrl, {
    includeRawHtml: true,
    includeBranding: true,
  })
  return extractBrandFromScrape(scrape)
}
