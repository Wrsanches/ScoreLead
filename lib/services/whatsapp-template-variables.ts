import OpenAI from "openai"
import { OPENAI_TEXT_MODEL } from "@/lib/models"

type VariableRequest = {
  position: number
  templateName: string
  language: string
  body: string
  variables: string[]
  existingDraft?: string | null
}

type VariableContext = {
  sender: Record<string, unknown>
  lead: Record<string, unknown>
  steps: VariableRequest[]
}

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured")
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null
  const text = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0)
      return code === 9 || code === 10 || code === 13 || code >= 32
    })
    .join("")
    .trim()
  if (!text || text.length > 1024) return null
  return text
}

/**
 * Fill only approved template placeholders. The approved fixed copy is supplied
 * as context and never returned or modified by the model.
 */
export async function generateWhatsAppTemplateValues(
  context: VariableContext,
): Promise<Map<number, string[]>> {
  const variableSteps = context.steps.filter((step) => step.variables.length > 0)
  const result = new Map<number, string[]>()
  context.steps.forEach((step) => {
    if (step.variables.length === 0) result.set(step.position, [])
  })
  if (variableSteps.length === 0) return result

  const response = await getClient().chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_completion_tokens: 1600,
    messages: [
      {
        role: "system",
        content: [
          "You fill placeholders in pre-approved WhatsApp marketing templates.",
          "Return JSON only: {\"steps\":[{\"position\":1,\"values\":[\"...\"]}]}.",
          "Return exactly one value per variable, in the provided order.",
          "Use only facts in the sender and lead context. Never invent claims, prices, relationships, consent, or personal facts.",
          "Keep each value concise, natural, and in the template language.",
          "Do not repeat or rewrite the fixed template body. Do not include markdown.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          sender: context.sender,
          lead: context.lead,
          steps: variableSteps,
        }),
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("AI returned no WhatsApp template values")
  const parsed = JSON.parse(content) as {
    steps?: Array<{ position?: unknown; values?: unknown }>
  }
  for (const requested of variableSteps) {
    const generated = parsed.steps?.find((step) => step.position === requested.position)
    if (!generated || !Array.isArray(generated.values)) {
      throw new Error(`AI omitted WhatsApp sequence step ${requested.position}`)
    }
    const values = generated.values.map(clean)
    if (values.length !== requested.variables.length || values.some((value) => value === null)) {
      throw new Error(`AI returned invalid variables for WhatsApp sequence step ${requested.position}`)
    }
    result.set(requested.position, values as string[])
  }
  return result
}
