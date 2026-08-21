/**
 * Keep WhatsApp available in local development and fail closed in production
 * unless the production rollout flag is explicitly enabled.
 */
export function hasWhatsAppEarlyAccess(
  _email: string | null | undefined,
  environment = process.env.NODE_ENV,
  enabled = process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED,
): boolean {
  if (environment !== "production") return true
  return enabled === "true"
}
