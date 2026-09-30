import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

function key(): Buffer {
  // Existing installations can reuse their integration encryption key. A
  // dedicated GitHub key takes precedence and must remain stable after setup.
  const raw = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY || ""
  const decoded = Buffer.from(raw, /^[a-f\d]{64}$/i.test(raw) ? "hex" : "base64")
  if (decoded.length !== 32) throw new Error("GITHUB_NOT_CONFIGURED")
  return decoded
}

export function isGitHubConfigured(): boolean {
  try { key(); return true } catch { return false }
}

export function encryptGitHubToken(token: string, businessId: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  cipher.setAAD(Buffer.from(`github:${businessId}`))
  const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".")
}

export function decryptGitHubToken(value: string, businessId: string): string {
  const [version, iv, tag, data, extra] = value.split(".")
  if (version !== "v1" || !iv || !tag || !data || extra !== undefined) throw new Error("GITHUB_TOKEN_INVALID")
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"))
  decipher.setAAD(Buffer.from(`github:${businessId}`))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8")
}
