import { afterEach, beforeEach, expect, test } from "bun:test"
import {
  decryptReportingToken,
  encryptReportingToken,
  opaqueToken,
  pkceChallenge,
  verifyPkce,
  sameReportingOrigin,
} from "./security"
import {
  googleReportingAvailableTo,
  googleReportingEnabled,
  reportingOrigin,
  reportingAdminAssignments,
} from "./config"
const keys = [
  "GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY",
  "BETTER_AUTH_URL",
  "GOOGLE_REPORTING_CLIENT_ID",
  "GOOGLE_REPORTING_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REPORTING_ALLOWED_EMAILS",
  "GOOGLE_REPORTING_ADMIN_ASSIGNMENTS",
] as const
const env = Object.fromEntries(keys.map((k) => [k, process.env[k]]))
beforeEach(() => {
  process.env.GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY = "ab".repeat(32)
  process.env.BETTER_AUTH_URL = "https://app.example.com"
})
afterEach(() => {
  for (const key of keys)
    if (env[key] === undefined) delete process.env[key]
    else process.env[key] = env[key]
})
test("credentials use random authenticated encryption bound to business, provider and identity", () => {
  const context = "business:ga4:subject",
    a = encryptReportingToken("secret", context),
    b = encryptReportingToken("secret", context)
  expect(a).not.toBe(b)
  expect(a).not.toContain("secret")
  expect(decryptReportingToken(a, context)).toBe("secret")
  for (const scope of [
    "other:ga4:subject",
    "business:search_console:subject",
    "business:ga4:other",
  ])
    expect(() => decryptReportingToken(a, scope)).toThrow()
  expect(() => decryptReportingToken(a + ".extra", context)).toThrow()
  const parts = a.split(".")
  parts[2] = "a".repeat(parts[2].length)
  expect(() => decryptReportingToken(parts.join("."), context)).toThrow()
})
test("missing/invalid encryption key fails closed", () => {
  process.env.GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY = "short"
  expect(googleReportingEnabled()).toBe(false)
  expect(() => encryptReportingToken("x", "y")).toThrow()
})
test("preview authorization requires an exact verified email and empty allowlists deny everyone", () => {
  process.env.GOOGLE_REPORTING_CLIENT_ID = "reporting-client"
  process.env.GOOGLE_REPORTING_CLIENT_SECRET = "reporting-secret"
  const user = { email: "owner@example.com", emailVerified: true }
  delete process.env.GOOGLE_REPORTING_ALLOWED_EMAILS
  expect(googleReportingAvailableTo(user)).toBe(true)
  process.env.GOOGLE_REPORTING_ALLOWED_EMAILS =
    " OWNER@example.com,second@example.com "
  expect(googleReportingAvailableTo(user)).toBe(true)
  expect(googleReportingAvailableTo({ ...user, emailVerified: false })).toBe(
    false,
  )
  expect(
    googleReportingAvailableTo({
      ...user,
      email: "owner@example.com.evil.test",
    }),
  ).toBe(false)
  process.env.GOOGLE_REPORTING_ALLOWED_EMAILS = " , "
  expect(googleReportingAvailableTo(user)).toBe(false)
})
test("admin reporting assignments require exact pairs and malformed configuration fails closed", () => {
  const pair = { userId: "specific-admin", businessId: "specific-business" }
  process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS = JSON.stringify([pair])
  expect(reportingAdminAssignments()).toEqual([pair])
  for (const value of [
    undefined,
    "",
    "broken json",
    "{}",
    JSON.stringify([{ ...pair, userId: "*" }]),
    JSON.stringify([{ ...pair, businessId: "*" }]),
    JSON.stringify([{ ...pair, allBusinesses: true }]),
    JSON.stringify(Array(101).fill(pair)),
  ]) {
    if (value === undefined)
      delete process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS
    else process.env.GOOGLE_REPORTING_ADMIN_ASSIGNMENTS = value
    expect(reportingAdminAssignments()).toEqual([])
  }
})
test("OAuth PKCE follows RFC 7636 test vector and rejects malformed verifiers", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  expect(pkceChallenge(verifier)).toBe(
    "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  )
  expect(verifyPkce(verifier, pkceChallenge(verifier))).toBe(true)
  for (const invalid of [
    "short",
    "a".repeat(129),
    "!".repeat(43),
    opaqueToken(),
  ])
    expect(verifyPkce(invalid, pkceChallenge(verifier))).toBe(false)
})
test("dashboard mutations require canonical origin and ignore spoofed forwarded hosts", () => {
  expect(
    sameReportingOrigin(
      new Request("http://internal/", {
        headers: { origin: "https://app.example.com" },
      }),
    ),
  ).toBe(true)
  for (const origin of [
    "null",
    "https://evil.test",
    "https://app.example.com.evil.test",
  ])
    expect(
      sameReportingOrigin(
        new Request("http://internal", {
          headers: { origin, "x-forwarded-host": "app.example.com" },
        }),
      ),
    ).toBe(false)
  expect(sameReportingOrigin(new Request("http://internal"))).toBe(false)
})
test("production reporting origin requires HTTPS with no embedded credentials", () => {
  for (const value of [
    "http://app.example.com",
    "https://user:secret@example.com",
    "file:///tmp/test",
  ]) {
    process.env.BETTER_AUTH_URL = value
    expect(() => reportingOrigin()).toThrow()
  }
  process.env.BETTER_AUTH_URL = "http://127.0.0.1:3333"
  expect(reportingOrigin()).toBe("http://127.0.0.1:3333")
})
