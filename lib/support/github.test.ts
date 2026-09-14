import { afterEach, describe, expect, test } from "bun:test"
import { createHmac, generateKeyPairSync, verify } from "node:crypto"
import {
  appJwt,
  authorizeRepository,
  githubRequest,
  readRepository,
  verifyGitHubSignature,
} from "./github"
import { decryptSupportToken, encryptSupportToken } from "./security"

const originalFetch = globalThis.fetch
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 })
const originalKey = process.env.GITHUB_APP_PRIVATE_KEY,
  originalId = process.env.GITHUB_APP_ID,
  originalEncryption = process.env.SUPPORT_TOKEN_ENCRYPTION_KEY
afterEach(() => {
  globalThis.fetch = originalFetch
  for (const [name, value] of [
    ["GITHUB_APP_PRIVATE_KEY", originalKey],
    ["GITHUB_APP_ID", originalId],
    ["SUPPORT_TOKEN_ENCRYPTION_KEY", originalEncryption],
  ]) {
    if (value === undefined) delete process.env[name!]
    else process.env[name!] = value
  }
})
function credentials() {
  process.env.GITHUB_APP_ID = "123"
  process.env.GITHUB_APP_PRIVATE_KEY = keys.privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString()
}
function fetchMock(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  globalThis.fetch = handler as typeof fetch
}
const json = (value: unknown, status = 200) => Response.json(value, { status })

describe("GitHub authorization boundaries", () => {
  test("signs short-lived GitHub App JWTs", () => {
    credentials()
    const [header, payload, signature] = appJwt(1000).split(".")
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({
      iat: 940,
      exp: 1540,
      iss: "123",
    })
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(`${header}.${payload}`),
        keys.publicKey,
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(true)
  })
  test("requires repository membership in the user's installation before minting a token", async () => {
    credentials()
    let minted = false
    fetchMock((url) => {
      if (url.endsWith("/repos/customer/product"))
        return json({
          id: 5,
          full_name: "customer/product",
          default_branch: "main",
        })
      if (url.endsWith("/installation"))
        return json({ id: 9, suspended_at: null })
      if (url.includes("/user/installations/"))
        return json({ repositories: [{ id: 6 }] })
      minted = true
      return json({ token: "bad" })
    })
    await expect(
      authorizeRepository("customer/product", "user-token"),
    ).rejects.toThrow("github_access_required")
    expect(minted).toBe(false)
  })
  test("successful grants narrow installation tokens to one repository with read-only contents", async () => {
    credentials()
    fetchMock((url, init) => {
      if (url.endsWith("/repos/customer/product"))
        return json({
          id: 5,
          full_name: "customer/product",
          default_branch: "main",
        })
      if (url.endsWith("/installation"))
        return json({ id: 9, suspended_at: null })
      if (url.includes("/user/installations/"))
        return json({ repositories: [{ id: 5 }] })
      expect(JSON.parse(init!.body as string)).toEqual({
        repository_ids: [5],
        permissions: { contents: "read" },
      })
      return json({ token: "scoped" })
    })
    expect(
      (await authorizeRepository("customer/product", "user-token"))
        .repositoryId,
    ).toBe("5")
  })
  test("cannot send credentials to another origin", async () => {
    let called = false
    fetchMock(() => {
      called = true
      return json({})
    })
    await expect(
      githubRequest("https://attacker.example", "secret"),
    ).rejects.toThrow()
    await expect(
      githubRequest("//attacker.example", "secret"),
    ).rejects.toThrow()
    expect(called).toBe(false)
  })
  test("webhook signatures reject missing, malformed and modified bodies", () => {
    const body = '{"action":"deleted"}',
      secret = "test-webhook-secret"
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`
    expect(verifyGitHubSignature(body, signature, secret)).toBe(true)
    expect(verifyGitHubSignature(body + " ", signature, secret)).toBe(false)
    expect(verifyGitHubSignature(body, null, secret)).toBe(false)
    expect(verifyGitHubSignature(body, "sha256=no", secret)).toBe(false)
  })
  test("encrypted user grants cannot be moved between businesses", () => {
    process.env.SUPPORT_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 4).toString(
      "base64",
    )
    const value = encryptSupportToken("temporary-token", "business-a")
    expect(decryptSupportToken(value, "business-a")).toBe("temporary-token")
    expect(() => decryptSupportToken(value, "business-b")).toThrow()
  })
  test("indexes a single immutable commit and excludes symlinks and credential content", async () => {
    credentials()
    const visited: string[] = []
    fetchMock((url) => {
      visited.push(url)
      if (url.endsWith("/access_tokens")) return json({ token: "scoped" })
      if (url.includes("/commits/"))
        return json({ sha: "commit-1", commit: { tree: { sha: "tree-1" } } })
      if (url.includes("/git/trees/"))
        return json({
          truncated: false,
          tree: [
            {
              path: "docs/guide.md",
              mode: "100644",
              type: "blob",
              sha: "guide",
              size: 100,
            },
            {
              path: "docs/unsafe.md",
              mode: "100644",
              type: "blob",
              sha: "unsafe",
              size: 100,
            },
            {
              path: "docs/link.md",
              mode: "120000",
              type: "blob",
              sha: "link",
              size: 10,
            },
            {
              path: ".env.local",
              mode: "100644",
              type: "blob",
              sha: "env",
              size: 100,
            },
          ],
        })
      return json({
        encoding: "base64",
        content: Buffer.from(
          url.endsWith("/unsafe")
            ? 'api_key="this-is-a-sensitive-credential"'
            : "How to invite your team",
        ).toString("base64"),
      })
    })
    const snapshot = await readRepository({
      repository: "customer/product",
      repositoryId: "5",
      installationId: "9",
      branch: "main",
      includePaths: ["docs/"],
    })
    expect(snapshot.paths).toEqual(["docs/guide.md"])
    expect(snapshot.skipped).toBe(1)
    expect(snapshot.text).toContain("COMMIT: commit-1")
    expect(
      visited.some((url) => url.endsWith("/link") || url.endsWith("/env")),
    ).toBe(false)
  })
})
