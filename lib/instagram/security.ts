import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto"
import { decryptIntegrationValue, encryptIntegrationValue } from "@/lib/security/token-encryption"

export function encryptInstagramToken(token: string, businessId: string) {
  return encryptIntegrationValue("instagram", token, businessId)
}
export function decryptInstagramToken(value: string, businessId: string) {
  return decryptIntegrationValue("instagram", value, businessId)
}
export function stateHash(state: string) {
  return createHash("sha256").update(state).digest("hex")
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return false
  // Railway may terminate TLS before forwarding to Next. Trust the configured
  // public callback origin, never an arbitrary forwarded host header.
  const callback = process.env.INSTAGRAM_REDIRECT_URI
  if (callback) {
    try {
      if (origin === new URL(callback).origin) return true
    } catch {
      /* Invalid configuration fails below. */
    }
  }
  return origin === new URL(request.url).origin
}

/** Meta deauthorization / data-deletion callbacks, never trust unsigned IDs. */
export function signedInstagramUser(
  signed: string,
  secret: string,
): string | null {
  try {
    const [signature, payload, extra] = signed.split(".")
    if (!signature || !payload || extra) return null
    const actual = Buffer.from(signature, "base64url")
    const expected = createHmac("sha256", secret).update(payload).digest()
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    if (data.algorithm !== "HMAC-SHA256" || !/^\d+$/.test(String(data.user_id)))
      return null
    return String(data.user_id)
  } catch {
    return null
  }
}
