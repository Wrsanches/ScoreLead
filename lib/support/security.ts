import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

function encryptionKey() {
  const key = Buffer.from(
    process.env.SUPPORT_TOKEN_ENCRYPTION_KEY || "",
    "base64",
  )
  if (key.length !== 32)
    throw new Error("Support token encryption is not configured")
  return key
}
export function encryptSupportToken(value: string, businessId: string): string {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  cipher.setAAD(Buffer.from(businessId))
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), data]
    .map((part) => part.toString("base64url"))
    .join(".")
}
export function decryptSupportToken(value: string, businessId: string): string {
  const [iv, tag, data] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64url"))
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv)
  cipher.setAAD(Buffer.from(businessId))
  cipher.setAuthTag(tag)
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8")
}
