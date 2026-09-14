import {
  createHash,
  createHmac,
  createSign,
  timingSafeEqual,
} from "node:crypto"
import { allowedKnowledgePath, hasSensitiveContent } from "./policy"

export class GitHubError extends Error {
  constructor(
    public status: number,
    public code = "github_unavailable",
  ) {
    super(code)
  }
}

export function githubConfigured() {
  return [
    "GITHUB_APP_ID",
    "GITHUB_APP_SLUG",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GITHUB_APP_PRIVATE_KEY",
    "GITHUB_WEBHOOK_SECRET",
    "SUPPORT_TOKEN_ENCRYPTION_KEY",
  ].every((key) => !!process.env[key])
}

export function githubCallbackUrl() {
  const origin = process.env.SCORELEAD_APP_URL || process.env.BETTER_AUTH_URL
  if (!origin) throw new GitHubError(503, "github_not_configured")
  return new URL("/api/github/callback", origin).toString()
}

export function appJwt(now = Math.floor(Date.now() / 1000)) {
  const id = process.env.GITHUB_APP_ID
  const key = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!id || !key) throw new GitHubError(503, "github_not_configured")
  const enc = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  const payload = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({ iat: now - 60, exp: now + 540, iss: id })}`
  return `${payload}.${createSign("RSA-SHA256").update(payload).sign(key, "base64url")}`
}

export async function githubRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) throw new GitHubError(400)
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  })
  if (!response.ok)
    throw new GitHubError(
      response.status,
      [401, 403, 404].includes(response.status)
        ? "github_access_required"
        : "github_unavailable",
    )
  return response.json() as Promise<T>
}

export async function installationToken(
  installationId: string,
  repositoryId: string,
) {
  if (!/^\d+$/.test(installationId) || !/^\d+$/.test(repositoryId))
    throw new GitHubError(400)
  const result = await githubRequest<{ token: string }>(
    `/app/installations/${installationId}/access_tokens`,
    appJwt(),
    {
      method: "POST",
      body: JSON.stringify({
        repository_ids: [Number(repositoryId)],
        permissions: { contents: "read" },
      }),
    },
  )
  return result.token
}

export async function exchangeCode(code: string, verifier: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      code_verifier: verifier,
      redirect_uri: githubCallbackUrl(),
    }),
  })
  const result = (await response.json()) as { access_token?: string }
  if (!response.ok || !result.access_token)
    throw new GitHubError(401, "github_access_required")
  return result.access_token
}

export async function authorizeRepository(name: string, userToken: string) {
  const repo = await githubRequest<{
    id: number
    full_name: string
    default_branch: string
  }>(`/repos/${name}`, userToken)
  const installation = await githubRequest<{
    id: number
    suspended_at: string | null
  }>(`/repos/${name}/installation`, appJwt())
  if (installation.suspended_at)
    throw new GitHubError(403, "github_access_required")
  // User-token endpoint verifies the selected installation belongs to this user/app.
  let authorized = false
  for (let page = 1; page <= 20; page++) {
    const result = await githubRequest<{ repositories: Array<{ id: number }> }>(
      `/user/installations/${installation.id}/repositories?per_page=100&page=${page}`,
      userToken,
    )
    if (result.repositories.some((item) => item.id === repo.id)) {
      authorized = true
      break
    }
    if (result.repositories.length < 100) break
  }
  if (!authorized) throw new GitHubError(403, "github_access_required")
  await installationToken(String(installation.id), String(repo.id))
  return {
    repositoryId: String(repo.id),
    repository: repo.full_name,
    branch: repo.default_branch,
    installationId: String(installation.id),
  }
}

export type RepositorySnapshot = {
  text: string
  sha: string
  paths: string[]
  skipped: number
}
export async function readRepository(input: {
  repository: string
  repositoryId: string
  installationId: string
  branch: string
  includePaths: string[]
}): Promise<RepositorySnapshot> {
  const token = await installationToken(
    input.installationId,
    input.repositoryId,
  )
  const commit = await githubRequest<{
    sha: string
    commit: { tree: { sha: string } }
  }>(
    `/repos/${input.repository}/commits/${encodeURIComponent(input.branch)}`,
    token,
  )
  const tree = await githubRequest<{
    truncated: boolean
    tree: Array<{
      path: string
      type: string
      mode: string
      sha: string
      size?: number
    }>
  }>(
    `/repos/${input.repository}/git/trees/${commit.commit.tree.sha}?recursive=1`,
    token,
  )
  if (tree.truncated) throw new GitHubError(422, "repository_too_large")
  const files = tree.tree.filter(
    (file) =>
      file.type === "blob" &&
      ["100644", "100755"].includes(file.mode) &&
      allowedKnowledgePath(file.path, input.includePaths),
  )
  if (
    files.length > 150 ||
    files.some((file) => (file.size ?? Infinity) > 150_000) ||
    files.reduce((n, file) => n + (file.size ?? 0), 0) > 3_000_000
  )
    throw new GitHubError(422, "repository_too_large")
  const parts: string[] = [],
    paths: string[] = []
  let skipped = 0
  for (let start = 0; start < files.length; start += 5) {
    const batch = await Promise.all(
      files.slice(start, start + 5).map(async (file) => {
        const blob = await githubRequest<{ content: string; encoding: string }>(
          `/repos/${input.repository}/git/blobs/${file.sha}`,
          token,
        )
        if (blob.encoding !== "base64")
          throw new GitHubError(422, "unsupported_source")
        const text = Buffer.from(blob.content, "base64").toString("utf8")
        if (text.includes("\0") || hasSensitiveContent(text)) return null
        return { path: file.path, text }
      }),
    )
    for (const file of batch) {
      if (!file) {
        skipped++
        continue
      }
      paths.push(file.path)
      parts.push(
        `SOURCE: ${file.path}\nREPOSITORY: ${input.repository}\nCOMMIT: ${commit.sha}\n\n${file.text}`,
      )
    }
  }
  if (!paths.length) throw new GitHubError(422, "no_knowledge_files")
  return {
    text: parts.join("\n\n--- END SOURCE ---\n\n"),
    sha: commit.sha,
    paths,
    skipped,
  }
}

export function verifyGitHubSignature(
  body: string,
  signature: string | null,
  secret = process.env.GITHUB_WEBHOOK_SECRET,
): boolean {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature))
    return false
  const expected = createHmac("sha256", secret).update(body).digest()
  return timingSafeEqual(expected, Buffer.from(signature.slice(7), "hex"))
}

export const hashState = (value: string) =>
  createHash("sha256").update(value).digest("hex")
