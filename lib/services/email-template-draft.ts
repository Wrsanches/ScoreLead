import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"
import { OPENAI_TEXT_MODEL } from "@/lib/models"
import { resolveLanguageLabel } from "@/lib/services/content-calendar-generator"
import { EMAIL_TEMPLATE_VARIABLES } from "@/lib/resend/render"
import {
  createBlock,
  createEmptyDocument,
  defaultComponents,
  emailComponentPropsByKind,
  isValidHref,
  newBlockId,
  textToRichDoc,
  type EmailBlock,
  type EmailComponentSet,
  type EmailDocument,
} from "@/lib/resend/blocks"
import { emailTemplateFormSchema } from "@/lib/resend/template-form"

export const EMAIL_DRAFT_TONES = ["professional", "friendly", "casual", "direct"] as const

export const emailTemplateDraftRequestSchema = z.object({
  goal: z.string().trim().max(600).optional(),
  tone: z.enum(EMAIL_DRAFT_TONES).optional(),
  proposeComponents: z.boolean().default(false),
})
export type EmailTemplateDraftRequest = z.infer<typeof emailTemplateDraftRequestSchema>

export type EmailTemplateBusinessProfile = {
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
  logo: string | null
  brandColorPrimary: string | null
  brandColorSecondary: string | null
}

// Structured outputs are strict: every field present, nullable instead of optional, no defaults.
const aiBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), text: z.string().max(200), level: z.union([z.literal(1), z.literal(2)]) }),
  z.object({ type: z.literal("text"), paragraphs: z.array(z.string().max(1200)).min(1).max(6) }),
  z.object({ type: z.literal("button"), label: z.string().max(80), href: z.string().max(2000) }),
  z.object({ type: z.literal("divider") }),
  z.object({ type: z.literal("spacer") }),
])
const aiEmailSchema = z.object({
  name: z.string().max(120),
  subject: z.string().max(80),
  previewText: z.string().max(120),
  angle: z.string().max(120),
  blocks: z.array(aiBlockSchema).min(2).max(10),
})
const aiComponentsSchema = z.object({
  header: z.object({ businessName: z.string().max(120), tagline: z.string().max(160) }).nullable(),
  footer: z
    .object({ businessName: z.string().max(120), locationText: z.string().max(200), note: z.string().max(300), unsubscribeLabel: z.string().max(60) })
    .nullable(),
})
const aiOutputSchema = z.object({ emails: z.array(aiEmailSchema).min(1).max(3), components: aiComponentsSchema })
type AiEmail = z.infer<typeof aiEmailSchema>

export interface GeneratedEmailDraft {
  name: string
  subject: string
  previewText: string
  angle: string
  doc: EmailDocument
}
export interface GeneratedEmailDrafts {
  drafts: GeneratedEmailDraft[]
  components: EmailComponentSet | null
}

let client: OpenAI | null = null
function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured")
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

function compactBusinessProfile(profile: EmailTemplateBusinessProfile) {
  return Object.fromEntries(
    Object.entries(profile).flatMap(([key, value]) => {
      const text = value?.trim()
      return text ? [[key, text.slice(0, 3000)]] : []
    }),
  )
}

function httpsOrNull(value: string | null | undefined): string | null {
  const v = value?.trim() ?? ""
  return /^https:\/\/[^\s]+$/i.test(v) ? v : null
}

