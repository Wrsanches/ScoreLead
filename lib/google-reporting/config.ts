import type { GoogleReportingProvider } from "@/lib/db/schema"
import { z } from "zod"

const adminAssignmentsSchema = z
  .array(
    z
      .object({
        userId: z
          .string()
          .min(1)
          .max(255)
          .regex(/^[A-Za-z0-9_-]+$/),
        businessId: z
          .string()
          .min(1)
          .max(255)
          .regex(/^[A-Za-z0-9_-]+$/),
      })
      .strict(),
  )
  .max(100)

// Admin delegation is opt-in per exact actor/business pair, never organization-wide.
export function reportingAdminAssignments() {
  const configured = process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS
  if (!configured || configured.length > 65536) return []
  try {
    const parsed = adminAssignmentsSchema.safeParse(JSON.parse(configured))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export const GOOGLE_REPORTING_SCOPES = {
  ga4: "https://www.googleapis.com/auth/analytics.readonly",
  search_console: "https://www.googleapis.com/auth/webmasters.readonly",
} as const

export function reportingOrigin() {
  const url = new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000")
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      ))
  )
    throw new Error("INVALID_REPORTING_ORIGIN")
  return url.origin
}

export function googleReportingConfig() {
  const dedicated = Boolean(
    process.env.GOOGLE_REPORTING_CLIENT_ID ||
    process.env.GOOGLE_REPORTING_CLIENT_SECRET,
  )
  return {
    clientId:
      (dedicated
        ? process.env.GOOGLE_REPORTING_CLIENT_ID
        : process.env.GOOGLE_CLIENT_ID) || "",
    clientSecret:
      (dedicated
        ? process.env.GOOGLE_REPORTING_CLIENT_SECRET
        : process.env.GOOGLE_CLIENT_SECRET) || "",
    redirectUri: `${reportingOrigin()}/api/google-reporting/callback`,
  }
}

export function reportingEncryptionKey() {
  const value = process.env.GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY || ""
  const key = Buffer.from(
    value,
    /^[a-f\d]{64}$/i.test(value) ? "hex" : "base64",
  )
  if (key.length !== 32) throw new Error("REPORTING_NOT_CONFIGURED")
  return key
}

export function googleReportingEnabled() {
  try {
    const config = googleReportingConfig()
    reportingEncryptionKey()
    return Boolean(config.clientId && config.clientSecret)
  } catch {
    return false
  }
}

// Limit new Google authorizations while a deployment is awaiting scope review.
// Existing users can still disconnect Google or revoke assistant grants.
export function googleReportingAvailableTo(user: {
  email: string
  emailVerified: boolean
}) {
  if (!googleReportingEnabled()) return false
  const configured = process.env.GOOGLE_REPORTING_ALLOWED_EMAILS
  if (configured === undefined) return true
  const allowed = configured
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  return user.emailVerified && allowed.includes(user.email.toLowerCase())
}

export function reportingScopes(provider: GoogleReportingProvider) {
  return ["openid", "email", GOOGLE_REPORTING_SCOPES[provider]]
}
