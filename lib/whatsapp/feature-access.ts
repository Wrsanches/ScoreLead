export const WHATSAPP_REVIEWER_EMAIL = "meta-review@scorelead.io"

/**
 * Keep the WhatsApp rollout open during local development, but fail closed in
 * production unless the signed-in account is the isolated Meta reviewer.
 *
 * This is intentionally a temporary, explicit allowlist. Replace it with a
 * persisted business feature flag before opening the integration to customers.
 */
export function hasWhatsAppEarlyAccess(
  email: string | null | undefined,
  environment = process.env.NODE_ENV,
): boolean {
  if (environment !== "production") return true
  return email?.trim().toLowerCase() === WHATSAPP_REVIEWER_EMAIL
}

