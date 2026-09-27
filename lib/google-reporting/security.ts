import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"
import { reportingEncryptionKey, reportingOrigin } from "./config"

export const opaqueToken = () => randomBytes(32).toString("base64url")
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")
export const pkceChallenge = (verifier: string) =>
  createHash("sha256").update(verifier).digest("base64url")
export function verifyPkce(verifier: string, challenge: string) {
  if (
    !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) ||
    !/^[A-Za-z0-9_-]{43}$/.test(challenge)
  )
    return false
  return timingSafeEqual(
    Buffer.from(pkceChallenge(verifier)),
    Buffer.from(challenge),
  )
}
export function encryptReportingToken(token: string, context: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", reportingEncryptionKey(), iv)
  cipher.setAAD(Buffer.from(context))
  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ])
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".")
}
export function decryptReportingToken(value: string, context: string) {
  const [version, iv, tag, ciphertext, extra] = value.split(".")
  if (version !== "v1" || !iv || !tag || !ciphertext || extra)
    throw new Error("INVALID_REPORTING_TOKEN")
  const decipher = createDecipheriv(
    "aes-256-gcm",
    reportingEncryptionKey(),
    Buffer.from(iv, "base64url"),
  )
  decipher.setAAD(Buffer.from(context))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}
export function sameReportingOrigin(request: Request) {
  return request.headers.get("origin") === reportingOrigin()
}
