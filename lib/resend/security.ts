import {
  createHmac,
  timingSafeEqual,
} from "node:crypto"
import { decryptIntegrationValue, encryptIntegrationValue, integrationKeyring } from "@/lib/security/token-encryption"

/**
 * Per-business secrets for the Resend integration (customer API keys and
 * webhook signing secrets). AES-256-GCM with the business id bound as AAD, so
 * a ciphertext copied onto another tenant's row will not decrypt. Same shape
 * as lib/instagram/security.ts, with its own key so each provider's blast
 * radius stays separate.
 */
function key() {
  return integrationKeyring("resend").current.bytes
}

export function isResendEncryptionConfigured(): boolean {
  try { integrationKeyring("resend"); return true } catch { return false }
}

export function encryptResendSecret(value: string, businessId: string): string {
  return encryptIntegrationValue("resend", value, businessId)
}

export function decryptResendSecret(value: string, businessId: string): string {
  return decryptIntegrationValue("resend", value, businessId)
}

/**
 * Unsubscribe links carry the message id plus an HMAC so the public route can
 * trust the id without a database lookup for forged values.
 */
export function unsubscribeToken(messageId: string): string {
  const mac = createHmac("sha256", key()).update(messageId).digest("base64url")
  return `${Buffer.from(messageId).toString("base64url")}.${mac}`
}

/** Parse the lookup id without trusting the bearer token yet. */
export function unsubscribeMessageId(token: string): string | null {
  const match = /^([A-Za-z0-9_-]{1,342})\.([A-Za-z0-9_-]{43})$/.exec(token)
  if (!match) return null
  const id = Buffer.from(match[1], "base64url")
  const mac = Buffer.from(match[2], "base64url")
  if (id.toString("base64url") !== match[1] || mac.length !== 32 || mac.toString("base64url") !== match[2]) return null
  const value = id.toString("utf8")
  return /^[A-Za-z0-9_-]{1,255}$/.test(value) ? value : null
}

type EmailSnapshot = { id: string; html: string; text: string | null }

function storedTokens(message: EmailSnapshot) {
  // renderEmailTemplate guarantees this exact URL is in the saved email body.
  // It is a random-looking bearer capability, already persisted before sending.
  const tokens = new Set<string>()
  for (const body of [message.html, message.text || ""]) {
    for (const match of body.matchAll(/\/u\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43})(?=$|[\s"'<>])/g)) {
      if (unsubscribeMessageId(match[1]) === message.id) tokens.add(match[1])
    }
  }
  return [...tokens]
}

/** Existing delivered links survive key retirement without retaining a compromised key. */
export function matchesStoredUnsubscribeToken(token: string, message: EmailSnapshot): boolean {
  if (unsubscribeMessageId(token) !== message.id) return false
  const actual = Buffer.from(token)
  return storedTokens(message).some((stored) => {
    const expected = Buffer.from(stored)
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  })
}

export function hasStoredUnsubscribeLink(message: EmailSnapshot): boolean {
  return storedTokens(message).length > 0
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [encodedId, mac, extra] = token.split(".")
  if (!encodedId || !mac || extra !== undefined) return null
  let messageId: string
  try {
    messageId = Buffer.from(encodedId, "base64url").toString("utf8")
  } catch {
    return null
  }
  if (!messageId) return null
  const expected = createHmac("sha256", key()).update(messageId).digest()
  let actual: Buffer
  try {
    actual = Buffer.from(mac, "base64url")
  } catch {
    return null
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
  return messageId
}
