import OpenAI from "openai"
import { BUSINESS_CATEGORIES } from "@/lib/categories"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface BusinessProfile {
  name: string
  description: string
  persona: string
  clientPersona: string
  field: string
  category: string
  tags: string[]
  language: string
}

export async function extractBusinessProfile(
  content: string,
  detectedLanguage?: string,
  location?: string,
): Promise<BusinessProfile> {
  const languageHint = detectedLanguage || (location ? `inferred from location: ${location}` : null)

  const languageInstruction = languageHint
    ? `The business website language was detected as "${languageHint}". Write ALL text fields (description, persona, clientPersona, field, category, tags) in that same language. Also return a "language" field with the ISO 639-1 code (e.g. "en", "pt", "es").`
    : `Detect the language of the scraped content. Write ALL text fields in the same language as the content. Return a "language" field with the ISO 639-1 code (e.g. "en", "pt", "es").`

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a business analyst. Given scraped content from a business's online presence, extract a structured profile. Return JSON with these fields:
- name: The business name
- description: A concise description of what the business does (2-3 sentences)
- persona: A description of the business's brand persona/voice (1-2 sentences)
- clientPersona: A description of their ideal client/customer (1-2 sentences)
- field: The industry or field (e.g., "Technology", "Healthcare", "Real Estate")
- category: MUST be one of these exact values: ${BUSINESS_CATEGORIES.join(", ")}. Pick the closest match. Use "Other" only if nothing fits.
- tags: An array of relevant tags (5-12 tags, maximum 12)
- language: ISO 639-1 language code

${languageInstruction}

Be concise and accurate. If information is unclear, make reasonable inferences from context.`,
      },
      {
        role: "user",
        content,
      },
    ],
  })

  const result = response.choices[0]?.message?.content
  if (!result) throw new Error("No response from OpenAI")

  return JSON.parse(result) as BusinessProfile
}
