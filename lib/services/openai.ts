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
  brandColors: string[]
  brandFonts: string[]
  brandStyle: string
}

export async function extractBusinessProfile(
  content: string,
  detectedLanguage?: string,
  location?: string,
): Promise<BusinessProfile> {
  const languageHint = detectedLanguage || (location ? `inferred from location: ${location}` : null)

  const languageInstruction = languageHint
    ? `The business website language was detected as "${languageHint}". Write ALL text fields (description, persona, clientPersona, field, category, tags, brandStyle) in that same language. Also return a "language" field with the ISO 639-1 code (e.g. "en", "pt", "es").`
    : `Detect the language of the scraped content. Write ALL text fields in the same language as the content. Return a "language" field with the ISO 639-1 code (e.g. "en", "pt", "es").`

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a business analyst and brand design expert. Given scraped content from a business's online presence (including HTML with CSS when available), extract a structured profile. Return JSON with these fields:
- name: The business name
- description: A concise description of what the business does (2-3 sentences)
- persona: A description of the business's brand persona/voice (1-2 sentences)
- clientPersona: A description of their ideal client/customer (1-2 sentences)
- field: The industry or field (e.g., "Technology", "Healthcare", "Real Estate")
- category: MUST be one of these exact values: ${BUSINESS_CATEGORIES.join(", ")}. Pick the closest match. Use "Other" only if nothing fits.
- tags: An array of relevant tags (5-12 tags, maximum 12)
- language: ISO 639-1 language code
- brandColors: Array of hex color codes extracted from the website's CSS/design (primary, secondary, accent colors - up to 6). Look at background colors, text colors, button colors, link colors, and any CSS custom properties/variables. Exclude pure black/white and common grays unless they are clearly part of the brand palette.
- brandFonts: Array of font family names used on the website (up to 4). Extract from CSS font-family declarations, Google Fonts links, or @font-face rules. Use clean names (e.g. "Inter", "Playfair Display"), not full CSS stacks.
- brandStyle: A brief description of the overall visual design style and aesthetic (1-2 sentences). Cover aspects like: modern/classic, minimal/bold, warm/cool tones, rounded/sharp edges, light/dark theme, overall feel.

${languageInstruction}

Be concise and accurate. If information is unclear, make reasonable inferences from context. For brand design fields, only include what you can confidently detect - return empty arrays if the HTML/CSS data is not available.`,
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
