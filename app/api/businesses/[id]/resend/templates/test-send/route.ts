import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { rateLimit } from "@/lib/rate-limit"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { getEmailTemplate } from "@/lib/resend/data"
import { emailDocumentSchema } from "@/lib/resend/blocks"
import { EMAIL_BODY_MODES } from "@/lib/resend/template-form"
import { EMAIL_HTML_MAX_BYTES, EMAIL_SUBJECT_MAX } from "@/lib/resend/render"
import { EmailSendError, sendTestEmail } from "@/lib/resend/send"
import type { RenderableTemplate } from "@/lib/resend/render-template"

const schema = z.object({
  to: z.string().trim().toLowerCase().email(),
  templateId: z.string().min(1).optional(),
  subject: z.string().max(EMAIL_SUBJECT_MAX).optional(),
  bodyMode: z.enum(EMAIL_BODY_MODES).optional(),
  bodyDoc: emailDocumentSchema.optional(),
  bodyHtml: z.string().max(EMAIL_HTML_MAX_BYTES).optional(),
})

export const maxDuration = 30

/**
 * Send a saved template or the editor's unsaved draft to an address the user
 * typed, with sample lead data. Same shape as the preview route plus `to`.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage")
  if ("error" in scoped) return scoped.error
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  const input = parsed.data
  const connection = scoped.connection
  if (!connection) return NextResponse.json({ error: "Resend is not connected", code: "NOT_CONNECTED" }, { status: 409 })

  const limit = rateLimit(`resend:test-send:${scoped.session.user.id}`, 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many test emails in a short time", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    )
  }

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
  if (!template.subject.trim()) {
    return NextResponse.json({ error: "Add a subject before sending a test", code: "INVALID_INPUT" }, { status: 400 })
  }

  try {
    const result = await sendTestEmail({ connection, business: biz, template, senderName: scoped.session.user.name, to: input.to })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof EmailSendError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error("[resend] test send failed:", error)
    return NextResponse.json({ error: "Could not send the test email", code: "PROVIDER_ERROR" }, { status: 502 })
  }
}
