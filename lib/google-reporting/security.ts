import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"
import { reportingOrigin } from "./config"
import { decryptIntegrationValue, encryptIntegrationValue } from "@/lib/security/token-encryption"

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
  return encryptIntegrationValue("reporting", token, context)
}
export function decryptReportingToken(value: string, context: string) {
  return decryptIntegrationValue("reporting", value, context)
}
export function sameReportingOrigin(request: Request) {
  return request.headers.get("origin") === reportingOrigin()
}
