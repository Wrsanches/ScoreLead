import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"

type EncryptedTokenEnvelope = {
  v: 1
  iv: string
  tag: string
  ciphertext: string
}

function tokenKey(): Buffer {
  const raw = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY
  if (!raw) throw new Error("WHATSAPP_TOKEN_ENCRYPTION_KEY is not configured")

  const decoded = /^[a-f\d]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64")
  if (decoded.length !== 32) {
    throw new Error("WHATSAPP_TOKEN_ENCRYPTION_KEY must be 32 bytes (base64 or 64 hex characters)")
  }
  return decoded
}

export function encryptWhatsAppToken(token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  const envelope: EncryptedTokenEnvelope = {
    v: 1,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  }
  return Buffer.from(JSON.stringify(envelope)).toString("base64url")
}

export function decryptWhatsAppToken(value: string): string {
  const envelope = JSON.parse(
    Buffer.from(value, "base64url").toString("utf8"),
  ) as EncryptedTokenEnvelope
  if (envelope.v !== 1) throw new Error("Unsupported WhatsApp token encryption version")

  const decipher = createDecipheriv(
    "aes-256-gcm",
    tokenKey(),
    Buffer.from(envelope.iv, "base64url"),
  )
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

export function metaAppSecretProof(accessToken: string): string {
  const secret = process.env.META_APP_SECRET
  if (!secret) throw new Error("META_APP_SECRET is not configured")
  return createHmac("sha256", secret).update(accessToken).digest("hex")
}

export function verifyMetaWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret || !signature?.startsWith("sha256=")) return false
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  const received = signature.slice("sha256=".length)
  if (!/^[a-f\d]{64}$/i.test(received) || expected.length !== received.length) return false
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"))
}

export function isE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

export function metaPhoneToE164(value: string): string {
  return value.startsWith("+") ? value : `+${value}`
}