/** AI blocks into a document: text becomes rich docs, bad buttons fall back to the website or drop. */
export function toEmailDocument(email: AiEmail, profile: EmailTemplateBusinessProfile): EmailDocument {
  const doc = createEmptyDocument()
  doc.previewText = email.previewText.trim().slice(0, 150)
  const blocks: EmailBlock[] = []
  let buttons = 0
  for (const block of email.blocks) {
    switch (block.type) {
      case "heading": {
        const created = createBlock("heading")
        if (created.type === "heading") created.props = { text: block.text.trim(), level: block.level, align: "left" }
        if (block.text.trim()) blocks.push(created)
        break
      }
      case "text": {
        const paragraphs = block.paragraphs.map((p) => p.trim()).filter(Boolean)
        if (paragraphs.length === 0) break
        blocks.push({ id: newBlockId(), type: "text", props: { doc: textToRichDoc(paragraphs), align: "left" } })
        break
      }
      case "button": {
        if (buttons >= 1 || !block.label.trim()) break
        const href = isValidHref(block.href.trim()) ? block.href.trim() : httpsOrNull(profile.website) ? "{{business.website}}" : null
        if (!href) break
        buttons += 1
        blocks.push({ id: newBlockId(), type: "button", props: { label: block.label.trim(), href, align: "left", variant: "primary" } })
        break
      }
      case "divider":
        blocks.push(createBlock("divider"))
        break
      case "spacer":
        blocks.push(createBlock("spacer"))
        break
    }
  }
  doc.blocks = blocks
  return doc
}

function toComponents(value: z.infer<typeof aiComponentsSchema>, profile: EmailTemplateBusinessProfile): EmailComponentSet | null {
  if (!value.header && !value.footer) return null
  const defaults = defaultComponents()
  const website = httpsOrNull(profile.website)
  const set: EmailComponentSet = { header: null, footer: null }
  if (value.header) {
    const header = { ...defaults.header, ...value.header, logoUrl: httpsOrNull(profile.logo) }
    const parsed = emailComponentPropsByKind.header.safeParse(header)
    if (parsed.success) set.header = parsed.data
  }
  if (value.footer) {
    const footer = { ...defaults.footer, ...value.footer, website, unsubscribeLabel: value.footer.unsubscribeLabel.trim() || defaults.footer.unsubscribeLabel }
    const parsed = emailComponentPropsByKind.footer.safeParse(footer)
    if (parsed.success) set.footer = parsed.data
  }
  return set.header || set.footer ? set : null
}

/** Re-validates the model output with the same schema the save route uses; invalid drafts are dropped. */
export function validateGeneratedEmailDrafts(value: unknown, profile: EmailTemplateBusinessProfile): GeneratedEmailDrafts {
  const parsed = aiOutputSchema.parse(value)
  const drafts: GeneratedEmailDraft[] = []
  for (const email of parsed.emails) {
    const doc = toEmailDocument(email, profile)
    const name = email.name.trim().slice(0, 120) || email.subject.trim().slice(0, 120)
    const subject = email.subject.trim()
    const check = emailTemplateFormSchema.safeParse({ name, subject, bodyMode: "blocks", bodyDoc: doc })
    if (!check.success) continue
    drafts.push({ name, subject, previewText: doc.previewText, angle: email.angle.trim(), doc })
  }
  if (drafts.length === 0) throw new Error("AI returned no usable email drafts")
  return { drafts, components: toComponents(parsed.components, profile) }
}

const SYSTEM_RULES = [
  "You write a cold B2B outreach email on behalf of a business, addressed to a prospective client (the lead).",
  "Write one complete email following the requested `angle`; state that angle in the `angle` field in two to four words.",
  "Write everything in the requested language.",
  "Use only facts present in the business profile. Never invent prices, discounts, deadlines, results, statistics, testimonials, or an existing relationship.",
  "Personalize only with variables from `allowedVariables`, written exactly like {{lead.firstName}}. Never invent other placeholders. Prefer {{lead.firstName}}, {{lead.name}}, {{lead.city}}, and {{business.name}}.",
  "Subject: at most 80 characters, sentence case, no all caps, no emoji. previewText: at most 120 characters and it must add to the subject, not repeat it.",
  "Blocks: open with one heading or a greeting paragraph; keep two to five short paragraphs in total; at most one button; no image blocks.",
  "A button `href` must be an https URL that appears in the business profile, or exactly {{business.website}}.",
  "Do not write a footer, contact details, or unsubscribe text inside the blocks. Shared components add those. A short sign-off line with {{sender.name}} at the end of the last paragraph is fine.",
  "Voice: warm, specific, and human. Sound like a peer who noticed them, not marketing automation. Match `persona` and `brandStyle`, and apply the requested `tone`.",
  "Avoid clichés and filler such as 'I hope this message finds you well', 'unlock', 'game-changer', 'perfect solution', 'touch base', 'circle back', 'synergy'. Never mention how the lead was found.",
  "When `proposeComponents` is true, propose copy for a header (business name, tagline) and a footer (business name, location text, a one-line note explaining why they received the email, an unsubscribe label). Otherwise return null for each component.",
  "Output compact JSON on a single line with no whitespace outside string values.",
]

