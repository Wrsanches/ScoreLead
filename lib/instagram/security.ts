import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"

function key() {
  const raw = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY || ""
  const decoded = Buffer.from(
    raw,
    /^[a-f\d]{64}$/i.test(raw) ? "hex" : "base64",
  )
  if (decoded.length !== 32) throw new Error("INSTAGRAM_NOT_CONFIGURED")
  return decoded
}
export function encryptInstagramToken(token: string, businessId: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  cipher.setAAD(Buffer.from(businessId))
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ])
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".")
}
export function decryptInstagramToken(value: string, businessId: string) {
  const [version, iv, tag, data] = value.split(".")
  if (version !== "v1" || !iv || !tag || !data)
    throw new Error("INSTAGRAM_TOKEN_INVALID")
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64url"),
  )
  decipher.setAAD(Buffer.from(businessId))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8")
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
