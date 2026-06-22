import OpenAI from "openai"
import { buildKeywordSuggestionPrompt, buildSearchQueriesPrompt } from "@/lib/prompts"
import { OPENAI_TEXT_MODEL } from "@/lib/models"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

function safeParseArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [value]
  } catch {
    return value.includes(",") ? value.split(",").map((s) => s.trim()) : [value]
  }
}

interface BusinessProfileForQuery {
  name: string | null
  description: string | null
  persona: string | null
  clientPersona: string | null
  field: string | null
  category: string | null
  tags: string | null
  businessModel: string | null
  services: string | null
  competitors: string | null
  language: string | null
}

export async function suggestKeywords(
  business: BusinessProfileForQuery,
): Promise<string[]> {
  const services = safeParseArray(business.services)
  const tags = safeParseArray(business.tags)
  const competitors = safeParseArray(business.competitors)

  const response = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildKeywordSuggestionPrompt(business.businessModel),
      },
      {
        role: "user",
        content: `Business: ${business.name}
Description: ${business.description}
Client persona: ${business.clientPersona}
Field: ${business.field}
Category: ${business.category}
Business model: ${business.businessModel}
Services: ${services.join(", ")}
Tags: ${tags.join(", ")}
Competitors: ${competitors.join(", ")}`,
      },
    ],
  })

  const result = response.choices[0]?.message?.content
  if (!result) return []

  const parsed = JSON.parse(result) as { keywords: string[] }
  return parsed.keywords.slice(0, 15)
}

/** Traits + query patterns from leads this business already converted. */
export interface WinningExemplars {
  queries: string[]
  traits: string[]
}

interface QueryGenParams {
  business: BusinessProfileForQuery
  keywords: string[]
  location: string
  /** Feedback signal: what has already converted for this business. */
  winning?: WinningExemplars
}

export async function generateSearchQueries(
  params: QueryGenParams,
): Promise<string[]> {
  const { business, keywords, location, winning } = params
  const services = safeParseArray(business.services)
  const competitors = safeParseArray(business.competitors)

  const hasWinning = Boolean(
    winning && (winning.queries.length > 0 || winning.traits.length > 0),
  )
  const winningBlock = hasWinning
    ? `\nProven winners (already converted - find more like these):
Winning queries: ${winning!.queries.join(", ") || "none"}
Winning traits: ${winning!.traits.join(", ") || "none"}`
    : ""

  const response = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildSearchQueriesPrompt(business.businessModel, location, hasWinning),
      },
      {
        role: "user",
        content: `Business: ${business.name}
Description: ${business.description}
Client persona: ${business.clientPersona}
Business model: ${business.businessModel}
Services: ${services.join(", ")}
Keywords: ${keywords.join(", ")}
Location: ${location}
Competitors: ${competitors.join(", ")}${winningBlock}`,
      },
    ],
  })

  const result = response.choices[0]?.message?.content
  if (!result) return keywords.map((kw) => `${kw} ${location}`)

  const parsed = JSON.parse(result) as { queries: string[] }
  return parsed.queries.slice(0, 15)
}
