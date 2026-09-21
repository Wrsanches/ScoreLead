import { randomUUID } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  emailMessage,
  emailSuppression,
  emailTemplate,
  resendConnection,
  type EmailSuppressionReason,
} from "@/lib/db/schema"
import { decryptResendSecret } from "@/lib/resend/security"
import { resendWebhookEndpoint } from "@/lib/resend/client"
import type { EmailBodyMode } from "@/lib/resend/template-form"
import type { EmailDocument } from "@/lib/resend/blocks"

export type ResendConnectionRow = typeof resendConnection.$inferSelect
export type EmailTemplateRow = typeof emailTemplate.$inferSelect
export type EmailMessageRow = typeof emailMessage.$inferSelect

// ---------------------------------------------------------------- connection

export async function getResendConnection(businessId: string): Promise<ResendConnectionRow | null> {
  const [row] = await db
    .select()
    .from(resendConnection)
    .where(eq(resendConnection.businessId, businessId))
  return row ?? null
}

export async function getResendConnectionById(id: string): Promise<ResendConnectionRow | null> {
  const [row] = await db.select().from(resendConnection).where(eq(resendConnection.id, id))
  return row ?? null
}

/** Never returns the encrypted columns. */
export function publicResendConnection(row: ResendConnectionRow | null) {
  if (!row || row.status === "disconnected") return null
  return {
    id: row.id,
    businessId: row.businessId,
    status: row.status,
    keyScope: row.keyScope,
    keyLastFour: row.keyLastFour,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    replyTo: row.replyTo,
    domainId: row.domainId,
    domainName: row.domainName,
    domainStatus: row.domainStatus,
    webhookStatus: row.webhookStatus,
    webhookEndpoint: resendWebhookEndpoint(row.id),
    lastVerifiedAt: row.lastVerifiedAt,
    connectedAt: row.connectedAt,
    updatedAt: row.updatedAt,
  }
}

export type PublicResendConnection = NonNullable<ReturnType<typeof publicResendConnection>>

export function connectionApiKey(row: ResendConnectionRow): string {
  if (row.status === "disconnected" || !row.apiKeyEncrypted) {
    throw new Error("Resend is not connected")
  }
  return decryptResendSecret(row.apiKeyEncrypted, row.businessId)
}

export function connectionWebhookSecret(row: ResendConnectionRow): string | null {
  if (!row.webhookSecretEncrypted) return null
  return decryptResendSecret(row.webhookSecretEncrypted, row.businessId)
}

type ConnectionUpsert = Omit<typeof resendConnection.$inferInsert, "id" | "createdAt" | "updatedAt">

/** One connection per business; reconnecting reuses the row (and its id, so webhook URLs stay valid). */
export async function upsertResendConnection(values: ConnectionUpsert): Promise<ResendConnectionRow> {
  const existing = await getResendConnection(values.businessId)
  const now = new Date()
  if (existing) {
    const [row] = await db
      .update(resendConnection)
      .set({ ...values, disconnectedAt: null, updatedAt: now })
      .where(eq(resendConnection.id, existing.id))
      .returning()
    return row
  }
  const [row] = await db
    .insert(resendConnection)
    .values({ id: randomUUID(), ...values, createdAt: now, updatedAt: now })
    .returning()
  return row
}

export async function updateResendConnection(
  id: string,
  patch: Partial<typeof resendConnection.$inferInsert>,
): Promise<ResendConnectionRow | null> {
  const [row] = await db
    .update(resendConnection)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(resendConnection.id, id))
    .returning()
  return row ?? null
}

export async function disconnectResendConnection(id: string): Promise<void> {
  const now = new Date()
  await db
    .update(resendConnection)
    .set({
      status: "disconnected",
      apiKeyEncrypted: null,
      webhookSecretEncrypted: null,
      webhookId: null,
      webhookStatus: "missing",
      disconnectedAt: now,
      updatedAt: now,
    })
    .where(eq(resendConnection.id, id))
}

// ----------------------------------------------------------------- templates

export async function listEmailTemplates(businessId: string): Promise<EmailTemplateRow[]> {
  return db
    .select()
    .from(emailTemplate)
    .where(eq(emailTemplate.businessId, businessId))
    .orderBy(desc(emailTemplate.updatedAt))
}

