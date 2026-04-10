import OpenAI from "openai"
import { buildBusinessProfilePrompt } from "@/lib/prompts"

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

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildBusinessProfilePrompt(languageHint),
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
