import Firecrawl from "@mendable/firecrawl-js"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

let firecrawlClient: Firecrawl | null = null
function getFirecrawl(): Firecrawl | null {
  if (!process.env.FIRECRAWL_API_KEY) return null
  if (!firecrawlClient) {
    firecrawlClient = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY })
  }
  return firecrawlClient
}

// ── Types ──────────────────────────────────────────────────

export interface EnrichmentResult {
  email?: string
  phone?: string
  emails?: string[]
  phones?: string[]
  socialMedia?: Record<string, string>
  instagramHandle?: string
  facebookUrl?: string
  services?: string[]
  description?: string
  operatingHours?: string
  ownerName?: string
  yearEstablished?: string
  websiteContent?: string
  teamMembers?: { name: string; role?: string }[]
  pricingInfo?: string
  amenities?: string[]
  enrichmentSources?: string[]
  aiSummary?: string
  businessName?: string
  businessCategory?: string
  relevant?: boolean
}

export interface BusinessContext {
  field?: string | null
  category?: string | null
  description?: string | null
  keywords?: string[]
}

// ── Retry with backoff ─────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const errObj = err as { status?: number; statusCode?: number; message?: string }
      const is429 =
        errObj?.status === 429 ||
        errObj?.statusCode === 429 ||
        String(errObj?.message || "").includes("Rate limit")
      if (is429 && attempt < maxRetries) {
        const delay = Math.min(60000, (attempt + 1) * 30000)
        console.log(`[enrichment] Rate limited, retrying in ${delay / 1000}s`)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
  throw new Error("withRetry: unreachable")
}

// ── Deep crawl + extract ───────────────────────────────────

export async function crawlAndExtract(
  url: string,
  country?: string,
  businessContext?: BusinessContext,
): Promise<EnrichmentResult> {
  const fc = getFirecrawl()
  if (!fc) return {}

  try {
    // Step 1: Map the site to discover all URLs
    const mapResult = (await withRetry(() => fc.map(url))) as unknown as {
      links?: string[]
    }
    const allUrls: string[] = Array.isArray(mapResult?.links)
      ? mapResult.links
      : Array.isArray(mapResult)
        ? (mapResult as unknown as string[])
        : []

    // Step 2: Filter to relevant pages
    const relevantPatterns = [
      /\/(about|sobre|quem.?somos|who.?we)/i,
      /\/(contact|contato|fale.?conosco)/i,
      /\/(class|aula|curso|course|turma)/i,
      /\/(pric|prec|valor|price|plan|plano)/i,
      /\/(schedule|agenda|horar|calendar)/i,
      /\/(team|equipe|instruct|professor)/i,
      /\/(workshop|oficina|masterclass)/i,
      /\/(service|servic)/i,
      /\/(studio|atelie|atelier|espaco)/i,
      /\/(gallery|galeria|portfolio)/i,
    ]

    const homepage = url.replace(/\/$/, "")
    const relevantUrls = [homepage]

    for (const pageUrl of allUrls) {
      if (pageUrl === homepage || pageUrl === homepage + "/") continue
      if (relevantPatterns.some((p) => p.test(pageUrl))) {
        relevantUrls.push(pageUrl)
      }
    }

    const urlsToScrape = relevantUrls.slice(0, 10)

    // Step 3: Batch scrape all pages
    let combinedMarkdown = ""
    const scrapedSources: string[] = []

    // Scrape homepage with full page (not just main content) to capture header/footer links
    const homepageResult = await withRetry(() =>
      fc.scrape(urlsToScrape[0], { formats: ["markdown"], onlyMainContent: false }),
    )
    if (homepageResult.markdown) {
      combinedMarkdown = `## Page: ${urlsToScrape[0]}\n\n${homepageResult.markdown}\n\n`
      scrapedSources.push(urlsToScrape[0])
    }

    // Scrape remaining pages (main content only is fine for these)
    if (urlsToScrape.length > 1) {
      const remainingUrls = urlsToScrape.slice(1)
      const batchResult = (await withRetry(() =>
        (fc as unknown as { batchScrape: (urls: string[], opts: { formats: string[] }) => Promise<unknown> }).batchScrape(remainingUrls, { formats: ["markdown"] }),
      )) as { data?: unknown[]; documents?: unknown[] }
      const docs =
        batchResult?.data || batchResult?.documents || (batchResult as unknown as unknown[]) || []
      if (Array.isArray(docs)) {
        for (const doc of docs) {
          const d = doc as { markdown?: string; metadata?: { sourceURL?: string }; url?: string }
          const md = d?.markdown || ""
          const docUrl = d?.metadata?.sourceURL || d?.url || ""
          if (md) {
            combinedMarkdown += `## Page: ${docUrl}\n\n${md}\n\n---\n\n`
            scrapedSources.push(docUrl)
          }
        }
      }
    }

    if (!combinedMarkdown) return {}

    // Step 4: AI extraction
    const aiResult = await extractWithAI(combinedMarkdown, url, country, businessContext)

    // Step 5: Regex extraction as supplement
    const regexResult = extractFromMarkdown(combinedMarkdown)

    // Step 6: Merge - AI takes priority, regex fills gaps
    const merged: EnrichmentResult = {
      ...regexResult,
      ...aiResult,
      websiteContent: combinedMarkdown.slice(0, 5000),
      enrichmentSources: scrapedSources,
    }

    // Merge arrays from both sources
    merged.emails = [...new Set([...(aiResult.emails || []), ...(regexResult.emails || [])])]
    merged.phones = [...new Set([...(aiResult.phones || []), ...(regexResult.phones || [])])]
    merged.services = [...new Set([...(aiResult.services || []), ...(regexResult.services || [])])]
    merged.amenities = [...new Set([...(aiResult.amenities || []), ...(regexResult.amenities || [])])]

    // Merge social media
    const mergedSocial: Record<string, string> = {}
    for (const [k, v] of Object.entries(regexResult.socialMedia || {})) {
      if (v) mergedSocial[k] = v
    }
    for (const [k, v] of Object.entries(aiResult.socialMedia || {})) {
      if (v) mergedSocial[k] = v
    }
    if (Object.keys(mergedSocial).length > 0) merged.socialMedia = mergedSocial

    merged.instagramHandle = aiResult.instagramHandle || regexResult.instagramHandle
    merged.facebookUrl = aiResult.facebookUrl || regexResult.facebookUrl

    // Merge team members by name
    const allTeam = [...(aiResult.teamMembers || []), ...(regexResult.teamMembers || [])]
    const seenNames = new Set<string>()
    merged.teamMembers = allTeam.filter((t) => {
      if (seenNames.has(t.name)) return false
      seenNames.add(t.name)
      return true
    })

    return merged
  } catch {
    // Fallback to simple scrape
    return scrapeAndExtract(url)
  }
}