export async function getEmailTemplate(businessId: string, templateId: string): Promise<EmailTemplateRow | null> {
  const [row] = await db
    .select()
    .from(emailTemplate)
    .where(and(eq(emailTemplate.id, templateId), eq(emailTemplate.businessId, businessId)))
  return row ?? null
}

/** What the save routes persist after rendering the blocks snapshot. */
export interface TemplateSaveValues {
  name: string
  subject: string
  bodyMode: EmailBodyMode
  bodyDoc: EmailDocument | null
  bodyHtml: string
}

export async function createEmailTemplate(
  businessId: string,
  input: TemplateSaveValues,
  createdByUserId: string,
): Promise<EmailTemplateRow> {
  const now = new Date()
  const [row] = await db
    .insert(emailTemplate)
    .values({
      id: randomUUID(),
      businessId,
      name: input.name,
      subject: input.subject,
      bodyMode: input.bodyMode,
      bodyDoc: input.bodyMode === "blocks" ? input.bodyDoc : null,
      bodyHtml: input.bodyHtml,
      createdByUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return row
}

export async function updateEmailTemplate(
  businessId: string,
  templateId: string,
  input: TemplateSaveValues,
): Promise<EmailTemplateRow | null> {
  const [row] = await db
    .update(emailTemplate)
    .set({
      name: input.name,
      subject: input.subject,
      bodyMode: input.bodyMode,
      bodyDoc: input.bodyMode === "blocks" ? input.bodyDoc : null,
      bodyHtml: input.bodyHtml,
      updatedAt: new Date(),
    })
    .where(and(eq(emailTemplate.id, templateId), eq(emailTemplate.businessId, businessId)))
    .returning()
  return row ?? null
}

export async function deleteEmailTemplate(businessId: string, templateId: string): Promise<boolean> {
  const rows = await db
    .delete(emailTemplate)
    .where(and(eq(emailTemplate.id, templateId), eq(emailTemplate.businessId, businessId)))
    .returning({ id: emailTemplate.id })
  return rows.length > 0
}

// ------------------------------------------------------------------ messages

export async function listLeadEmailMessages(leadId: string): Promise<EmailMessageRow[]> {
  return db
    .select()
    .from(emailMessage)
    .where(eq(emailMessage.leadId, leadId))
    .orderBy(desc(emailMessage.createdAt))
    .limit(50)
}

/** Timeline view for the lead page: metadata and stamps, never the HTML body. */
export function publicEmailMessage(row: EmailMessageRow) {
  return {
    id: row.id,
    leadId: row.leadId,
    templateId: row.templateId,
    toEmail: row.toEmail,
    fromEmail: row.fromEmail,
    subject: row.subject,
    status: row.status,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    openCount: row.openCount,
    clickCount: row.clickCount,
    lastClickedUrl: row.lastClickedUrl,
    acceptedAt: row.acceptedAt,
    sentAt: row.sentAt,
    deliveredAt: row.deliveredAt,
    delayedAt: row.delayedAt,
    openedAt: row.openedAt,
    clickedAt: row.clickedAt,
    bouncedAt: row.bouncedAt,
    complainedAt: row.complainedAt,
    failedAt: row.failedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export type PublicEmailMessage = ReturnType<typeof publicEmailMessage>

// --------------------------------------------------------------- suppression

export async function isSuppressed(businessId: string, email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: emailSuppression.id })
    .from(emailSuppression)
    .where(and(eq(emailSuppression.businessId, businessId), eq(emailSuppression.email, email.toLowerCase())))
    .limit(1)
  return !!row
}

export async function addSuppression(input: {
  businessId: string
  email: string
  reason: EmailSuppressionReason
  messageId?: string | null
}): Promise<void> {
  await db
    .insert(emailSuppression)
    .values({
      id: randomUUID(),
      businessId: input.businessId,
      email: input.email.toLowerCase(),
      reason: input.reason,
      messageId: input.messageId ?? null,
    })
    .onConflictDoNothing({ target: [emailSuppression.businessId, emailSuppression.email] })
}
