import {
  createHmac,
  timingSafeEqual,
} from "node:crypto"
import { decryptIntegrationValue, encryptIntegrationValue } from "@/lib/security/token-encryption"

export function encryptWhatsAppToken(token: string): string {
  return encryptIntegrationValue("whatsapp", token)
}

export function decryptWhatsAppToken(value: string): string {
  return decryptIntegrationValue("whatsapp", value)
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
