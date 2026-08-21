import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"
import { OPENAI_TEXT_MODEL } from "@/lib/models"
import {
  TEMPLATE_CATEGORIES,
  templateFormSchema,
  type TemplateCategory,
} from "@/lib/whatsapp/template-form"

export const whatsappTemplateDraftRequestSchema = z.object({
  language: z
    .string()
    .regex(/^[a-z]{2,3}(_[A-Z]{2})?$/, "Invalid language code"),
  category: z.enum(TEMPLATE_CATEGORIES),
  currentDraft: z
    .object({
      name: z.string().max(512),
      headerText: z.string().max(60),
      body: z.string().max(1024),
      footerText: z.string().max(60),
    })
    .optional(),
})

export type WhatsAppTemplateDraftRequest = z.infer<
  typeof whatsappTemplateDraftRequestSchema
>

export type WhatsAppTemplateBusinessProfile = {
  name: string | null
  description: string | null
  persona: string | null
  clientPersona: string | null
  field: string | null
  category: string | null
  tags: string | null
  location: string | null
  language: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  services: string | null
  serviceArea: string | null
  brandStyle: string | null
  businessModel: string | null
}

const generatedDraftSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(512)
    .regex(/^[a-z0-9_]+$/),
  headerText: z.string().max(60).nullable(),
  body: z.string().min(1).max(1024),
  bodyExamples: z.array(z.string().min(1).max(200)).max(10),
  footerText: z.string().max(60).nullable(),
})

export type GeneratedWhatsAppTemplateDraft = {
  name: string
  headerText: string
  body: string
  bodyExamples: string[]
  footerText: string
}

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured")
  }
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

function compactBusinessProfile(profile: WhatsAppTemplateBusinessProfile) {
  return Object.fromEntries(
    Object.entries(profile).flatMap(([key, value]) => {
      const text = value?.trim()
      return text ? [[key, text.slice(0, 3000)]] : []
    }),
  )
}

function categoryInstructions(category: TemplateCategory): string {
  return category === "MARKETING"
    ? "Create concise, consent-based promotional outreach that communicates a real value proposition from the business profile. Do not invent a discount, price, deadline, guarantee, or result."
    : "Create a strictly non-promotional utility update tied to a customer-requested service, appointment, order, or account action. It must not contain an offer, upsell, or cold outreach language."
}

/**
 * Apply the same validation used by the Meta submission route before returning
 * an AI draft to the browser. This prevents malformed placeholders or example
 * values from being inserted into the template form.
 */
export function validateGeneratedWhatsAppTemplateDraft(
  value: unknown,
  request: Pick<WhatsAppTemplateDraftRequest, "language" | "category">,
): GeneratedWhatsAppTemplateDraft {
  const draft = generatedDraftSchema.parse(value)
  const validated = templateFormSchema.safeParse({
    name: draft.name,
    language: request.language,
    category: request.category,
    headerText: draft.headerText ?? undefined,
    body: draft.body,
    bodyExamples: draft.bodyExamples,
    footerText: draft.footerText ?? undefined,
  })

  if (!validated.success) {
    throw new Error(
      validated.error.issues[0]?.message ?? "AI returned an invalid WhatsApp template",
    )
  }

  return {
    name: validated.data.name,
    headerText: validated.data.headerText ?? "",
    body: validated.data.body,
    bodyExamples: validated.data.bodyExamples ?? [],
    footerText: validated.data.footerText ?? "",
  }
}

/** Generate an editable draft only. The user must review and submit it to Meta. */
export async function generateWhatsAppTemplateDraft(
  profile: WhatsAppTemplateBusinessProfile,
  request: WhatsAppTemplateDraftRequest,
): Promise<GeneratedWhatsAppTemplateDraft> {
  const response = await getClient().responses.parse({
    model: OPENAI_TEXT_MODEL,
    store: false,
    max_output_tokens: 1200,
    text: {
      format: zodTextFormat(generatedDraftSchema, "whatsapp_template_draft"),
    },
    input: [
      {
        role: "system",
        content: [
          "You draft one message template for the official WhatsApp Business Platform.",
          "Use only facts provided in the business profile and current draft. Never invent prices, offers, results, urgency, customer relationships, consent, or personal facts.",
          "Write natural fixed copy in the requested locale and match the business tone. Do not use markdown.",
          "The template name must use only lowercase ASCII letters, numbers, and underscores and should describe the message purpose.",
          "Header and footer cannot contain variables. Keep the footer useful and non-repetitive.",
          "The body may use zero to two numbered variables, starting at {{1}} and continuing sequentially. Use {{1}} for the recipient first name when personalization helps.",
          "Return exactly one realistic, non-sensitive example for every body variable, in order. Return an empty examples array when there are no variables.",
          "Avoid sensitive attributes, misleading claims, pressure tactics, and policy-evasion language.",
          categoryInstructions(request.category),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          requestedLocale: request.language,
          requestedCategory: request.category,
          businessProfile: compactBusinessProfile(profile),
          currentDraft: request.currentDraft,
        }),
      },
    ],
  })

  if (!response.output_parsed) {
    throw new Error("AI returned no WhatsApp template draft")
  }

  return validateGeneratedWhatsAppTemplateDraft(response.output_parsed, request)
}
