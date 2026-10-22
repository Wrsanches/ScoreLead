import { expect, test } from "bun:test"
import { createCipheriv } from "node:crypto"
import { decryptIntegrationValue, encryptIntegrationValue, integrationKeyring, type IntegrationPurpose } from "./token-encryption"

const old = "11".repeat(32), fresh = "22".repeat(32)
const purposes: IntegrationPurpose[] = ["reporting", "instagram", "resend", "whatsapp", "github"]
const variables = {
  GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY: old, INSTAGRAM_TOKEN_ENCRYPTION_KEY: old,
  RESEND_TOKEN_ENCRYPTION_KEY: old, WHATSAPP_TOKEN_ENCRYPTION_KEY: old, GITHUB_TOKEN_ENCRYPTION_KEY: old,
}

// Historical envelope encoder, independent of the new implementation.
function historical(purpose: IntegrationPurpose, context: string) {
  const iv = Buffer.alloc(12, 7)
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(old, "hex"), iv)
  if (purpose !== "whatsapp") cipher.setAAD(Buffer.from(purpose === "github" ? `github:${context}` : context))
  const data = Buffer.concat([cipher.update("saved-customer-token"), cipher.final()]).toString("base64url")
  const tag = cipher.getAuthTag().toString("base64url")
  return purpose === "whatsapp"
    ? Buffer.from(JSON.stringify({ v: 1, iv: iv.toString("base64url"), tag, ciphertext: data })).toString("base64url")
    : `v1.${iv.toString("base64url")}.${tag}.${data}`
}

test("all historical formats decrypt through previous keys and fail after old-key removal", () => {
  for (const purpose of purposes) {
    const original = integrationKeyring(purpose, variables)
    const current = integrationKeyring(purpose, Object.fromEntries(Object.keys(variables).map((name) => [name, fresh])))
    const dual = { current: current.current, previous: [original.current] }
    const legacy = historical(purpose, "tenant")
    expect(decryptIntegrationValue(purpose, legacy, "tenant", dual)).toBe("saved-customer-token")
    expect(() => decryptIntegrationValue(purpose, legacy, "tenant", current)).toThrow()
    const migrated = encryptIntegrationValue(purpose, "saved-customer-token", "tenant", { version: 2, keyring: dual })
    expect(decryptIntegrationValue(purpose, migrated, "tenant", current)).toBe("saved-customer-token")
    expect(() => decryptIntegrationValue(purpose, migrated, "other-tenant", current)).toThrow()
    expect(migrated).not.toContain("saved-customer-token")
  }
})

test("v2 authenticates provider, key identifier, ciphertext and tenant even with a shared raw key", () => {
  const ring = integrationKeyring("resend", variables)
  const value = encryptIntegrationValue("resend", "token", "tenant", { version: 2, keyring: ring })
  expect(() => decryptIntegrationValue("instagram", value, "tenant", ring)).toThrow()
  for (const index of [1, 2, 3, 4]) {
    const parts = value.split(".")
    parts[index] = (parts[index][0] === "a" ? "b" : "a") + parts[index].slice(1)
    expect(() => decryptIntegrationValue("resend", parts.join("."), "tenant", ring)).toThrow()
  }
  for (const malformed of ["v2.a.b.c.d", value + ".extra", value.replace("v2.", "v3."), "v1....", "a".repeat(1024 * 1024 + 1)])
    expect(() => decryptIntegrationValue("resend", malformed, "tenant", ring)).toThrow()
})

test("GitHub fallback inherits WhatsApp previous keys; explicit GitHub keys stay separate", () => {
  const env = { WHATSAPP_TOKEN_ENCRYPTION_KEY: fresh, WHATSAPP_TOKEN_ENCRYPTION_PREVIOUS_KEYS: old }
  expect(integrationKeyring("github", env).previous).toHaveLength(1)
  const explicit = integrationKeyring("github", { ...env, GITHUB_TOKEN_ENCRYPTION_KEY: fresh })
  expect(explicit.previous).toHaveLength(0)
  expect(() => integrationKeyring("github", { ...env, GITHUB_TOKEN_ENCRYPTION_PREVIOUS_KEYS: old })).toThrow("DUPLICATE")
})

test("configuration rejects malformed, duplicate and excessive previous keys without exposing them", () => {
  for (const key of ["short", "zz".repeat(32), "A".repeat(43) + "==", "A".repeat(42) + "B"]) {
    expect(() => integrationKeyring("resend", { RESEND_TOKEN_ENCRYPTION_KEY: key })).toThrow("INVALID_INTEGRATION_KEY")
  }
  expect(() => integrationKeyring("resend", { RESEND_TOKEN_ENCRYPTION_KEY: old, RESEND_TOKEN_ENCRYPTION_PREVIOUS_KEYS: old })).toThrow("DUPLICATE")
  expect(() => integrationKeyring("resend", { RESEND_TOKEN_ENCRYPTION_KEY: old, RESEND_TOKEN_ENCRYPTION_PREVIOUS_KEYS: Array(6).fill(fresh).join(",") })).toThrow("TOO_MANY")
})
