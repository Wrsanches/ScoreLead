/**
 * Keep the Resend integration available in local development and fail closed
 * in production unless the rollout flag is explicitly enabled. Mirrors the
 * WhatsApp flag so both providers roll out the same way.
 */
export function isResendIntegrationEnabled(
  environment = process.env.NODE_ENV,
  enabled = process.env.NEXT_PUBLIC_RESEND_INTEGRATION_ENABLED,
): boolean {
  if (environment !== "production") return true
  return enabled === "true"
}
