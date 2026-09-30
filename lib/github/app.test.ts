import { afterEach, expect, test } from "bun:test"
import { generateKeyPairSync, verify } from "node:crypto"
import { githubAppJwt, githubAuthorizationUrl, githubInstallationToken, githubPkceChallenge } from "@/lib/github/app"

const variables = ["GITHUB_APP_CLIENT_ID", "GITHUB_APP_CLIENT_SECRET", "GITHUB_APP_SLUG", "GITHUB_APP_PRIVATE_KEY", "BETTER_AUTH_URL", "GITHUB_TOKEN_ENCRYPTION_KEY"] as const
const saved = Object.fromEntries(variables.map((name) => [name, process.env[name]]))
const originalFetch = globalThis.fetch
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 })
function configure() {
  process.env.GITHUB_APP_CLIENT_ID = "test-client"
  process.env.GITHUB_APP_CLIENT_SECRET = "test-secret"
  process.env.GITHUB_APP_SLUG = "scorelead-test"
  process.env.GITHUB_APP_PRIVATE_KEY = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString()
  process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "ab".repeat(32)
  process.env.BETTER_AUTH_URL = "https://app.example.test"
}
afterEach(() => { for (const name of variables) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] }; globalThis.fetch = originalFetch })

test("GitHub login uses PKCE and a fixed callback without broad OAuth scopes", () => {
  configure()
  const url = new URL(githubAuthorizationUrl("state-test", "verifier-test"))
  expect(url.origin).toBe("https://github.com")
  expect(url.searchParams.get("redirect_uri")).toBe("https://app.example.test/api/github/callback")
  expect(url.searchParams.get("code_challenge")).toBe(githubPkceChallenge("verifier-test"))
  expect(url.searchParams.get("code_challenge_method")).toBe("S256")
  expect(url.searchParams.has("scope")).toBe(false)
  expect(url.toString()).not.toContain("test-secret")
})

test("GitHub App JWT is signed with RS256 and expires within ten minutes", () => {
  configure()
  const [header, payload, signature] = githubAppJwt(1000).split(".")
  expect(JSON.parse(Buffer.from(header, "base64url").toString()).alg).toBe("RS256")
  expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({ iat: 940, exp: 1540, iss: "test-client" })
  expect(verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), keys.publicKey, Buffer.from(signature, "base64url"))).toBe(true)
})

test("automatic installation tokens are limited to the chosen repository and required permissions", async () => {
  configure()
  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    expect(String(url)).toBe("https://api.github.com/app/installations/42/access_tokens")
    expect(JSON.parse(init!.body as string)).toEqual({ repository_ids: [123], permissions: { contents: "read", issues: "write", actions: "write" } })
    return Response.json({ token: "test-installation-token" })
  }) as unknown as typeof fetch
  expect(await githubInstallationToken("42", "123")).toBe("test-installation-token")
  await expect(githubInstallationToken("42/evil", "123")).rejects.toThrow("GITHUB_REPOSITORY_UNAVAILABLE")
})
