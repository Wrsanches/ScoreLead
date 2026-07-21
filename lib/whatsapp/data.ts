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
import { listMessageTemplates } from "@/lib/whatsapp/meta"
import { isSupportedMarketingTemplate } from "@/lib/whatsapp/templates"

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
