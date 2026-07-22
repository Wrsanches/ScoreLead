import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  business,
  lead,
  whatsappConnection,
  whatsappConsentEvent,
  whatsappTemplate,
} from "@/lib/db/schema"
import { decryptWhatsAppToken } from "@/lib/whatsapp/security"
import {
  createMessageTemplate,
  deleteMessageTemplate,
  editMessageTemplate,
  listMessageTemplates,
} from "@/lib/whatsapp/meta"
import { isSupportedMarketingTemplate } from "@/lib/whatsapp/templates"
import {
  buildTemplateComponents,
  type TemplateFormInput,
} from "@/lib/whatsapp/template-form"

type WhatsAppConnectionRow = NonNullable<
  Awaited<ReturnType<typeof getWhatsAppConnection>>
>

/** Decrypt the connection's access token, refusing a disconnected connection. */
function connectionAccessToken(connection: WhatsAppConnectionRow): string {
  if (connection.status !== "connected" || !connection.encryptedAccessToken) {
    throw new Error("WhatsApp is not connected")
  }
  return decryptWhatsAppToken(connection.encryptedAccessToken)
}

export async function getOwnedBusiness(businessId: string, userId: string) {
  const [row] = await db
    .select()
    .from(business)
    .where(and(eq(business.id, businessId), eq(business.userId, userId)))
  return row ?? null
}

export async function getOwnedLead(leadId: string, userId: string) {
  const [row] = await db
    .select({ lead })
    .from(lead)
    .innerJoin(business, eq(lead.businessId, business.id))
    .where(and(eq(lead.id, leadId), eq(business.userId, userId)))
  return row?.lead ?? null
}

export async function getWhatsAppConnection(businessId: string) {
  const [row] = await db
    .select()
    .from(whatsappConnection)
    .where(eq(whatsappConnection.businessId, businessId))
  return row ?? null
}

export async function getLatestWhatsAppConsent(leadId: string, phoneE164?: string) {
  const where = phoneE164
    ? and(eq(whatsappConsentEvent.leadId, leadId), eq(whatsappConsentEvent.phoneE164, phoneE164))
    : eq(whatsappConsentEvent.leadId, leadId)
  const [row] = await db
    .select()
    .from(whatsappConsentEvent)
    .where(where)
    .orderBy(desc(whatsappConsentEvent.createdAt), desc(whatsappConsentEvent.id))
    .limit(1)
  return row ?? null
}

export function publicConnection(
  connection: NonNullable<Awaited<ReturnType<typeof getWhatsAppConnection>>>,
) {
  return {
    id: connection.id,
    businessId: connection.businessId,
    wabaId: connection.wabaId,
    phoneNumberId: connection.phoneNumberId,
    displayPhoneNumber: connection.displayPhoneNumber,
    verifiedName: connection.verifiedName,
    status: connection.status,
    timezone: connection.timezone,
    allowedWeekdays: connection.allowedWeekdays,
    dailyLimit: connection.dailyLimit,
    sendWindowStart: connection.sendWindowStart,
    sendWindowEnd: connection.sendWindowEnd,
    connectedAt: connection.connectedAt,
    disconnectedAt: connection.disconnectedAt,
    lastTemplateSyncAt: connection.lastTemplateSyncAt,
  }
}

/** All templates for a connection (every status), newest first. */
export async function listConnectionTemplates(connectionId: string) {
  return db
    .select()
    .from(whatsappTemplate)
    .where(eq(whatsappTemplate.connectionId, connectionId))
    .orderBy(desc(whatsappTemplate.updatedAt))
}

/** A single template row scoped to its connection, or null. */
export async function getConnectionTemplate(
  connectionId: string,
  templateId: string,
) {
  const [row] = await db
    .select()
    .from(whatsappTemplate)
    .where(
      and(
        eq(whatsappTemplate.id, templateId),
        eq(whatsappTemplate.connectionId, connectionId),
      ),
    )
  return row ?? null
}

