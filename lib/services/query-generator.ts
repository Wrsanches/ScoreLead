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

interface QueryGenParams {
  business: BusinessProfileForQuery
  keywords: string[]
  location: string
}

export async function generateSearchQueries(
  params: QueryGenParams,
): Promise<string[]> {
  const { business, keywords, location } = params
  const services = safeParseArray(business.services)
  const competitors = safeParseArray(business.competitors)

  const response = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildSearchQueriesPrompt(business.businessModel, location),
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
Competitors: ${competitors.join(", ")}`,
      },
    ],
  })

  const result = response.choices[0]?.message?.content
  if (!result) return keywords.map((kw) => `${kw} ${location}`)

  const parsed = JSON.parse(result) as { queries: string[] }
  return parsed.queries.slice(0, 15)
}