// ── Simple single-page scrape ──────────────────────────────

export async function scrapeAndExtract(url: string): Promise<EnrichmentResult> {
  const fc = getFirecrawl()
  if (!fc) return {}

  try {
    const result = await withRetry(() =>
      fc.scrape(url, { formats: ["markdown"] }),
    )
    if (!result.markdown) return {}
    return extractFromMarkdown(result.markdown)
  } catch {
    return {}
  }
}

// ── AI extraction ──────────────────────────────────────────

async function extractWithAI(
  markdown: string,
  websiteUrl: string,
  country?: string,
  businessContext?: BusinessContext,
): Promise<EnrichmentResult> {
  const trimmed = markdown.slice(0, 15000)

  const relevanceInstruction = businessContext
    ? `\nIMPORTANT - Relevance check:
We are looking for leads that are potential competitors or similar businesses to: "${businessContext.description || businessContext.field || ""}" (category: ${businessContext.category || "unknown"}, keywords: ${businessContext.keywords?.join(", ") || "none"}).
- "businessCategory": The primary industry/category of THIS business (e.g. "pottery studio", "brick factory", "restaurant", "yoga studio")
- "relevant": true if this business operates in the SAME field/industry as the search context above. A brick factory is NOT the same as a pottery studio even if both work with ceramics. A construction supply store is NOT the same as an architecture firm. Be strict - only mark as relevant if they truly serve the same market and offer similar services.`
    : ""

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting structured business data from website content.

Extract the following from the provided content. Return ONLY valid JSON:

{
  "businessName": "The official business name",
  "businessCategory": "The primary industry/category of this business",
  "relevant": true,
  "description": "2-3 sentence factual description",
  "aiSummary": "A detailed paragraph analyzing: what makes this business unique, their main offerings, target audience, and overall digital presence quality.",
  "emails": ["all email addresses found"],
  "phones": ["all phone numbers found"],
  "ownerName": "owner or founder name if mentioned",
  "teamMembers": [{"name": "...", "role": "..."}],
  "services": ["list of services they offer"],
  "pricingInfo": "A clean, concise summary of pricing. Format as a short list of offerings with prices, e.g. 'Monthly classes: R$320/month (4 sessions of 2h30) | Free modeling workshop: R$250/person | Glazing workshop: R$200/person'. Strip verbose discount policies and fine print - just the core offering name and price.",
  "operatingHours": "business hours if found",
  "yearEstablished": "year if mentioned",
  "socialMedia": {"instagram": "full URL", "facebook": "full URL", "tiktok": "full URL", "youtube": "full URL", "linkedin": "full URL", "twitter": "full URL", "whatsapp": "wa.me link"},
  "amenities": ["any amenities: parking, wifi, wheelchair accessible, etc"]
}

Rules:
- Only include fields where you found actual data. Use null for missing fields.
- Filter out fake emails (tracking pixels, schema.org, example.com, etc.)
- Look carefully for ALL social links in footers, headers, and contact pages.
- The "description" and "aiSummary" should be in the same language as the website content.
- Be thorough but accurate - don't hallucinate data.${country ? ` The business is located in ${country}.` : ""}${relevanceInstruction}`,
        },
        {
          role: "user",
          content: `Website: ${websiteUrl}\n\nContent:\n${trimmed}`,
        },
      ],
      temperature: 0.1,
      max_completion_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return {}

    const data = JSON.parse(content)
    const result: EnrichmentResult = {}

    if (data.businessName) result.businessName = data.businessName
    if (data.businessCategory) result.businessCategory = data.businessCategory
    result.relevant = data.relevant !== false // default to true if not provided
    if (data.description) result.description = data.description
    if (data.aiSummary) result.aiSummary = data.aiSummary
    if (data.ownerName) result.ownerName = data.ownerName
    if (data.operatingHours) result.operatingHours = data.operatingHours
    if (data.yearEstablished) result.yearEstablished = String(data.yearEstablished)
    if (data.pricingInfo) result.pricingInfo = data.pricingInfo

    if (Array.isArray(data.emails) && data.emails.length > 0) {
      result.emails = data.emails
      result.email = data.emails[0]
    }
    if (Array.isArray(data.phones) && data.phones.length > 0) {
      result.phones = data.phones
      result.phone = data.phones[0]
    }
    if (Array.isArray(data.services)) result.services = data.services
    if (Array.isArray(data.amenities)) result.amenities = data.amenities
    if (Array.isArray(data.teamMembers)) result.teamMembers = data.teamMembers

    if (data.socialMedia && typeof data.socialMedia === "object") {
      const social: Record<string, string> = {}
      for (const [key, value] of Object.entries(data.socialMedia)) {
        if (value && typeof value === "string") {
          social[key] = value.startsWith("http") ? value : `https://${value}`
        }
      }
      if (Object.keys(social).length > 0) {
        result.socialMedia = social
        const igMatch = social.instagram?.match(/instagram\.com\/([^/?]+)/)
        if (igMatch) result.instagramHandle = igMatch[1]
        if (social.facebook) result.facebookUrl = social.facebook
      }
    }

    return result
  } catch {
    return {}
  }
}

