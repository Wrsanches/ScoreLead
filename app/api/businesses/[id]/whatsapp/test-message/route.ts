import { randomUUID } from "node:crypto"
import { and, count, eq, gte } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  whatsappConnection,
  whatsappTemplate,
  whatsappTestMessage,
} from "@/lib/db/schema"
import { MetaGraphError, sendTemplateMessage } from "@/lib/whatsapp/meta"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"
import { decryptWhatsAppToken, isE164 } from "@/lib/whatsapp/security"
import {
  buildTestTemplateParameters,
  whatsappTestMessageRequestSchema,
} from "@/lib/whatsapp/test-message"
import { renderTemplatePreview } from "@/lib/whatsapp/templates"

const TEST_MESSAGES_PER_HOUR = 5

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error

  const parsed = whatsappTestMessageRequestSchema.safeParse(
    await request.json().catch(() => null),
  )
  if (!parsed.success || !isE164(parsed.data.phoneE164)) {
    return NextResponse.json(
      { error: "Enter a valid phone number in E.164 format, such as +5511999999999" },
      { status: 400 },
    )
  }

  const [template] = await db
    .select()
    .from(whatsappTemplate)
    .where(
      and(
        eq(whatsappTemplate.id, parsed.data.templateId),
        eq(whatsappTemplate.connectionId, scoped.connection.id),
        eq(whatsappTemplate.status, "APPROVED"),
        eq(whatsappTemplate.supported, true),
      ),
    )
    .limit(1)
  if (!template) {
    return NextResponse.json(
      { error: "This approved template is no longer available" },
      { status: 409 },
    )
  }

  let templateParameters
  try {
    templateParameters = buildTestTemplateParameters(
      template.components,
      parsed.data.values,
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid template values" },
      { status: 400 },
    )
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const [recent] = await db
    .select({ value: count() })
    .from(whatsappTestMessage)
    .where(
      and(
        eq(whatsappTestMessage.businessId, id),
        gte(whatsappTestMessage.createdAt, oneHourAgo),
      ),
    )
  if ((recent?.value ?? 0) >= TEST_MESSAGES_PER_HOUR) {
    return NextResponse.json(
      { error: "Test limit reached. Try again in one hour.", code: "TEST_RATE_LIMIT" },
      { status: 429 },
    )
  }

  if (!scoped.connection.encryptedAccessToken) {
    return NextResponse.json(
      { error: "Reconnect WhatsApp before sending a test" },
      { status: 409 },
    )
  }

  const testMessageId = randomUUID()
  const now = new Date()
  await db.insert(whatsappTestMessage).values({
    id: testMessageId,
    businessId: id,
    connectionId: scoped.connection.id,
    templateId: template.id,
    sentByUserId: scoped.session.user.id,
    recipientPhone: parsed.data.phoneE164,
    templateName: template.name,
    templateLanguage: template.language,
    templateParameters,
    renderedBody: renderTemplatePreview(template.components, templateParameters),
    consentConfirmedAt: now,
    status: "sending",
    createdAt: now,
    updatedAt: now,
  })

  try {
    const result = await sendTemplateMessage({
      phoneNumberId: scoped.connection.phoneNumberId,
      accessToken: decryptWhatsAppToken(scoped.connection.encryptedAccessToken),
      toE164: parsed.data.phoneE164,
      templateName: template.name,
      language: template.language,
      parameters: templateParameters,
    })
    const acceptedAt = new Date()
    await db
      .update(whatsappTestMessage)
      .set({
        status: "accepted",
        metaMessageId: result.messageId,
        acceptedAt,
        updatedAt: acceptedAt,
      })
      .where(eq(whatsappTestMessage.id, testMessageId))
    return NextResponse.json({
      testMessage: {
        id: testMessageId,
        status: "accepted",
        messageId: result.messageId,
      },
    })
  } catch (error) {
    const failedAt = new Date()
    const definitive =
      error instanceof MetaGraphError && error.status >= 400 && error.status < 500
    await db
      .update(whatsappTestMessage)
      .set({
        status: definitive ? "failed" : "needs_review",
        failedAt: definitive ? failedAt : null,
        errorCode:
          error instanceof MetaGraphError
            ? error.code ?? String(error.status)
            : "ambiguous_send_failure",
        errorMessage: error instanceof Error ? error.message : "Unknown send failure",
        updatedAt: failedAt,
      })
      .where(eq(whatsappTestMessage.id, testMessageId))

    if (error instanceof MetaGraphError && (error.status === 401 || error.status === 403)) {
      await db
        .update(whatsappConnection)
        .set({ status: "needs_action", updatedAt: failedAt })
        .where(eq(whatsappConnection.id, scoped.connection.id))
    }

    if (!definitive) {
      return NextResponse.json(
        {
          error: "Meta did not confirm the send. Check the recipient before retrying.",
          code: "DELIVERY_UNCERTAIN",
        },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status === 429 ? 429 : 400 },
    )
  }
}
