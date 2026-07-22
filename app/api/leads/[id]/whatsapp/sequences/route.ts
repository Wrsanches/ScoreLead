import { randomUUID } from "node:crypto"
import { and, eq, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  business,
  whatsappSequence,
  whatsappSequenceStep,
  whatsappTemplate,
} from "@/lib/db/schema"
import { getUserPlan } from "@/lib/plan"
import { generateWhatsAppTemplateValues } from "@/lib/services/whatsapp-template-variables"
import {
  getLatestWhatsAppConsent,
  getOwnedLead,
  getWhatsAppConnection,
} from "@/lib/whatsapp/data"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { isValidTime } from "@/lib/whatsapp/schedule"
import { buildScheduledAtInPostgres } from "@/lib/whatsapp/schedule-db"
import { listWhatsAppSequences } from "@/lib/whatsapp/sequences"
import {
  getTemplateBody,
  getTemplateVariables,
  renderTemplatePreview,
} from "@/lib/whatsapp/templates"

const previewSchema = z.object({
  steps: z.array(z.object({
    templateId: z.string().min(1),
    offsetDays: z.number().int().min(0).max(30),
    localSendTime: z.string(),
  })).length(3),
})

export async function GET(
  _request: Request,
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
  const { id } = await params
  if (!(await getOwnedLead(id, session.user.id))) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
  return NextResponse.json({ sequences: await listWhatsAppSequences(id) })
}

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
  const parsed = previewSchema.safeParse(await request.json().catch(() => null))
  if (
    !parsed.success ||
    parsed.data.steps.some((step) => !isValidTime(step.localSendTime)) ||
    parsed.data.steps.some((step, index) => index > 0 && step.offsetDays < parsed.data.steps[index - 1].offsetDays)
  ) {
    return NextResponse.json({ error: "Invalid WhatsApp sequence" }, { status: 400 })
  }
  const connection = await getWhatsAppConnection(ownedLead.businessId)
  if (!connection || connection.status !== "connected") {
    return NextResponse.json({ error: "Connect WhatsApp before creating a sequence" }, { status: 409 })
  }
  const consent = await getLatestWhatsAppConsent(id)
  if (!consent || consent.status !== "granted") {
    return NextResponse.json({ error: "Record WhatsApp marketing consent first" }, { status: 409 })
  }
  if (parsed.data.steps.some((step) =>
    step.localSendTime < connection.sendWindowStart || step.localSendTime >= connection.sendWindowEnd
  )) {
    return NextResponse.json({ error: "Every step must be inside the configured send window" }, { status: 400 })
  }

  const templateIds = Array.from(new Set(parsed.data.steps.map((step) => step.templateId)))
  const templates = await db
    .select()
    .from(whatsappTemplate)
    .where(and(
      eq(whatsappTemplate.connectionId, connection.id),
      inArray(whatsappTemplate.id, templateIds),
      eq(whatsappTemplate.status, "APPROVED"),
      eq(whatsappTemplate.supported, true),
    ))
  if (templates.length !== templateIds.length) {
    return NextResponse.json({ error: "One or more templates are no longer available" }, { status: 409 })
  }
  const [senderBusiness] = await db.select().from(business).where(eq(business.id, ownedLead.businessId))
  if (!senderBusiness) return NextResponse.json({ error: "Business not found" }, { status: 404 })

  const requests = parsed.data.steps.map((step, index) => {
    const template = templates.find((item) => item.id === step.templateId)!
    const body = getTemplateBody(template.components)
    if (!body) throw new Error("Template has no body")
    return {
      position: index + 1,
      templateName: template.name,
      language: template.language,
      body,
      variables: getTemplateVariables(template.components),
      existingDraft: ownedLead.outreachMessages?.[index]?.body ?? null,
    }
  })

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
      steps: requests,
    })
    const sequenceId = randomUUID()
    const now = new Date()
    const stepRows = await Promise.all(parsed.data.steps.map(async (step, index) => {
      const template = templates.find((item) => item.id === step.templateId)!
      const variables = getTemplateVariables(template.components)
      const values = generated.get(index + 1) ?? []
      const parameters = variables.map((variable, variableIndex) => ({
        type: "text" as const,
        ...(/^\d+$/.test(variable) ? {} : { parameterName: variable }),
        text: values[variableIndex],
      }))
      return {
        id: randomUUID(),
        sequenceId,
        position: index + 1,
        offsetDays: step.offsetDays,
        localSendTime: step.localSendTime,
        scheduledAt: await buildScheduledAtInPostgres({
          now,
          offsetDays: step.offsetDays,
          localSendTime: step.localSendTime,
          timezone: connection.timezone,
          allowedWeekdays: connection.allowedWeekdays,
        }),
        status: "queued",
        metaTemplateId: template.metaTemplateId,
        templateName: template.name,
        templateLanguage: template.language,
        templateComponents: template.components,
        templateParameters: parameters,
        renderedBody: renderTemplatePreview(template.components, parameters),
        createdAt: now,
        updatedAt: now,
      }
    }))
    await db.transaction(async (tx) => {
      const oldDrafts = await tx
        .update(whatsappSequence)
        .set({ status: "cancelled", cancelledAt: now, pauseReason: "replaced_by_new_preview", updatedAt: now })
        .where(and(eq(whatsappSequence.leadId, id), eq(whatsappSequence.status, "draft")))
        .returning({ id: whatsappSequence.id })
      if (oldDrafts.length > 0) {
        await tx
          .update(whatsappSequenceStep)
          .set({ status: "cancelled", updatedAt: now })
          .where(inArray(whatsappSequenceStep.sequenceId, oldDrafts.map((row) => row.id)))
      }
      await tx.insert(whatsappSequence).values({
        id: sequenceId,
        businessId: ownedLead.businessId,
        leadId: id,
        connectionId: connection.id,
        recipientPhone: consent.phoneE164,
        status: "draft",
        timezone: connection.timezone,
        createdAt: now,
        updatedAt: now,
      })
      await tx.insert(whatsappSequenceStep).values(stepRows)
    })
    return NextResponse.json({
      sequence: {
        id: sequenceId,
        status: "draft",
        recipientPhone: consent.phoneE164,
        timezone: connection.timezone,
        steps: stepRows,
      },
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate WhatsApp preview"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