// ── Regex extraction ───────────────────────────────────────

function extractFromMarkdown(markdown: string): EnrichmentResult {
  const result: EnrichmentResult = {}
  const text = markdown.toLowerCase()

  // Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const junkDomains = ["example.com", "sentry.io", "wixpress.com", "w3.org", "schema.org", "googleapis.com"]
  const allEmails = [
    ...new Set(
      (markdown.match(emailRegex) || []).filter(
        (e) => !junkDomains.some((d) => e.includes(d)),
      ),
    ),
  ]
  if (allEmails.length > 0) {
    result.email = allEmails[0]
    result.emails = allEmails
  }

  // Phones - strip URLs and hashes first
  const textForPhones = markdown
    .replace(/https?:\/\/[^\s)>\]]+/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/data:[a-zA-Z/;,+=\w]+/g, "")
    .replace(/[a-f0-9]{20,}/gi, "")
    .replace(/\d{13,}/g, "")

  const phonePatterns = [
    /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/g,
    /\+\d{10,15}/g,
  ]
  const allPhones = new Set<string>()
  for (const regex of phonePatterns) {
    const matches = textForPhones.match(regex) || []
    for (const m of matches) {
      const cleaned = m.trim()
      const digits = cleaned.replace(/\D/g, "")
      if (digits.length >= 10 && digits.length <= 15) {
        allPhones.add(cleaned)
      }
    }
  }
  if (allPhones.size > 0) {
    const phonesArr = [...allPhones]
    result.phone = phonesArr[0]
    result.phones = phonesArr
  }

  // Social media links
  const socialMedia: Record<string, string> = {}
  const socialPatterns: [string, RegExp][] = [
    ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?/gi],
    ["facebook", /https?:\/\/(?:www\.)?(?:facebook\.com|fb\.com|fb\.me)\/([a-zA-Z0-9_./-]+)\/?/gi],
    ["tiktok", /https?:\/\/(?:www\.)?tiktok\.com\/@?([a-zA-Z0-9_.]+)\/?/gi],
    ["youtube", /https?:\/\/(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)?([a-zA-Z0-9_.@-]+)\/?/gi],
    ["linkedin", /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_.-]+)\/?/gi],
    ["twitter", /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/?/gi],
    ["whatsapp", /https?:\/\/(?:wa\.me|(?:api\.)?whatsapp\.com\/send\?phone=|web\.whatsapp\.com\/send\?phone=)([a-zA-Z0-9+/-]+)\/?/gi],
  ]

  const junkHandles = new Set(["share", "sharer", "intent", "dialog", "login", "signup", "help", "about", "terms", "privacy", "policy", "p", "watch", "hashtag", "search", "explore"])

  for (const [key, regex] of socialPatterns) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(markdown)) !== null) {
      const handle = match[1]?.replace(/\/+$/, "")
      if (!handle || junkHandles.has(handle.toLowerCase())) continue
      socialMedia[key] = match[0].replace(/\/+$/, "")
      if (key === "instagram") result.instagramHandle = handle
      if (key === "facebook") result.facebookUrl = socialMedia[key]
      break
    }
    regex.lastIndex = 0
  }

  if (Object.keys(socialMedia).length > 0) result.socialMedia = socialMedia

  // Description (best paragraph)
  const paragraphs = markdown
    .split(/\n\n+/)
    .map((p) => p.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim())
    .filter(
      (p) =>
        p.length > 60 &&
        p.length < 600 &&
        !p.startsWith("!") &&
        !p.startsWith("#") &&
        !p.startsWith("|"),
    )
  if (paragraphs.length > 0) {
    result.description = paragraphs[0].slice(0, 400)
  }

  // Website content (trimmed)
  const cleanContent = markdown
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  if (cleanContent.length > 100) {
    result.websiteContent = cleanContent.slice(0, 5000)
  }

  // Operating hours
  const hoursPatterns = [
    /(?:hours|horario|funcionamento)[:\s]*((?:(?:mon|tue|wed|thu|fri|sat|sun|seg|ter|qua|qui|sex|sab|dom)[a-z]*[\s-]+[\d:apm\s-]+[;\n,]*)+)/gi,
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm|h)\s*(?:[-]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|h)))/gi,
  ]
  for (const regex of hoursPatterns) {
    const match = regex.exec(markdown)
    if (match) {
      result.operatingHours =
        match[1]?.trim().slice(0, 200) || match[0].trim().slice(0, 200)
      break
    }
  }

  // Pricing
  const pricePatterns = [
    /(?:price|pricing|cost|rate|preco|valor)[:\s]*[^.]*?\$[\d,.]+[^.]*?\./gi,
    /\$[\d,.]+\s*(?:per|\/)\s*(?:class|session|month|person)/gi,
    /R\$\s*[\d,.]+\s*(?:por|\/)\s*(?:aula|sessao|mes|pessoa)/gi,
  ]
  for (const regex of pricePatterns) {
    const matches = markdown.match(regex)
    if (matches) {
      result.pricingInfo = matches.slice(0, 3).join(" | ").slice(0, 300)
      break
    }
  }

  // Owner/team
  const ownerPatterns = [
    /(?:owner|founder|ceo|director|proprietari[oa]|fundador[a]?)[:\s]+([A-Z][a-z\u00C0-\u00FF]+ [A-Z][a-z\u00C0-\u00FF]+)/g,
    /(?:about|sobre)\s+(?:the\s+)?(?:owner|us)[:\s]*([A-Z][a-z\u00C0-\u00FF]+ [A-Z][a-z\u00C0-\u00FF]+)/gi,
  ]
  const teamMembers: { name: string; role?: string }[] = []
  for (const regex of ownerPatterns) {
    let match
    while ((match = regex.exec(markdown)) !== null) {
      const name = match[1]?.trim()
      if (name && name.length > 4 && name.length < 40) {
        if (!result.ownerName) result.ownerName = name
        if (!teamMembers.some((t) => t.name === name)) {
          teamMembers.push({ name })
        }
      }
    }
  }
  if (teamMembers.length > 0) result.teamMembers = teamMembers

  // Year established
  const yearPatterns = [
    /(?:since|founded|established|est\.?|desde|fundad[oa])\s*(?:in\s*)?(\d{4})/gi,
  ]
  for (const regex of yearPatterns) {
    const match = regex.exec(text)
    if (match) {
      const year = parseInt(match[1])
      if (year >= 1900 && year <= new Date().getFullYear()) {
        result.yearEstablished = match[1]
        break
      }
    }
  }

  // Services (generic - detected from content)
  const serviceKeywords: string[] = []
  const servicePatterns: [string, RegExp][] = [
    ["consulting", /\b(consult|assessoria|consultoria)\b/i],
    ["training", /\b(training|treinamento|capacita)/i],
    ["classes", /\b(class|classes|aula|aulas|curso|cursos)\b/i],
    ["workshops", /\b(workshop|workshops|oficina|oficinas)\b/i],
    ["coaching", /\b(coaching|mentoring|mentoria)\b/i],
    ["design", /\b(design|graphic design|web design|branding)\b/i],
    ["development", /\b(development|desenvolvimento|software)\b/i],
    ["marketing", /\b(marketing|digital marketing|seo|social media)\b/i],
    ["photography", /\b(photography|fotografia|photo shoot)\b/i],
    ["events", /\b(event|events|evento|eventos)\b/i],
    ["ecommerce", /\b(e-?commerce|online store|loja virtual)\b/i],
    ["delivery", /\b(delivery|entrega|shipping)\b/i],
    ["rental", /\b(rental|aluguel|rent)\b/i],
    ["repair", /\b(repair|conserto|manuten)/i],
    ["installation", /\b(installation|instala)/i],
  ]
  for (const [service, regex] of servicePatterns) {
    if (regex.test(text)) serviceKeywords.push(service)
  }
  if (serviceKeywords.length > 0) result.services = serviceKeywords

  return result
}

