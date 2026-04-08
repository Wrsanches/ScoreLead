import OpenAI from "openai"

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
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a lead generation expert. Given a business profile, suggest 8-15 search keywords that would help find potential leads (clients/customers) for this business.

${business.businessModel === "b2b" || business.businessModel === "both" ? "For B2B: suggest keywords describing types of businesses that would be clients (e.g., 'dental clinics', 'law firms', 'real estate agencies')." : ""}
${business.businessModel === "b2c" || business.businessModel === "both" ? "For B2C: suggest keywords describing types of individuals or communities that would be customers (e.g., 'fitness enthusiasts', 'pet owners', 'home buyers')." : ""}

Return JSON: { "keywords": ["keyword1", "keyword2", ...] }

Each keyword should be 1-4 words, specific enough to produce relevant search results. Write keywords in the same language as the business profile.`,
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
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a lead generation expert. Generate 8-12 web search queries to find potential leads for a business.

${business.businessModel === "b2b" || business.businessModel === "both" ? "For B2B leads: generate queries to find businesses that would be clients. Include queries like '{keyword} {location}', '{keyword} companies near {location}', '{keyword} directory {location}'." : ""}
${business.businessModel === "b2c" || business.businessModel === "both" ? "For B2C leads: generate queries to find directories, communities, and listings of potential individual customers. Include queries like '{keyword} groups {location}', 'best {keyword} directory {location}'." : ""}

IMPORTANT: Always include the full location "${location}" in every query. All results must be local to this specific area.

Also include 1-2 competitor-adjacent queries if competitors are provided (e.g., "{competitor} alternatives {location}").

Return JSON: { "queries": ["query1", "query2", ...] }

Generate diverse queries. Maximum 15 queries.`,
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
