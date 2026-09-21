import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailMessage, type business, type lead } from "@/lib/db/schema"
import {
  connectionApiKey,
  publicEmailMessage,
  updateResendConnection,
  type EmailTemplateRow,
  type ResendConnectionRow,
} from "@/lib/resend/data"
import { createResendClient, isResendKeyError } from "@/lib/resend/client"
import { unsubscribeToken } from "@/lib/resend/security"
import { EMAIL_HTML_MAX_BYTES, buildEmailContext, buildPreviewContext, type EmailContext } from "@/lib/resend/render"
import { TemplateRenderError, loadRenderDeps, renderTemplate, type RenderableTemplate } from "@/lib/resend/render-template"
import { appSiteUrl } from "@/lib/site-urls"

export type LeadRow = typeof lead.$inferSelect
export type BusinessRow = typeof business.$inferSelect

export class EmailSendError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = "EmailSendError"
  }
}

export function unsubscribeUrlFor(messageId: string): string {
  const base = (process.env.SCORELEAD_APP_URL || appSiteUrl).replace(/\/+$/, "")
  return `${base}/u/${unsubscribeToken(messageId)}`
}

export interface SendContextInput {
  connection: ResendConnectionRow
  lead: LeadRow
  business: BusinessRow
  senderName: string
  to: string
}

/** The exact context a send would use, so previews match what goes out. */
export function sendContext(input: SendContextInput, messageId: string): EmailContext {
  return buildEmailContext({
    lead: input.lead,
    business: input.business,
    sender: { name: input.senderName || input.connection.fromName, email: input.connection.fromEmail },
    to: input.to,
    unsubscribeUrl: unsubscribeUrlFor(messageId),
  })
}

function mapResendError(name: string, message: string): EmailSendError {
  if (name === "rate_limit_exceeded") return new EmailSendError("RATE_LIMITED", message, 429)
  if (name === "daily_quota_exceeded" || name === "monthly_quota_exceeded") {
    return new EmailSendError("QUOTA_EXCEEDED", message, 429)
  }
  if (isResendKeyError(name)) return new EmailSendError("KEY_INVALID", message, 409)
  if (name === "invalid_from_address") return new EmailSendError("FROM_INVALID", message, 400)
  if (name === "validation_error" || name === "invalid_parameter" || name === "missing_required_field") {
    return new EmailSendError("VALIDATION", message, 400)
  }
  return new EmailSendError("PROVIDER_ERROR", message, 502)
}

/**
 * Render, record, then send. The row exists before the provider call so a
 * webhook that races the response still finds its message (via the tag).
 */
export async function sendTemplateEmail(
  input: SendContextInput & { template: EmailTemplateRow; sentByUserId: string },
) {
  const { connection, template, lead: leadRow, business: biz } = input
  const id = randomUUID()
  const ctx = sendContext(input, id)
  let rendered
  try {
    rendered = await renderTemplate(template, await loadRenderDeps(biz), ctx)
  } catch (error) {
    if (error instanceof TemplateRenderError) throw new EmailSendError("TEMPLATE_INVALID", error.message, 422)
    throw error
  }
  if (rendered.bytes > EMAIL_HTML_MAX_BYTES) {
    throw new EmailSendError("HTML_TOO_LARGE", "Rendered email exceeds the size limit", 413)
  }

  const from = `${connection.fromName.replace(/[<>"\r\n]/g, "").trim()} <${connection.fromEmail}>`
  const now = new Date()
  const [row] = await db
    .insert(emailMessage)
    .values({
      id,
      businessId: biz.id,
      leadId: leadRow.id,
      connectionId: connection.id,
      templateId: template.id,
      sentByUserId: input.sentByUserId,
      toEmail: input.to,
      fromEmail: from,
      replyTo: connection.replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      status: "sending",
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const client = createResendClient(connectionApiKey(connection))
  const unsubscribe = ctx.unsubscribe_url
  const { data, error } = await client.emails.send(
    {
      from,
      to: [input.to],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: connection.replyTo ?? undefined,
      headers: {
        "List-Unsubscribe": `<${unsubscribe}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [
        { name: "scorelead_message_id", value: id },
        { name: "scorelead_business_id", value: biz.id },
      ],
    },
    { idempotencyKey: `scorelead/${id}` },
  )

  if (error) {
    await db
      .update(emailMessage)
      .set({
        status: "failed",
        errorCode: error.name,
        errorMessage: error.message.slice(0, 1000),
        failedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(emailMessage.id, id))
    if (isResendKeyError(error.name)) {
      await updateResendConnection(connection.id, { status: "needs_action" })
    }
    throw mapResendError(error.name, error.message)
  }

  const [updated] = await db
    .update(emailMessage)
    .set({ status: "accepted", resendEmailId: data.id, acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(emailMessage.id, id))
    .returning()
  return publicEmailMessage(updated ?? row)
}

export const TEST_SUBJECT_PREFIX = "[Test] "

/**
 * Sends a template (saved or still unsaved) to an address the user typed,
 * rendered with the sample lead and the real business and sender, exactly like
 * the preview. Nothing is recorded: there is no lead, the unsubscribe link is
 * the sample one, and webhooks ignore the message because it carries no
 * message tag. The subject is prefixed so the test is never mistaken for
 * outreach.
 */
export async function sendTestEmail(input: {
  connection: ResendConnectionRow
  business: BusinessRow
  template: RenderableTemplate
  senderName: string
  to: string
}): Promise<{ subject: string; to: string }> {
  const { connection, business: biz } = input
  const sender = { name: input.senderName || connection.fromName, email: connection.fromEmail }
  const ctx = buildPreviewContext({ business: biz, sender })
  let rendered
  try {
    rendered = await renderTemplate(input.template, await loadRenderDeps(biz), ctx)
  } catch (error) {
    if (error instanceof TemplateRenderError) throw new EmailSendError("TEMPLATE_INVALID", error.message, 422)
    throw error
  }
  if (rendered.bytes > EMAIL_HTML_MAX_BYTES) {
    throw new EmailSendError("HTML_TOO_LARGE", "Rendered email exceeds the size limit", 413)
  }

  const from = `${connection.fromName.replace(/[<>"\r\n]/g, "").trim()} <${connection.fromEmail}>`
  const subject = `${TEST_SUBJECT_PREFIX}${rendered.subject}`
  const client = createResendClient(connectionApiKey(connection))
  const { error } = await client.emails.send({
    from,
    to: [input.to],
    subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: connection.replyTo ?? undefined,
    tags: [
      { name: "scorelead_business_id", value: biz.id },
      { name: "scorelead_test", value: "1" },
    ],
  })
  if (error) {
    if (isResendKeyError(error.name)) await updateResendConnection(connection.id, { status: "needs_action" })
    throw mapResendError(error.name, error.message)
  }
  return { subject, to: input.to }
}
