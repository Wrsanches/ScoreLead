import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getBusinessAccess } from "@/lib/business-access"
import { can, getUserPlan } from "@/lib/plan"
import { isResendIntegrationEnabled } from "@/lib/resend/feature-access"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import {
  ResendApiError,
  createResendClient,
  ensureResendWebhook,
  removeResendWebhook,
  resendWebhookEndpoint,
  verifyResendApiKey,
} from "@/lib/resend/client"
import {
  connectionApiKey,
  disconnectResendConnection,
  getResendConnection,
  publicResendConnection,
  updateResendConnection,
  upsertResendConnection,
} from "@/lib/resend/data"
import { encryptResendSecret, isResendEncryptionConfigured } from "@/lib/resend/security"
import {
  RESEND_TEST_DOMAIN,
  emailDomain,
  resendConnectionSchema,
  resendSenderSettingsSchema,
} from "@/lib/resend/template-form"

/**
 * View mode: any viewer of the business can see whether email is connected
 * and which plan gate applies; the encrypted key never leaves the server.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const access = await getBusinessAccess(session.user.id, id)
  if (!access) return NextResponse.json({ error: "Business not found" }, { status: 404 })
  const plan = await getUserPlan(access.ownerUserId)
  const connection = await getResendConnection(id)
  return NextResponse.json(
    {
      enabled: isResendIntegrationEnabled() && isResendEncryptionConfigured(),
      plan,
      canUseEmail: can(plan, "emailOutreach"),
      connection: publicResendConnection(connection),
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}

/** Connect (or reconnect) with a pasted API key and chosen sender. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  if (!isResendEncryptionConfigured()) {
    return NextResponse.json({ error: "Email integration is not configured", code: "NOT_CONFIGURED" }, { status: 503 })
  }
  const parsed = resendConnectionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  }
  const { apiKey, fromName, fromEmail, replyTo, domainId } = parsed.data

  let verified: Awaited<ReturnType<typeof verifyResendApiKey>>
  try {
    verified = await verifyResendApiKey(apiKey)
  } catch (error) {
    if (error instanceof ResendApiError) {
      return NextResponse.json({ error: error.message, code: "INVALID_API_KEY" }, { status: 400 })
    }
    return NextResponse.json({ error: "Could not reach Resend", code: "PROVIDER_ERROR" }, { status: 502 })
  }

  const domain = emailDomain(fromEmail)
  if (!domain) return NextResponse.json({ error: "Invalid sender", code: "INVALID_INPUT" }, { status: 400 })
  let domainRow: (typeof verified.domains)[number] | null = null
  if (verified.scope === "full" && domain !== RESEND_TEST_DOMAIN) {
    domainRow =
      verified.domains.find((d) => (domainId ? d.id === domainId : d.name === domain)) ??
      verified.domains.find((d) => d.name === domain) ??
      null
    if (!domainRow || domainRow.name !== domain || !domainRow.sending) {
      return NextResponse.json(
        { error: "The sender domain is not verified in Resend", code: "FROM_DOMAIN_NOT_VERIFIED" },
        { status: 400 },
      )
    }
  }

  const existing = scoped.connection
  const now = new Date()
  const connection = await upsertResendConnection({
    businessId: id,
    status: "connected",
    apiKeyEncrypted: encryptResendSecret(apiKey, id),
    keyVersion: 1,
    keyScope: verified.scope,
    keyLastFour: apiKey.slice(-4),
    fromName,
    fromEmail,
    replyTo: replyTo ?? null,
    domainId: domainRow?.id ?? null,
    domainName: domainRow?.name ?? domain,
    domainStatus: domainRow?.status ?? (domain === RESEND_TEST_DOMAIN ? "verified" : null),
    lastVerifiedAt: now,
    connectedAt: now,
    // A manual secret from a previous connection stays valid; a new key may
    // let us register a fresh webhook below.
    webhookId: existing?.webhookId ?? null,
    webhookSecretEncrypted: existing?.webhookSecretEncrypted ?? null,
    webhookStatus: existing?.webhookStatus === "manual" ? "manual" : "missing",
  })

  // Best effort: register delivery tracking in the customer's account.
  if (connection.webhookStatus !== "manual") {
    try {
      const client = createResendClient(apiKey)
      if (connection.webhookId) await removeResendWebhook(client, connection.webhookId)
      const hook = await ensureResendWebhook(client, resendWebhookEndpoint(connection.id))
      if (hook) {
        await updateResendConnection(connection.id, {
          webhookId: hook.id,
          webhookSecretEncrypted: encryptResendSecret(hook.signingSecret, id),
          webhookStatus: "active",
        })
      }
    } catch {
      /* Leave as missing; the UI offers the manual path. */
    }
  }

  return NextResponse.json({ connection: publicResendConnection(await getResendConnection(id)) })
}

/** Sender settings, or a webhook signing secret pasted from the Resend dashboard. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage")
  if ("error" in scoped) return scoped.error
  const parsed = resendSenderSettingsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  }
  const { fromName, fromEmail, replyTo, webhookSigningSecret } = parsed.data
  const connection = scoped.connection!
  const patch: Parameters<typeof updateResendConnection>[1] = {}
  if (fromName !== undefined) patch.fromName = fromName
  if (fromEmail !== undefined) {
    const domain = emailDomain(fromEmail)
    if (!domain) return NextResponse.json({ error: "Invalid sender", code: "INVALID_INPUT" }, { status: 400 })
    if (connection.keyScope === "full" && domain !== RESEND_TEST_DOMAIN && domain !== connection.domainName) {
      // Changing domains needs a fresh verification pass; re-check with the stored key.
      try {
        const verified = await verifyResendApiKey(connectionApiKey(connection))
        const row = verified.domains.find((d) => d.name === domain)
        if (!row?.sending) {
          return NextResponse.json(
            { error: "The sender domain is not verified in Resend", code: "FROM_DOMAIN_NOT_VERIFIED" },
            { status: 400 },
          )
        }
        patch.domainId = row.id
        patch.domainName = row.name
        patch.domainStatus = row.status
      } catch {
        return NextResponse.json({ error: "Could not verify the sender domain", code: "PROVIDER_ERROR" }, { status: 502 })
      }
    }
    patch.fromEmail = fromEmail
  }
  if (replyTo !== undefined) patch.replyTo = replyTo
  if (webhookSigningSecret) {
    patch.webhookSecretEncrypted = encryptResendSecret(webhookSigningSecret, id)
    patch.webhookStatus = "manual"
  }
  const updated = await updateResendConnection(connection.id, patch)
  return NextResponse.json({ connection: publicResendConnection(updated) })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const connection = scoped.connection
  if (connection && connection.status !== "disconnected") {
    if (connection.webhookId && connection.webhookStatus === "active" && connection.apiKeyEncrypted) {
      try {
        await removeResendWebhook(createResendClient(connectionApiKey(connection)), connection.webhookId)
      } catch {
        /* best effort */
      }
    }
    await disconnectResendConnection(connection.id)
  }
  return NextResponse.json({ ok: true })
}