const COMPONENT_RULES = [
  "You write the reusable parts of a business's outreach emails: a header (business name, one-line tagline) and a footer (business name, location text, a one-line note explaining why the recipient got the email, and a short unsubscribe label).",
  "Write in the requested language. Use only facts present in the business profile; never invent addresses, phone numbers, awards, or claims.",
  "Keep every field short and plain. No emoji, no marketing slogans longer than one sentence.",
  "Return null for any component kind that was not requested.",
  "Output compact JSON on a single line with no whitespace outside string values.",
]

/** Drafts shared header/footer copy for the requested kinds from the business profile. */
export async function generateEmailComponents(
  profile: EmailTemplateBusinessProfile,
  kinds: readonly ("header" | "footer")[],
): Promise<EmailComponentSet> {
  const parsed = await parseWithRetry(aiComponentsSchema, "email_shared_components", 900, [
    { role: "system", content: COMPONENT_RULES.join("\n") },
    {
      role: "user",
      content: JSON.stringify({
        language: resolveLanguageLabel(profile.language),
        requestedKinds: kinds,
        businessProfile: compactBusinessProfile(profile),
      }),
    },
  ])
  const set = toComponents(parsed, profile) ?? { header: null, footer: null }
  // Never hand back kinds that were not asked for.
  for (const kind of ["header", "footer"] as const) if (!kinds.includes(kind)) set[kind] = null
  if (!set.header && !set.footer) throw new Error("AI returned no usable components")
  return set
}

/** Why a parse came back empty: truncation, refusal, or an unexpected status. */
function describeEmptyOutput(response: { status?: string | null; incomplete_details?: { reason?: string | null } | null }): string {
  if (response.status === "incomplete") return `output incomplete (${response.incomplete_details?.reason ?? "unknown reason"})`
  return `status ${response.status ?? "unknown"}`
}

const PARSE_ATTEMPTS = 3
/** Whitespace between JSON tokens never legitimately runs this long. */
const WHITESPACE_RUNAWAY_CHARS = 120

class TruncatedOutputError extends Error {}

/**
 * Structured output with runaway detection and retries.
 *
 * Under schema-constrained decoding the model occasionally degenerates into an
 * endless run of whitespace between JSON tokens and only stops at
 * `max_output_tokens`, a minute later. The response is streamed so that run is
 * spotted after a few dozen characters, the stream is aborted, and a fresh
 * attempt starts; the token budget stays as a backstop. Reasoning effort is
 * low because this is copywriting, not planning.
 */
async function parseWithRetry<T>(
  schema: z.ZodType<T>,
  name: string,
  maxOutputTokens: number,
  input: OpenAI.Responses.ResponseInput,
): Promise<T> {
  const client = getClient()
  let lastReason = "unknown"
  for (let attempt = 1; attempt <= PARSE_ATTEMPTS; attempt += 1) {
    try {
      return await streamOnce(client, schema, name, maxOutputTokens, input)
    } catch (error) {
      if (!(error instanceof TruncatedOutputError)) throw error
      lastReason = error.message
      if (attempt < PARSE_ATTEMPTS) console.warn(`[resend] ${name} attempt ${attempt}/${PARSE_ATTEMPTS} failed (${lastReason}), retrying`)
    }
  }
  throw new Error(`AI returned no ${name.replace(/_/g, " ")}: ${lastReason}`)
}

