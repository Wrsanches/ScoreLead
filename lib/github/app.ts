import { createHash, createPrivateKey, randomBytes, sign } from "node:crypto"
import { GitHubError, githubRequest } from "@/lib/github/client"
import { readLimitedBody } from "@/lib/integrations/http"
import { isGitHubConfigured } from "@/lib/github/security"

export function githubAppConfig() {
  const origin = new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000")
  if (origin.username || origin.password || (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)))) throw new GitHubError("GITHUB_APP_NOT_CONFIGURED", 503)
  const clientId = process.env.GITHUB_APP_CLIENT_ID || ""
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET || ""
  const slug = process.env.GITHUB_APP_SLUG || ""
  const privateKey = (process.env.GITHUB_APP_PRIVATE_KEY || "").replace(/\\n/g, "\n")
  if (!clientId || !clientSecret || !/^[A-Za-z0-9-]+$/.test(slug) || !privateKey || !isGitHubConfigured()) throw new GitHubError("GITHUB_APP_NOT_CONFIGURED", 503)
  const key = createPrivateKey(privateKey)
  if (key.asymmetricKeyType !== "rsa") throw new GitHubError("GITHUB_APP_NOT_CONFIGURED", 503)
  return { clientId, clientSecret, slug, privateKey, origin: origin.origin, redirectUri: `${origin.origin}/api/github/callback` }
}

export function githubAppEnabled() { try { githubAppConfig(); return true } catch { return false } }
export const githubOpaqueToken = () => randomBytes(32).toString("base64url")
export const githubStateHash = (state: string) => createHash("sha256").update(state).digest("hex")
export const githubPkceChallenge = (verifier: string) => createHash("sha256").update(verifier).digest("base64url")

export function githubAuthorizationUrl(state: string, verifier: string) {
  const config = githubAppConfig()
  const url = new URL("https://github.com/login/oauth/authorize")
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, state,
    code_challenge: githubPkceChallenge(verifier), code_challenge_method: "S256", prompt: "select_account" }).toString()
  return url.toString()
}

export function githubInstallUrl() { return `https://github.com/apps/${githubAppConfig().slug}/installations/new` }

export async function exchangeGitHubCode(code: string, verifier: string) {
  const config = githubAppConfig()
  let response: Response
  try {
    response = await fetch("https://github.com/login/oauth/access_token", { method: "POST", cache: "no-store", redirect: "error",
      headers: { Accept: "application/json", "Content-Type": "application/json" }, signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, code_verifier: verifier, redirect_uri: config.redirectUri }) })
  } catch { throw new GitHubError("GITHUB_AUTH_FAILED", 502) }
  const body = JSON.parse((await readLimitedBody(response, 16000)).toString("utf8")) as { access_token?: string; expires_in?: number; token_type?: string; error?: string }
  if (!response.ok || body.error || !body.access_token || body.token_type !== "bearer") throw new GitHubError("GITHUB_AUTH_FAILED", 400)
  // This token exists only while selecting a repository. Refresh tokens are not retained.
  return { token: body.access_token, expiresAt: new Date(Date.now() + Math.min(3600, body.expires_in ?? 3600) * 1000) }
}

export function githubAppJwt(now = Math.floor(Date.now() / 1000)) {
  const config = githubAppConfig()
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 540, iss: config.clientId })).toString("base64url")
  const data = `${header}.${payload}`
  return `${data}.${sign("RSA-SHA256", Buffer.from(data), config.privateKey).toString("base64url")}`
}

/** Ephemeral, repository-scoped token. No customer needs to copy or renew it. */
export async function githubInstallationToken(installationId: string, repositoryId: string) {
  if (!/^\d+$/.test(installationId) || !/^\d+$/.test(repositoryId)) throw new GitHubError("GITHUB_REPOSITORY_UNAVAILABLE", 409)
  const token = await githubRequest<{ token: string }>(githubAppJwt(), `/app/installations/${installationId}/access_tokens`, {
    method: "POST", body: JSON.stringify({ repository_ids: [Number(repositoryId)], permissions: { contents: "read", issues: "write", actions: "write" } }),
  })
  if (!token.token) throw new GitHubError("GITHUB_INVALID_RESPONSE", 502)
  return token.token
}
