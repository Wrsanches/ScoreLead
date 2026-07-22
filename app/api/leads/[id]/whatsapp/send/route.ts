import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { after, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  business,
  whatsappSequence,
  whatsappSequenceStep,
  whatsappTemplate,
} from "@/lib/db/schema"
import { processWhatsAppQueue } from "@/lib/jobs/whatsapp-queue"
import { getUserPlan } from "@/lib/plan"
import { generateWhatsAppTemplateValues } from "@/lib/services/whatsapp-template-variables"
import {
  getLatestWhatsAppConsent,
  getOwnedLead,
  getWhatsAppConnection,
} from "@/lib/whatsapp/data"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import {
  getTemplateBody,
  getTemplateVariables,
  renderTemplatePreview,
} from "@/lib/whatsapp/templates"

const bodySchema = z.object({ templateId: z.string().min(1) })

function databaseErrorCode(error: unknown): string | null {
  let current: unknown = error
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const candidate = current as { code?: unknown; cause?: unknown }
    if (typeof candidate.code === "string") return candidate.code
    current = candidate.cause
  }
  return null
}

/**
 * Send a single approved template to a lead right now. Implemented as a
 * one-step sequence set to `scheduled` with the step scheduled for `now`, so
 * the existing queue delivers it while enforcing the send window and daily cap
 * (it self-requeues to the next window/day when limits require).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasWhatsAppEarlyAccess(session.user.email)) {
    return NextResponse.json(
      { error: "WhatsApp integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
      { status: 403 },
    )
  }
  if (await getUserPlan(session.user.id) !== "pro") {
    return NextResponse.json({ error: "WhatsApp automation requires Pro", code: "PLAN_LIMIT" }, { status: 402 })
  }
  const { id } = await params
  const ownedLead = await getOwnedLead(id, session.user.id)
  if (!ownedLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const connection = await getWhatsAppConnection(ownedLead.businessId)
  if (!connection || connection.status !== "connected") {
    return NextResponse.json({ error: "Connect WhatsApp before sending" }, { status: 409 })
  }
  const consent = await getLatestWhatsAppConsent(id)
  if (!consent || consent.status !== "granted") {
    return NextResponse.json({ error: "Record WhatsApp marketing consent first" }, { status: 409 })
  }

  const [template] = await db
    .select()
    .from(whatsappTemplate)
    .where(and(
      eq(whatsappTemplate.connectionId, connection.id),
      eq(whatsappTemplate.id, parsed.data.templateId),
      eq(whatsappTemplate.status, "APPROVED"),
      eq(whatsappTemplate.supported, true),
    ))
  if (!template) {
    return NextResponse.json({ error: "Template is no longer available" }, { status: 409 })
  }

  // Only one active (scheduled) sequence per recipient - matches the partial
  // unique index. The UI hides Send now while a sequence is active, but guard
  // the API too.
  const [active] = await db
    .select({ id: whatsappSequence.id })
    .from(whatsappSequence)
    .where(and(
      eq(whatsappSequence.businessId, ownedLead.businessId),
      eq(whatsappSequence.recipientPhone, consent.phoneE164),
      eq(whatsappSequence.status, "scheduled"),
    ))
    .limit(1)
  if (active) {
    return NextResponse.json(
      { error: "This contact already has an active sequence", code: "ACTIVE_SEQUENCE" },
      { status: 409 },
    )
  }

  const [senderBusiness] = await db.select().from(business).where(eq(business.id, ownedLead.businessId))
  if (!senderBusiness) return NextResponse.json({ error: "Business not found" }, { status: 404 })

  const body = getTemplateBody(template.components)
  if (!body) return NextResponse.json({ error: "Template has no body" }, { status: 409 })
  const variables = getTemplateVariables(template.components)

  const sequenceId = randomUUID()
  const now = new Date()

  try {
    const generated = await generateWhatsAppTemplateValues({
      sender: {
        name: senderBusiness.name,
        description: senderBusiness.description,
        services: senderBusiness.services,
        field: senderBusiness.field,
        persona: senderBusiness.persona,
        website: senderBusiness.website,
      },
      lead: {
        name: ownedLead.name,
        ownerName: ownedLead.ownerName,
        city: ownedLead.city,
        state: ownedLead.state,
        country: ownedLead.country,
        description: ownedLead.description,
        services: ownedLead.services,
        aiSummary: ownedLead.aiSummary,
        website: ownedLead.website,
        existingOutreach: ownedLead.outreachMessages,
      },
      steps: [
        {
          position: 1,
          templateName: template.name,
          language: template.language,
          body,
          variables,
          existingDraft: ownedLead.outreachMessages?.[0]?.body ?? null,
        },
      ],
    })
    const values = generated.get(1) ?? []
    const parameters = variables.map((variable, index) => ({
      type: "text" as const,
      ...(/^\d+$/.test(variable) ? {} : { parameterName: variable }),
      text: values[index],
    }))

    const stepRow = {
      id: randomUUID(),
      sequenceId,
      position: 1,
      offsetDays: 0,
      // Not used for scheduling (scheduledAt is `now`); set to a valid in-window
      // value to satisfy the notNull column.
      localSendTime: connection.sendWindowStart,
      scheduledAt: now,
      status: "queued" as const,
      metaTemplateId: template.metaTemplateId,
      templateName: template.name,
      templateLanguage: template.language,
      templateComponents: template.components,
      templateParameters: parameters,
      renderedBody: renderTemplatePreview(template.components, parameters),
      createdAt: now,
      updatedAt: now,
    }

    await db.transaction(async (tx) => {
      await tx.insert(whatsappSequence).values({
        id: sequenceId,
        businessId: ownedLead.businessId,
        leadId: id,
        connectionId: connection.id,
        recipientPhone: consent.phoneE164,
        status: "scheduled",
        timezone: connection.timezone,
        consentSnapshot: {
          eventId: consent.id,
          status: "granted",
          phoneE164: consent.phoneE164,
          purpose: consent.purpose,
          source: consent.source,
          capturedAt: consent.capturedAt.toISOString(),
          evidenceReference: consent.evidenceReference,
        },
        approvedByUserId: session.user.id,
        approvedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      await tx.insert(whatsappSequenceStep).values(stepRow)
    })

    after(() => processWhatsAppQueue())

    return NextResponse.json(
      {
        sequence: {
          id: sequenceId,
          status: "scheduled",
          recipientPhone: consent.phoneE164,
          timezone: connection.timezone,
          steps: [stepRow],
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (databaseErrorCode(error) === "23505") {
      return NextResponse.json(
        { error: "This contact already has an active sequence", code: "ACTIVE_SEQUENCE" },
        { status: 409 },
      )
    }
    const message = error instanceof Error ? error.message : "Could not send the message"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
