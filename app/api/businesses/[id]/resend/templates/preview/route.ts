import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { business, lead } from "@/lib/db/schema"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { getEmailTemplate } from "@/lib/resend/data"
import { TOKEN_EMAIL_CONTEXT, emailComponentsUpdateSchema, emailDocumentSchema } from "@/lib/resend/blocks"
import { EMAIL_BODY_MODES } from "@/lib/resend/template-form"
import {
  EMAIL_HTML_MAX_BYTES,
  EMAIL_SUBJECT_MAX,
  SAMPLE_UNSUBSCRIBE_URL,
  buildEmailContext,
  buildPreviewContext,
  type EmailContext,
} from "@/lib/resend/render"
import { TemplateRenderError, loadRenderDeps, renderTemplate, type RenderableTemplate } from "@/lib/resend/render-template"

const schema = z.object({
  templateId: z.string().min(1).optional(),
  subject: z.string().max(EMAIL_SUBJECT_MAX).optional(),
  bodyMode: z.enum(EMAIL_BODY_MODES).optional(),
  bodyDoc: emailDocumentSchema.optional(),
  bodyHtml: z.string().max(EMAIL_HTML_MAX_BYTES).optional(),
  leadId: z.string().min(1).optional(),
  /** Unsaved shared-component edits, so the dialog can preview before saving. */
  components: emailComponentsUpdateSchema.optional(),
  /** Render with every variable left as its own token (blocks -> html switch). */
  tokens: z.boolean().optional(),
})

/**
 * Render a saved template or an unsaved draft against a real lead of this
 * business, the sample context, or the token context. Used by the builder,
 * the shared-component dialog, and the lead panel.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "view", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  const input = parsed.data

  const [biz] = await db.select().from(business).where(eq(business.id, id)).limit(1)
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 })

  let template: RenderableTemplate
  if (input.templateId) {
    const saved = await getEmailTemplate(id, input.templateId)
    if (!saved) return NextResponse.json({ error: "Template not found" }, { status: 404 })
    template = saved
  } else {
    const bodyMode = input.bodyMode ?? (input.bodyDoc ? "blocks" : "html")
    template = { subject: input.subject ?? "", bodyMode, bodyDoc: input.bodyDoc ?? null, bodyHtml: input.bodyHtml ?? "" }
  }

  const deps = await loadRenderDeps(biz)
  if (input.components) deps.components = { ...deps.components, ...input.components }

  const connection = scoped.connection
  const sender = { name: scoped.session.user.name || connection?.fromName || "", email: connection?.fromEmail || "" }
  let ctx: EmailContext = buildPreviewContext({ business: biz, sender })
  if (input.tokens) {
    ctx = TOKEN_EMAIL_CONTEXT
  } else if (input.leadId) {
    const [row] = await db
      .select()
      .from(lead)
      .where(and(eq(lead.id, input.leadId), eq(lead.businessId, id)))
      .limit(1)
    if (!row) return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    ctx = buildEmailContext({ lead: row, business: biz, sender, unsubscribeUrl: SAMPLE_UNSUBSCRIBE_URL })
  }

  try {
    const rendered = await renderTemplate(template, deps, ctx)
    return NextResponse.json(rendered)
  } catch (error) {
    if (error instanceof TemplateRenderError) {
      return NextResponse.json({ error: error.message, code: "TEMPLATE_INVALID" }, { status: 422 })
    }
    throw error
  }
}