/** Submit a new template to Meta for approval and persist it as PENDING. */
export async function createConnectionTemplate(
  connection: WhatsAppConnectionRow,
  input: TemplateFormInput,
) {
  const accessToken = connectionAccessToken(connection)
  const components = buildTemplateComponents(input)
  const created = await createMessageTemplate(connection.wabaId, accessToken, {
    name: input.name,
    language: input.language,
    category: input.category,
    components,
  })
  const status = (created.status ?? "PENDING").toUpperCase()
  const now = new Date()
  const supported = isSupportedMarketingTemplate({
    category: input.category,
    status,
    components,
  })
  const [row] = await db
    .insert(whatsappTemplate)
    .values({
      id: crypto.randomUUID(),
      connectionId: connection.id,
      metaTemplateId: created.id,
      name: input.name,
      language: input.language,
      category: input.category,
      status,
      components,
      supported,
      rejectionReason: null,
      syncedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [whatsappTemplate.connectionId, whatsappTemplate.metaTemplateId],
      set: {
        name: input.name,
        language: input.language,
        category: input.category,
        status,
        components,
        supported,
        rejectionReason: null,
        syncedAt: now,
        updatedAt: now,
      },
    })
    .returning()
  return row
}

/**
 * Push an edit to Meta and persist it. Meta re-reviews an edited template, so
 * it returns to PENDING. Name and language are immutable and come from the
 * existing row, not the input.
 */
export async function editConnectionTemplate(
  connection: WhatsAppConnectionRow,
  templateRow: { id: string; metaTemplateId: string },
  input: TemplateFormInput,
) {
  const accessToken = connectionAccessToken(connection)
  const components = buildTemplateComponents(input)
  await editMessageTemplate(templateRow.metaTemplateId, accessToken, {
    category: input.category,
    components,
  })
  const now = new Date()
  const status = "PENDING"
  const supported = isSupportedMarketingTemplate({
    category: input.category,
    status,
    components,
  })
  const [row] = await db
    .update(whatsappTemplate)
    .set({
      category: input.category,
      components,
      status,
      supported,
      rejectionReason: null,
      syncedAt: now,
      updatedAt: now,
    })
    .where(eq(whatsappTemplate.id, templateRow.id))
    .returning()
  return row
}

/** Delete a template from Meta and remove the local row. */
export async function deleteConnectionTemplate(
  connection: WhatsAppConnectionRow,
  templateRow: { id: string; name: string; metaTemplateId: string },
) {
  const accessToken = connectionAccessToken(connection)
  await deleteMessageTemplate(
    connection.wabaId,
    accessToken,
    templateRow.name,
    templateRow.metaTemplateId,
  )
  await db.delete(whatsappTemplate).where(eq(whatsappTemplate.id, templateRow.id))
}

export async function syncWhatsAppTemplates(
  connection: NonNullable<Awaited<ReturnType<typeof getWhatsAppConnection>>>,
) {
  if (connection.status !== "connected" || !connection.encryptedAccessToken) {
    throw new Error("WhatsApp is not connected")
  }
  const accessToken = decryptWhatsAppToken(connection.encryptedAccessToken)
  const remote = await listMessageTemplates(connection.wabaId, accessToken)
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx
      .update(whatsappTemplate)
      .set({ supported: false, updatedAt: now })
      .where(eq(whatsappTemplate.connectionId, connection.id))
    for (const template of remote) {
      const supported = isSupportedMarketingTemplate(template)
      await tx
        .insert(whatsappTemplate)
        .values({
          id: crypto.randomUUID(),
          connectionId: connection.id,
          metaTemplateId: template.id,
          name: template.name,
          language: template.language,
          category: template.category,
          status: template.status,
          components: template.components,
          supported,
          rejectionReason: template.rejected_reason ?? null,
          syncedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [whatsappTemplate.connectionId, whatsappTemplate.metaTemplateId],
          set: {
            name: template.name,
            language: template.language,
            category: template.category,
            status: template.status,
            components: template.components,
            supported,
            rejectionReason: template.rejected_reason ?? null,
            syncedAt: now,
            updatedAt: now,
          },
        })
    }
    await tx
      .update(whatsappConnection)
      .set({ lastTemplateSyncAt: now, updatedAt: now })
      .where(eq(whatsappConnection.id, connection.id))
  })

  return db
    .select()
    .from(whatsappTemplate)
    .where(and(
      eq(whatsappTemplate.connectionId, connection.id),
      eq(whatsappTemplate.status, "APPROVED"),
      eq(whatsappTemplate.supported, true),
    ))
    .orderBy(whatsappTemplate.name, whatsappTemplate.language)
}
