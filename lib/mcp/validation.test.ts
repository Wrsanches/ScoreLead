import { afterEach, expect, test } from "bun:test"
import {
  authorizationSchema,
  parseScopes,
  redirectMatches,
  registrationSchema,
  uniqueParams,
  validRedirectUri,
} from "./validation"
import { authorizationMetadata, resourceMetadata } from "./config"
const old = process.env.BETTER_AUTH_URL
afterEach(() => {
  if (old === undefined) delete process.env.BETTER_AUTH_URL
  else process.env.BETTER_AUTH_URL = old
})
test("registration allows HTTPS and explicit loopback redirects only", () => {
  for (const uri of [
    "https://client.example/callback",
    "http://127.0.0.1:1234/callback",
    "http://localhost:3456/callback",
    "http://[::1]:3456/callback",
  ])
    expect(validRedirectUri(uri)).toBe(true)
  for (const uri of [
    "http://evil.example/callback",
    "javascript:alert(1)",
    "https://u:p@example.com",
    "https://example.com/#token",
    "https://example.com/#",
    "https://*.example.com",
    "http://127.0.0.1.evil.test/",
    "file:///tmp/callback",
  ])
    expect(validRedirectUri(uri)).toBe(false)
})
test("registered redirects must match exactly, including path/query/port", () => {
  const original = "http://127.0.0.1:8765/callback"
  expect(redirectMatches(original, original)).toBe(true)
  for (const uri of [
    original + "/",
    original + "?x=1",
    "http://127.0.0.1:8766/callback",
  ])
    expect(redirectMatches(original, uri)).toBe(false)
})
test("only readonly and optional offline scope are supported", () => {
  expect(parseScopes("offline_access analytics:read analytics:read")).toBe(
    "analytics:read offline_access",
  )
  for (const v of ["", "openid", "analytics:write", "analytics:read admin"])
    expect(() => parseScopes(v)).toThrow("invalid_scope")
})
test("public client registration rejects client credentials and secret based methods", () => {
  const base = { redirect_uris: ["http://127.0.0.1:3333/cb"] }
  expect(registrationSchema.safeParse(base).success).toBe(true)
  for (const extra of [
    { token_endpoint_auth_method: "client_secret_basic" },
    { grant_types: ["client_credentials"] },
    { response_types: ["token"] },
    { redirect_uris: [] },
  ])
    expect(registrationSchema.safeParse({ ...base, ...extra }).success).toBe(
      false,
    )
})
test("authorization requires resource binding, S256 and code flow", () => {
  process.env.BETTER_AUTH_URL = "https://app.example.com"
  const base = {
    client_id: "11111111-1111-4111-8111-111111111111",
    redirect_uri: "http://127.0.0.1:9999/callback",
    response_type: "code",
    code_challenge: "a".repeat(43),
    code_challenge_method: "S256",
    resource: "https://app.example.com/api/mcp",
  }
  expect(authorizationSchema.safeParse(base).success).toBe(true)
  for (const extra of [
    { resource: "https://evil.test" },
    { resource: undefined },
    { code_challenge_method: "plain" },
    { response_type: "token" },
    { code_challenge: "bad" },
  ])
    expect(authorizationSchema.safeParse({ ...base, ...extra }).success).toBe(
      false,
    )
})
test("duplicate parameters are rejected to avoid parameter pollution", () => {
  expect(() =>
    uniqueParams(new URLSearchParams("resource=a&resource=b")),
  ).toThrow("invalid_request")
  expect(uniqueParams(new URLSearchParams("state=a%26b"))).toEqual({
    state: "a&b",
  })
})
test("discovery advertises the same canonical audience, issuer and token behavior", () => {
  process.env.BETTER_AUTH_URL = "https://app.example.com"
  expect(resourceMetadata().authorization_servers).toEqual([
    authorizationMetadata().issuer,
  ])
  expect(resourceMetadata().resource).toBe("https://app.example.com/api/mcp")
  expect(authorizationMetadata().code_challenge_methods_supported).toEqual([
    "S256",
  ])
  expect(authorizationMetadata().token_endpoint_auth_methods_supported).toEqual(
    ["none"],
  )
})
