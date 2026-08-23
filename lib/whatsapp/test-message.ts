import { z } from "zod"
import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateParameter,
} from "@/lib/db/schema"
import { getTemplateVariables } from "@/lib/whatsapp/templates"

export const whatsappTestMessageRequestSchema = z.object({
  phoneE164: z.string().trim().max(16),
  templateId: z.string().min(1).max(100),
  values: z.array(z.string().trim().min(1).max(200)).max(10),
  consentConfirmed: z.literal(true),
})

export function buildTestTemplateParameters(
  components: WhatsAppTemplateComponent[],
  values: string[],
): WhatsAppTemplateParameter[] {
  const variables = getTemplateVariables(components)
  if (variables.length !== values.length) {
    throw new Error("Provide one value for each template variable")
  }

  return variables.map((variable, index) => ({
    type: "text" as const,
    ...(/^\d+$/.test(variable) ? {} : { parameterName: variable }),
    text: values[index].trim(),
  }))
}