// ── Enrichment merge ───────────────────────────────────────

export function mergeEnrichment(
  lead: Record<string, unknown>,
  enrichment: EnrichmentResult,
  sourceUrl: string,
): Record<string, unknown> {
  const merged = { ...lead }

  // Simple fields: fill gaps only
  if (!merged.email && enrichment.email) merged.email = enrichment.email
  if (!merged.phone && enrichment.phone) merged.phone = enrichment.phone
  if (!merged.description && enrichment.description) merged.description = enrichment.description
  if (!merged.operatingHours && enrichment.operatingHours) merged.operatingHours = enrichment.operatingHours
  if (!merged.ownerName && enrichment.ownerName) merged.ownerName = enrichment.ownerName
  if (!merged.yearEstablished && enrichment.yearEstablished) merged.yearEstablished = enrichment.yearEstablished
  if (!merged.websiteContent && enrichment.websiteContent) merged.websiteContent = enrichment.websiteContent
  if (!merged.instagramHandle && enrichment.instagramHandle) merged.instagramHandle = enrichment.instagramHandle
  if (!merged.facebookUrl && enrichment.facebookUrl) merged.facebookUrl = enrichment.facebookUrl
  if (!merged.pricingInfo && enrichment.pricingInfo) merged.pricingInfo = enrichment.pricingInfo
  if (!merged.aiSummary && enrichment.aiSummary) merged.aiSummary = enrichment.aiSummary

  // Merge arrays
  const mergeArray = (key: string, newItems: unknown[] | undefined) => {
    if (!newItems?.length) return
    const existing = new Set((merged[key] as unknown[]) || [])
    for (const item of newItems) existing.add(typeof item === "string" ? item : JSON.stringify(item))
    merged[key] = [...existing].map((i) => {
      try { return JSON.parse(i as string) } catch { return i }
    })
  }

  mergeArray("emails", enrichment.emails)
  mergeArray("phones", enrichment.phones)
  mergeArray("services", enrichment.services)
  mergeArray("amenities", enrichment.amenities)

  // Merge team members by name
  const existingTeam = (merged.teamMembers as { name: string; role?: string }[]) || []
  const existingNames = new Set(existingTeam.map((t) => t.name))
  for (const member of enrichment.teamMembers || []) {
    if (!existingNames.has(member.name)) {
      existingTeam.push(member)
      existingNames.add(member.name)
    }
  }
  if (existingTeam.length > 0) merged.teamMembers = existingTeam

  // Merge social media
  const existingSocial = (merged.socialMedia as Record<string, string>) || {}
  for (const [key, value] of Object.entries(enrichment.socialMedia || {})) {
    if (!existingSocial[key]) existingSocial[key] = value
  }
  if (Object.keys(existingSocial).length > 0) merged.socialMedia = existingSocial

  // Track enrichment source
  const sources = new Set((merged.enrichmentSources as string[]) || [])
  sources.add(sourceUrl)
  merged.enrichmentSources = [...sources]

  return merged
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
