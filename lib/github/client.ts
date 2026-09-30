import type { GitHubContextFile, SupportTaskProposal } from "@/lib/db/schema"
import { readLimitedBody } from "@/lib/integrations/http"

export class GitHubError extends Error {
  constructor(public code: string, public status: number, public uncertain = false) { super(code) }
}

export async function githubRequest<T>(token: string, path: string, init: RequestInit = {}, maxBytes = 1_500_000): Promise<T> {
  const url = new URL(path, "https://api.github.com")
  if (url.origin !== "https://api.github.com") throw new GitHubError("INVALID_GITHUB_URL", 400)
  let response: Response
  try {
    response = await fetch(url, {
      ...init, cache: "no-store", redirect: "error",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2026-03-10",
        "User-Agent": "ScoreLead",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    })
  } catch { throw new GitHubError("GITHUB_UNREACHABLE", 502, init.method === "POST") }
  if (!response.ok) {
    await response.body?.cancel()
    const code = response.status === 401 ? "GITHUB_TOKEN_INVALID" : response.status === 403 ? "GITHUB_PERMISSION_DENIED" : response.status === 404 ? "GITHUB_NOT_FOUND" : "GITHUB_REQUEST_FAILED"
    throw new GitHubError(code, response.status, init.method === "POST" && response.status >= 500)
  }
  if (response.status === 204) return null as T
  try {
    return JSON.parse((await readLimitedBody(response, maxBytes)).toString("utf8")) as T
  } catch { throw new GitHubError("GITHUB_INVALID_RESPONSE", 502, init.method === "POST") }
}

export function repositoryPath(owner: string, repository: string): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`
}

export async function loadGitHubContext(token: string, owner: string, repository: string, paths: string[]) {
  const root = repositoryPath(owner, repository)
  const metadata = await githubRequest<{ default_branch: string; full_name: string; has_issues: boolean }>(token, root)
  // Contents (read) is checked even for repositories with a public README.
  const results = await Promise.all(paths.map(async (path): Promise<GitHubContextFile> => {
    const file = await githubRequest<{ type: string; size: number; encoding: string; content: string; sha: string }>(token,
      `${root}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(metadata.default_branch)}`)
    if (file.type !== "file" || file.encoding !== "base64" || file.size > 100_000) throw new GitHubError("GITHUB_DOCUMENT_TOO_LARGE", 400)
    const bytes = Buffer.from(file.content, "base64")
    if (bytes.length > 100_000) throw new GitHubError("GITHUB_DOCUMENT_TOO_LARGE", 400)
    return { path, sha: file.sha, text: bytes.toString("utf8") }
  }))
  if (results.reduce((sum, file) => sum + Buffer.byteLength(file.text, "utf8"), 0) > 120_000) throw new GitHubError("GITHUB_CONTEXT_TOO_LARGE", 400)
  const [canonicalOwner, canonicalRepository] = metadata.full_name.split("/")
  return { owner: canonicalOwner, repository: canonicalRepository, defaultBranch: metadata.default_branch, files: results, hasIssues: metadata.has_issues }
}

export function issueMarker(taskId: string): string { return `<!-- scorelead-task:${taskId} -->` }

export function buildTaskIssue(taskId: string, proposal: SupportTaskProposal): string {
  // Only the reviewed task is exported. Phone numbers and raw conversations
  // are intentionally absent from the issue body.
  return `${issueMarker(taskId)}\n\n${proposal.description}\n\n### Acceptance criteria\n${proposal.acceptanceCriteria.map((item) => `- [ ] ${item}`).join("\n")}\n\n### Context\n${proposal.rationale}\n\nPriority: ${proposal.priority}\n\nApproved in ScoreLead. Customer reply and implementation review remain separate.`
}

export async function findTaskIssue(token: string, owner: string, repository: string, taskId: string) {
  const root = repositoryPath(owner, repository)
  // Search is used only for recovery after an uncertain create; the normal
  // path is protected by an atomic DB claim. Search indexing can lag.
  const query = encodeURIComponent(`repo:${owner}/${repository} is:issue in:body "scorelead-task:${taskId}"`)
  const result = await githubRequest<{ items: { number: number; html_url: string; body?: string }[] }>(token, `/search/issues?q=${query}&per_page=10`)
  const found = result.items.find((item) => item.body?.includes(issueMarker(taskId)))
  if (!found) return null
  // Verify the hit against the repository's issue endpoint.
  return githubRequest<{ number: number; html_url: string }>(token, `${root}/issues/${found.number}`)
}
