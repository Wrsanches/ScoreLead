import { brandThemeFromBusiness, type BrandTheme } from "@/lib/emails/blocks/theme"
import { emailDocumentSchema, resolveComponents, type EmailComponentSet } from "@/lib/resend/blocks"
import { getEmailComponents } from "@/lib/resend/components"
import { renderBlocksToHtml } from "@/lib/resend/render-blocks"
import { renderEmailTemplate, type EmailContext, type RenderedEmail } from "@/lib/resend/render"
import type { EmailTemplateRow } from "@/lib/resend/data"

export interface RenderDeps {
  components: EmailComponentSet
  theme: BrandTheme
  lang?: string
}

export class TemplateRenderError extends Error {
  readonly code = "TEMPLATE_INVALID"
  constructor(message = "The template document is invalid") {
    super(message)
    this.name = "TemplateRenderError"
  }
}

export async function loadRenderDeps(business: {
  id: string
  brandColorPrimary?: string | null
  brandColorSecondary?: string | null
  brandColors?: string[] | null
  language?: string | null
}): Promise<RenderDeps> {
  return {
    components: await getEmailComponents(business.id),
    theme: brandThemeFromBusiness(business),
    lang: business.language?.slice(0, 2) || "en",
  }
}

export type RenderableTemplate = Pick<EmailTemplateRow, "subject" | "bodyMode" | "bodyDoc" | "bodyHtml">

/**
 * The one way an email template becomes HTML, for sends and previews alike.
 * Blocks mode renders from the document plus the business's current shared
 * components, so a footer edit reaches every template; html mode uses the
 * stored body. Both then go through the same substitution, unsubscribe
 * guarantee, plain-text, and size accounting.
 */
export async function renderTemplate(template: RenderableTemplate, deps: RenderDeps, ctx: EmailContext): Promise<RenderedEmail> {
  if (template.bodyMode === "html") {
    return renderEmailTemplate({ subject: template.subject, bodyHtml: template.bodyHtml }, ctx)
  }
  const parsed = emailDocumentSchema.safeParse(template.bodyDoc)
  if (!parsed.success) throw new TemplateRenderError()
  const html = await renderBlocksToHtml({
    doc: parsed.data,
    components: resolveComponents(deps.components),
    theme: deps.theme,
    subject: template.subject,
    lang: deps.lang,
  })
  return renderEmailTemplate({ subject: template.subject, bodyHtml: html }, ctx)
}
