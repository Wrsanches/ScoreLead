import { randomUUID } from "node:crypto"
import { and, eq, gt, inArray, isNull, ne } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  whatsappConnection,
  whatsappSequence,
  whatsappSequenceStep,
  whatsappSignupNonce,
  whatsappTemplate,
} from "@/lib/db/schema"
import { getUserPlan } from "@/lib/plan"
import { getWhatsAppConnection, publicConnection } from "@/lib/whatsapp/data"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"
import { getBusinessAccess } from "@/lib/business-access"
import {
  exchangeEmbeddedSignupCode,
  getWabaPhoneNumber,
  MetaGraphError,
  subscribeWaba,
  unsubscribeWaba,
} from "@/lib/whatsapp/meta"
import { decryptWhatsAppToken, encryptWhatsAppToken } from "@/lib/whatsapp/security"
import { isValidTime, isValidTimezone } from "@/lib/whatsapp/schedule"

const connectSchema = z.object({
  code: z.string().min(10).max(4096),
  nonce: z.string().uuid(),
  wabaId: z.string().min(1).max(100),
  phoneNumberId: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).max(100).default("UTC"),
})

const settingsSchema = z.object({
  timezone: z.string().min(1).max(100),
  allowedWeekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  dailyLimit: z.number().int().min(1).max(100),
  sendWindowStart: z.string(),
  sendWindowEnd: z.string(),
})

