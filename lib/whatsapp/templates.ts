import type {
  WhatsAppTemplateComponent,
  WhatsAppTemplateParameter,
} from "@/lib/db/schema"

const VARIABLE_RE = /{{\s*([^{}]+?)\s*}}/g
const HAS_VARIABLE_RE = /{{\s*[^{}]+?\s*}}/

export function getTemplateBody(components: WhatsAppTemplateComponent[]): string | null {
  const body = components.find((component) => component.type.toUpperCase() === "BODY")
  return typeof body?.text === "string" ? body.text : null
}

export function getTemplateVariables(components: WhatsAppTemplateComponent[]): string[] {
  const body = getTemplateBody(components)
  if (!body) return []
  return Array.from(body.matchAll(VARIABLE_RE), (match) => match[1].trim())
}

export function isSupportedMarketingTemplate(input: {
  category: string
  status: string
  components: WhatsAppTemplateComponent[]
}): boolean {
  if (input.category.toUpperCase() !== "MARKETING" || input.status.toUpperCase() !== "APPROVED") {
    return false
  }
  const body = getTemplateBody(input.components)
  if (!body) return false
  if (body.replace(VARIABLE_RE, "").trim().length < 10) return false

  return input.components.every((component) => {
    const type = component.type.toUpperCase()
    if (type === "BODY" || type === "FOOTER") return true
    if (type === "HEADER") {
      return (!component.format || component.format.toUpperCase() === "TEXT") &&
        !HAS_VARIABLE_RE.test(component.text ?? "")
    }
    if (type === "BUTTONS") {
      const buttons = component.buttons ?? []
      return buttons.length > 0 && buttons.every((button) => {
        const buttonType = typeof button.type === "string" ? button.type.toUpperCase() : ""
        return (buttonType === "URL" || buttonType === "PHONE_NUMBER") &&
          !JSON.stringify(button).includes("{{")
      })
    }
    return false
  })
}

/** Render every customer-visible fixed part for the approval snapshot. */
export function renderTemplatePreview(
  components: WhatsAppTemplateComponent[],
  parameters: WhatsAppTemplateParameter[],
): string {
  const header = components.find((component) => component.type.toUpperCase() === "HEADER")
  const footer = components.find((component) => component.type.toUpperCase() === "FOOTER")
  const buttons = components.find((component) => component.type.toUpperCase() === "BUTTONS")?.buttons ?? []
  const buttonPreviews = buttons.map((button) => {
    const label = typeof button.text === "string" ? button.text : "CTA"
    const destination = typeof button.url === "string"
      ? button.url
      : typeof button.phone_number === "string"
        ? button.phone_number
        : null
    return destination ? `${label} — ${destination}` : label
  })
  return [
    typeof header?.text === "string" ? header.text : null,
    renderTemplateBody(components, parameters),
    typeof footer?.text === "string" ? footer.text : null,
    ...buttonPreviews,
  ].filter((part): part is string => !!part).join("\n\n")
}

export function renderTemplateBody(
  components: WhatsAppTemplateComponent[],
  parameters: WhatsAppTemplateParameter[],
): string {
  const body = getTemplateBody(components)
  if (!body) throw new Error("Template has no text body")
  const variables = getTemplateVariables(components)
  if (variables.length !== parameters.length) {
    throw new Error("Template parameter count does not match its variables")
  }

  let rendered = body
  variables.forEach((variable, index) => {
    rendered = rendered.replace(
      new RegExp(`{{\\s*${escapeRegExp(variable)}\\s*}}`, "g"),
      parameters[index].text,
    )
  })
  return rendered
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
