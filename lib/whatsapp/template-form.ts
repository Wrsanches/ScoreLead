import { z } from "zod"
import type { WhatsAppTemplateComponent } from "@/lib/db/schema"

/**
 * Structured input for creating/editing a WhatsApp message template from the
 * website, plus the validation and the Meta `components[]` builder. We support
 * MARKETING and UTILITY categories, a text header, a body with numbered
 * variables ({{1}}, {{2}}, ...), a footer, and up to three buttons.
 */

export const TEMPLATE_CATEGORIES = ["MARKETING", "UTILITY"] as const
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

const HAS_VARIABLE_RE = /{{\s*[^{}]+?\s*}}/
const NUMBERED_VARIABLE_RE = /{{\s*(\d+)\s*}}/g
const ANY_VARIABLE_RE = /{{\s*([^{}]+?)\s*}}/g

const buttonSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("QUICK_REPLY"), text: z.string().min(1).max(25) }),
  z.object({
    type: z.literal("URL"),
    text: z.string().min(1).max(25),
    url: z.string().url().max(2000),
  }),
  z.object({
    type: z.literal("PHONE_NUMBER"),
    text: z.string().min(1).max(25),
    phoneNumber: z.string().min(3).max(20),
  }),
])

export const templateFormSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(512)
      .regex(
        /^[a-z0-9_]+$/,
        "Use lowercase letters, numbers, and underscores only",
      ),
    language: z
      .string()
      .regex(/^[a-z]{2,3}(_[A-Z]{2})?$/, "Invalid language code"),
    category: z.enum(TEMPLATE_CATEGORIES),
    headerText: z.string().max(60).optional(),
    body: z.string().min(1).max(1024),
    bodyExamples: z.array(z.string().min(1).max(200)).max(10).optional(),
    footerText: z.string().max(60).optional(),
    buttons: z.array(buttonSchema).max(3).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.headerText && HAS_VARIABLE_RE.test(data.headerText)) {
      ctx.addIssue({
        code: "custom",
        path: ["headerText"],
        message: "Header text cannot contain variables",
      })
    }

    const rawVars = Array.from(data.body.matchAll(ANY_VARIABLE_RE), (m) =>
      m[1].trim(),
    )
    const allNumeric = rawVars.every((v) => /^\d+$/.test(v))
    if (!allNumeric) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Use numbered variables like {{1}}, {{2}}",
      })
      return
    }

    const uniqueSorted = [
      ...new Set(
        Array.from(data.body.matchAll(NUMBERED_VARIABLE_RE), (m) =>
          Number(m[1]),
        ),
      ),
    ].sort((a, b) => a - b)
    const isSequential = uniqueSorted.every((v, i) => v === i + 1)
    if (uniqueSorted.length > 0 && !isSequential) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Variables must be sequential starting at {{1}}",
      })
    }

    const exampleCount = data.bodyExamples?.length ?? 0
    if (uniqueSorted.length !== exampleCount) {
      ctx.addIssue({
        code: "custom",
        path: ["bodyExamples"],
        message: `Provide one example value for each of the ${uniqueSorted.length} variable(s)`,
      })
    }
  })

export type TemplateFormInput = z.infer<typeof templateFormSchema>

/** Count of distinct numbered variables in a body string. */
export function countBodyVariables(body: string): number {
  return new Set(
    Array.from(body.matchAll(NUMBERED_VARIABLE_RE), (m) => Number(m[1])),
  ).size
}

/** Build the Meta `components[]` payload from validated form input. */
export function buildTemplateComponents(
  input: TemplateFormInput,
): WhatsAppTemplateComponent[] {
  const components: WhatsAppTemplateComponent[] = []

  if (input.headerText?.trim()) {
    components.push({ type: "HEADER", format: "TEXT", text: input.headerText.trim() })
  }

  const body: WhatsAppTemplateComponent = { type: "BODY", text: input.body }
  if (countBodyVariables(input.body) > 0) {
    // Meta expects one row of example values for the body's numbered variables.
    body.example = { body_text: [input.bodyExamples ?? []] }
  }
  components.push(body)

  if (input.footerText?.trim()) {
    components.push({ type: "FOOTER", text: input.footerText.trim() })
  }

  if (input.buttons && input.buttons.length > 0) {
    components.push({
      type: "BUTTONS",
      buttons: input.buttons.map((b) => {
        if (b.type === "URL") return { type: "URL", text: b.text, url: b.url }
        if (b.type === "PHONE_NUMBER") {
          return { type: "PHONE_NUMBER", text: b.text, phone_number: b.phoneNumber }
        }
        return { type: "QUICK_REPLY", text: b.text }
      }),
    })
  }

  return components
}