async function sessionAndBusiness(
  id: string,
  mode: "view" | "manage" = "manage",
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const access = await getBusinessAccess(session.user.id, id)
  if (!access || (mode === "manage" && access.readOnly)) {
    return { error: NextResponse.json({ error: "Business not found" }, { status: 404 }) }
  }
  if (
    !access.isPlatformAdmin &&
    !hasWhatsAppEarlyAccess(access.ownerEmail)
  ) {
    return {
      error: NextResponse.json(
        { error: "WhatsApp integration is not available yet", code: "FEATURE_NOT_AVAILABLE" },
        { status: 403 },
      ),
    }
  }
  return { session, access }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scope = await sessionAndBusiness(id, "view")
  if (scope.error) return scope.error
  const connection = await getWhatsAppConnection(id)
  return NextResponse.json({
    plan: await getUserPlan(scope.access.ownerUserId),
    connection: connection ? publicConnection(connection) : null,
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scope = await sessionAndBusiness(id)
  if (scope.error) return scope.error
  if (await getUserPlan(scope.session.user.id) !== "pro") {
    return NextResponse.json({ error: "WhatsApp automation requires Pro", code: "PLAN_LIMIT" }, { status: 402 })
  }
  const parsed = connectSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !isValidTimezone(parsed.data?.timezone ?? "")) {
    return NextResponse.json({ error: "Invalid WhatsApp connection payload" }, { status: 400 })
  }

  const [claimedNonce] = await db
    .update(whatsappSignupNonce)
    .set({ usedAt: new Date() })
    .where(and(
      eq(whatsappSignupNonce.id, parsed.data.nonce),
      eq(whatsappSignupNonce.businessId, id),
      eq(whatsappSignupNonce.userId, scope.session.user.id),
      isNull(whatsappSignupNonce.usedAt),
      gt(whatsappSignupNonce.expiresAt, new Date()),
    ))
    .returning({ id: whatsappSignupNonce.id })
  if (!claimedNonce) {
    return NextResponse.json({ error: "WhatsApp signup expired; please try again" }, { status: 409 })
  }

  try {
    const previousConnection = await getWhatsAppConnection(id)
    const accessToken = await exchangeEmbeddedSignupCode(parsed.data.code)
    const phone = await getWabaPhoneNumber(parsed.data.wabaId, parsed.data.phoneNumberId, accessToken)
    const [phoneOwner] = await db
      .select({ businessId: whatsappConnection.businessId })
      .from(whatsappConnection)
      .where(and(
        eq(whatsappConnection.phoneNumberId, phone.id),
        ne(whatsappConnection.businessId, id),
      ))
      .limit(1)
    if (phoneOwner) {
      throw new MetaGraphError("This WhatsApp number is already connected to another business", 409, null, null)
    }
    await subscribeWaba(parsed.data.wabaId, accessToken)
    const now = new Date()
    const connectionId = randomUUID()
    const [saved] = await db
      .insert(whatsappConnection)
      .values({
        id: connectionId,
        businessId: id,
        wabaId: parsed.data.wabaId,
        phoneNumberId: phone.id,
        displayPhoneNumber: phone.display_phone_number ?? null,
        verifiedName: phone.verified_name ?? null,
        encryptedAccessToken: encryptWhatsAppToken(accessToken),
        tokenKeyVersion: 1,
        timezone: parsed.data.timezone,
        status: "connected",
        connectedAt: now,
        disconnectedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: whatsappConnection.businessId,
        set: {
          wabaId: parsed.data.wabaId,
          phoneNumberId: phone.id,
          displayPhoneNumber: phone.display_phone_number ?? null,
          verifiedName: phone.verified_name ?? null,
          encryptedAccessToken: encryptWhatsAppToken(accessToken),
          tokenKeyVersion: 1,
          timezone: parsed.data.timezone,
          status: "connected",
          connectedAt: now,
          disconnectedAt: null,
          updatedAt: now,
        },
      })
      .returning()
    if (previousConnection && previousConnection.wabaId !== parsed.data.wabaId) {
      await db
        .update(whatsappTemplate)
        .set({ supported: false, updatedAt: now })
        .where(eq(whatsappTemplate.connectionId, saved.id))
      if (previousConnection.encryptedAccessToken) {
        try {
          await unsubscribeWaba(
            previousConnection.wabaId,
            decryptWhatsAppToken(previousConnection.encryptedAccessToken),
          )
        } catch (error) {
          console.warn("[whatsapp] could not unsubscribe the replaced WABA", error)
        }
      }
    }
    return NextResponse.json({ connection: publicConnection(saved) })
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhatsApp connection failed"
    const status = error instanceof MetaGraphError && error.status < 500 ? error.status : 502
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scope = await sessionAndBusiness(id)
  if (scope.error) return scope.error
  if (await getUserPlan(scope.session.user.id) !== "pro") {
    return NextResponse.json({ error: "WhatsApp automation requires Pro", code: "PLAN_LIMIT" }, { status: 402 })
  }
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null))
  if (
    !parsed.success ||
    !isValidTimezone(parsed.data.timezone) ||
    !isValidTime(parsed.data.sendWindowStart) ||
    !isValidTime(parsed.data.sendWindowEnd) ||
    parsed.data.sendWindowStart >= parsed.data.sendWindowEnd
  ) {
    return NextResponse.json({ error: "Invalid sending settings" }, { status: 400 })
  }
  const [updated] = await db
    .update(whatsappConnection)
    .set({
      ...parsed.data,
      allowedWeekdays: Array.from(new Set(parsed.data.allowedWeekdays)).sort(),
      updatedAt: new Date(),
    })
    .where(eq(whatsappConnection.businessId, id))
    .returning()
  if (!updated) return NextResponse.json({ error: "WhatsApp is not connected" }, { status: 404 })
  return NextResponse.json({ connection: publicConnection(updated) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scope = await sessionAndBusiness(id)
  if (scope.error) return scope.error
  const connection = await getWhatsAppConnection(id)
  if (!connection) return NextResponse.json({ ok: true })

  if (connection.encryptedAccessToken) {
    try {
      await unsubscribeWaba(connection.wabaId, decryptWhatsAppToken(connection.encryptedAccessToken))
    } catch (error) {
      console.warn("[whatsapp] could not unsubscribe WABA during disconnect", error)
    }
  }
  const now = new Date()
  await db.transaction(async (tx) => {
    const activeSequences = await tx
      .update(whatsappSequence)
      .set({ status: "cancelled", cancelledAt: now, pauseReason: "connection_disconnected", updatedAt: now })
      .where(and(
        eq(whatsappSequence.connectionId, connection.id),
        inArray(whatsappSequence.status, ["draft", "scheduled", "paused"]),
      ))
      .returning({ id: whatsappSequence.id })
    if (activeSequences.length > 0) {
      await tx
        .update(whatsappSequenceStep)
        .set({ status: "cancelled", errorCode: "connection_disconnected", updatedAt: now })
        .where(and(
          inArray(whatsappSequenceStep.sequenceId, activeSequences.map((row) => row.id)),
          eq(whatsappSequenceStep.status, "queued"),
        ))
      await tx
        .update(whatsappSequenceStep)
        .set({
          status: "needs_review",
          errorCode: "disconnected_during_provider_request",
          errorMessage: "The account was disconnected after the provider request may have started; review delivery status.",
          updatedAt: now,
        })
        .where(and(
          inArray(whatsappSequenceStep.sequenceId, activeSequences.map((row) => row.id)),
          eq(whatsappSequenceStep.status, "sending"),
        ))
    }
    await tx
      .update(whatsappConnection)
      .set({
        status: "disconnected",
        encryptedAccessToken: null,
        disconnectedAt: now,
        updatedAt: now,
      })
      .where(eq(whatsappConnection.id, connection.id))
  })
  return NextResponse.json({ ok: true })
}