async function streamOnce<T>(
  client: OpenAI,
  schema: z.ZodType<T>,
  name: string,
  maxOutputTokens: number,
  input: OpenAI.Responses.ResponseInput,
): Promise<T> {
  const stream = client.responses.stream({
    model: OPENAI_TEXT_MODEL,
    store: false,
    reasoning: { effort: "low" },
    max_output_tokens: maxOutputTokens,
    text: { format: zodTextFormat(schema, name) },
    input,
  })
  let trailingWhitespace = 0
  let runaway = false
  stream.on("response.output_text.delta", (event) => {
    for (const char of event.delta) trailingWhitespace = /\s/.test(char) ? trailingWhitespace + 1 : 0
    if (trailingWhitespace >= WHITESPACE_RUNAWAY_CHARS && !runaway) {
      runaway = true
      stream.abort()
    }
  })
  let response: Awaited<ReturnType<typeof stream.finalResponse>>
  try {
    response = await stream.finalResponse()
  } catch (error) {
    if (runaway) throw new TruncatedOutputError("whitespace runaway")
    throw error
  }
  if (response.output_parsed) return response.output_parsed as T
  const reason = describeEmptyOutput(response)
  if (response.status === "incomplete" && response.incomplete_details?.reason === "max_output_tokens") throw new TruncatedOutputError(reason)
  throw new Error(`AI returned no ${name.replace(/_/g, " ")}: ${reason}`)
}

const ANGLES = [
  "value-first: lead with the concrete outcome the business creates for companies like the lead",
  "credibility: lead with what makes the business trustworthy, using only facts from the profile",
  "direct ask: short, plain, one specific next step",
] as const

const aiSingleOutputSchema = z.object({ email: aiEmailSchema, components: aiComponentsSchema })

/**
 * Three emails are drafted in parallel, one call per angle. A single call
 * carrying all three regularly ran past the output budget (and the route's
 * time budget); one email per call keeps each response small and fast.
 * Shared-component proposals ride along with the first call only, which gets
 * a slightly larger budget for them.
 */
export async function generateEmailTemplateDrafts(
  profile: EmailTemplateBusinessProfile,
  request: EmailTemplateDraftRequest,
): Promise<GeneratedEmailDrafts> {
  const base = {
    language: resolveLanguageLabel(profile.language),
    goal: request.goal ?? null,
    tone: request.tone ?? "professional",
    allowedVariables: EMAIL_TEMPLATE_VARIABLES,
    businessProfile: compactBusinessProfile(profile),
  }
  const results = await Promise.allSettled(
    ANGLES.map((angle, index) =>
      parseWithRetry(aiSingleOutputSchema, "email_template_draft", index === 0 && request.proposeComponents ? 2200 : 1800, [
        { role: "system", content: SYSTEM_RULES.join("\n") },
        {
          role: "user",
          content: JSON.stringify({
            ...base,
            angle,
            proposeComponents: index === 0 && request.proposeComponents,
          }),
        },
      ]),
    ),
  )
  const emails: z.infer<typeof aiEmailSchema>[] = []
  let components: z.infer<typeof aiComponentsSchema> = { header: null, footer: null }
  for (const result of results) {
    if (result.status === "fulfilled") {
      emails.push(result.value.email)
      if (result.value.components.header || result.value.components.footer) components = result.value.components
    } else {
      console.warn("[resend] one email draft failed:", result.reason instanceof Error ? result.reason.message : result.reason)
    }
  }
  if (emails.length === 0) {
    const first = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined
    throw first?.reason instanceof Error ? first.reason : new Error("AI returned no email drafts")
  }
  return validateGeneratedEmailDrafts({ emails, components }, profile)
}
