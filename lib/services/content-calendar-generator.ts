import OpenAI from "openai"
import { buildContentCalendarPrompt } from "@/lib/prompts"
import type { ContentPillar, ContentPostType } from "@/lib/content-pillars"
import { OPENAI_TEXT_MODEL } from "@/lib/models"

let client: OpenAI | null = null
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

export interface GeneratorBusiness {
  name: string | null
  description: string | null
  persona: string | null
  clientPersona: string | null
  field: string | null
  category: string | null
  tags: string | null
  services: string | null
  location: string | null
  language: string | null
  brandStyle: string | null
  brandColorPrimary: string | null
  brandColorSecondary: string | null
  instagram: string | null
}

export interface PlannedPost {
  scheduledFor: Date
  postType: Exclude<ContentPostType, "story">
  pillar: ContentPillar
  caption: string
  hashtags: string[]
  visualIdea: string
  callToAction: string
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  pt: "Portuguese",
  "pt-br": "Portuguese (pt-BR)",
  "pt-pt": "Portuguese (pt-PT)",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
}

function resolveLanguageLabel(language: string | null): string {
  if (!language) return "English"
  const key = language.toLowerCase()
  return LANGUAGE_LABELS[key] ?? "English"
}

function buildBusinessContext(b: GeneratorBusiness): string {
  const parts: string[] = []
  if (b.name) parts.push(`Business name: ${b.name}`)
  if (b.description) parts.push(`Description: ${b.description}`)
  if (b.field) parts.push(`Industry: ${b.field}`)
  if (b.category) parts.push(`Category: ${b.category}`)
  if (b.persona) parts.push(`Brand voice: ${b.persona}`)
  if (b.clientPersona) parts.push(`Ideal client: ${b.clientPersona}`)
  if (b.services) parts.push(`Services/offerings: ${b.services}`)
  if (b.tags) parts.push(`Tags: ${b.tags}`)
  if (b.location) parts.push(`Location: ${b.location}`)
  if (b.brandStyle) parts.push(`Brand style: ${b.brandStyle}`)
  if (b.brandColorPrimary) {
    parts.push(
      `Brand primary color: ${b.brandColorPrimary}${b.brandColorSecondary ? ` / secondary: ${b.brandColorSecondary}` : ""}`,
    )
  }
  if (b.instagram) parts.push(`Instagram: ${b.instagram}`)
  return parts.join("\n")
}

const VALID_POST_TYPES = new Set(["single", "carousel", "reel"])
const VALID_PILLARS = new Set([
  "educate",
  "showcase",
  "story",
  "proof",
  "engagement",
])

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function clampToMonth(date: Date, start: Date, end: Date): Date {
  if (date < start) return start
  if (date > end) return end
  return date
}

function coerceHashtags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12)
}

export async function generateContentPlan(
  business: GeneratorBusiness,
  monthStart: Date,
  monthEnd: Date,
  postCount?: number,
): Promise<PlannedPost[]> {
  const openai = getOpenAI()
  if (!openai) return []

  const languageLabel = resolveLanguageLabel(business.language)
  const monthLabel = monthStart.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

  const systemPrompt = buildContentCalendarPrompt({
    languageLabel,
    monthLabel,
    postCount,
    startDateIso: monthStart.toISOString(),
    endDateIso: monthEnd.toISOString(),
  })

  const userPrompt = `BUSINESS PROFILE:\n${buildBusinessContext(business) || "(no business context)"}\n\n${postCount ? `Generate ${postCount} posts` : "Decide how many posts to generate"} for ${monthLabel}.`

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_TEXT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_completion_tokens: 8000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    const data = JSON.parse(content) as { posts?: unknown }
    if (!Array.isArray(data.posts)) return []

    const results: PlannedPost[] = []
    for (const raw of data.posts as Array<Record<string, unknown>>) {
      const date = parseDate(raw.scheduledFor)
      if (!date) continue
      const postType = raw.postType
      const pillar = raw.pillar
      const caption = raw.caption
      const visualIdea = raw.visualIdea
      const callToAction = raw.callToAction
      if (
        typeof postType !== "string" ||
        !VALID_POST_TYPES.has(postType) ||
        typeof pillar !== "string" ||
        !VALID_PILLARS.has(pillar) ||
        typeof caption !== "string"
      ) {
        continue
      }
      results.push({
        scheduledFor: clampToMonth(date, monthStart, monthEnd),
        postType: postType as Exclude<ContentPostType, "story">,
        pillar: pillar as ContentPillar,
        caption: caption.slice(0, 2200),
        hashtags: coerceHashtags(raw.hashtags),
        visualIdea: typeof visualIdea === "string" ? visualIdea : "",
        callToAction: typeof callToAction === "string" ? callToAction : "",
      })
    }
    return results
  } catch (err) {
    console.error("[content-calendar] generation failed:", err)
    return []
  }
}
