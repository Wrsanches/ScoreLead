import { Resend } from "resend"
import { appSiteUrl } from "@/lib/site-urls"
import { RESEND_WEBHOOK_EVENTS } from "@/lib/resend/constants"

/**
 * Thin wrappers over the Resend SDK for a customer's own API key. Everything
 * here is stateless: callers pass the decrypted key each time.
 */

export class ResendApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number | null = null,
  ) {
    super(message)
    this.name = "ResendApiError"
  }
}

const KEY_ERRORS = new Set(["invalid_api_key", "missing_api_key", "restricted_api_key", "invalid_access"])

export function isResendKeyError(code: string | null | undefined): boolean {
  return !!code && KEY_ERRORS.has(code)
}

export function createResendClient(apiKey: string): Resend {
  return new Resend(apiKey)
}

export interface ResendDomainSummary {
  id: string
  name: string
  status: string
  region: string
  /** Whether Resend will accept mail from this domain today. */
  sending: boolean
}

export type ResendKeyScope = "full" | "sending"

/**
 * A full-access key can list domains; a sending-only key cannot, which Resend
 * reports as `restricted_api_key`. Anything else means the key is unusable.
 */
export async function verifyResendApiKey(
  apiKey: string,
): Promise<{ scope: ResendKeyScope; domains: ResendDomainSummary[] }> {
  const client = createResendClient(apiKey)
  const { data, error } = await client.domains.list()
  if (error) {
    if (error.name === "restricted_api_key") return { scope: "sending", domains: [] }
    throw new ResendApiError(error.name, error.message, error.statusCode)
  }
  const domains = (data?.data ?? []).map((d) => ({
    id: d.id,
    name: d.name.toLowerCase(),
    status: d.status,
    region: d.region,
    sending: d.status === "verified" && (d.capabilities?.sending ?? "enabled") === "enabled",
  }))
  return { scope: "full", domains }
}


export function resendWebhookEndpoint(connectionId: string): string {
  const base = (
    process.env.RESEND_WEBHOOK_PUBLIC_URL ||
    process.env.SCORELEAD_APP_URL ||
    appSiteUrl
  ).replace(/\/+$/, "")
  return `${base}/api/webhooks/resend/${connectionId}`
}

/** Returns null when the key is not allowed to manage webhooks. */
export async function ensureResendWebhook(
  client: Resend,
  endpoint: string,
): Promise<{ id: string; signingSecret: string } | null> {
  const { data, error } = await client.webhooks.create({
    endpoint,
    events: [...RESEND_WEBHOOK_EVENTS],
  })
  if (error) {
    if (error.name === "restricted_api_key" || error.name === "invalid_access") return null
    throw new ResendApiError(error.name, error.message, error.statusCode)
  }
  return { id: data.id, signingSecret: data.signing_secret }
}

/** Best effort: a stale webhook in the customer's account is harmless. */
export async function removeResendWebhook(client: Resend, webhookId: string): Promise<void> {
  try {
    await client.webhooks.remove(webhookId)
  } catch {
    /* ignore */
  }
}
