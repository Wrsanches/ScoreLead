import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"

/**
 * Per-business secrets for the Resend integration (customer API keys and
 * webhook signing secrets). AES-256-GCM with the business id bound as AAD, so
 * a ciphertext copied onto another tenant's row will not decrypt. Same shape
 * as lib/instagram/security.ts, with its own key so each provider's blast
 * radius stays separate.
 */
function key() {
  const raw = process.env.RESEND_TOKEN_ENCRYPTION_KEY || ""
  const decoded = Buffer.from(raw, /^[a-f\d]{64}$/i.test(raw) ? "hex" : "base64")
  if (decoded.length !== 32) throw new Error("RESEND_INTEGRATION_NOT_CONFIGURED")
  return decoded
}

export function isResendEncryptionConfigured(): boolean {
  try {
    key()
    return true
  } catch {
    return false
  }
}

export function encryptResendSecret(value: string, businessId: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  cipher.setAAD(Buffer.from(businessId))
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".")
}

export function decryptResendSecret(value: string, businessId: string): string {
  const [version, iv, tag, data] = value.split(".")
  if (version !== "v1" || !iv || !tag || !data) throw new Error("RESEND_SECRET_INVALID")
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"))
  decipher.setAAD(Buffer.from(businessId))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

/**
 * Unsubscribe links carry the message id plus an HMAC so the public route can
 * trust the id without a database lookup for forged values.
 */
export function unsubscribeToken(messageId: string): string {
  const mac = createHmac("sha256", key()).update(messageId).digest("base64url")
  return `${Buffer.from(messageId).toString("base64url")}.${mac}`
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
