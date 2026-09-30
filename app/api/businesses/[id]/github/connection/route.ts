import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { githubAuthorization, githubConnection, githubOAuthState } from "@/lib/db/schema"
import { GitHubError, githubRequest, loadGitHubContext, repositoryPath } from "@/lib/github/client"
import { githubSettingsSchema, parseGitHubRepository } from "@/lib/github/contracts"
import { getGitHubConnection, githubToken, publicGitHubConnection } from "@/lib/github/data"
import { encryptGitHubToken, isGitHubConfigured } from "@/lib/github/security"
import { scopeGitHubRoute } from "@/lib/github/route-scope"
import { githubAppEnabled, githubInstallUrl, githubInstallationToken } from "@/lib/github/app"
import { getGitHubAuthorization, verifyGitHubSelection } from "@/lib/github/oauth"

export const maxDuration = 60

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scope = await scopeGitHubRoute(id, "view")
  if ("error" in scope) return scope.error
  const authorization = await getGitHubAuthorization(scope.session.user.id, id)
  const appEnabled = githubAppEnabled()
  return NextResponse.json({ enabled: isGitHubConfigured(), appEnabled, installUrl: appEnabled ? githubInstallUrl() : null,
    authorization: authorization ? { login: authorization.githubLogin } : null,
    connection: publicGitHubConnection(await getGitHubConnection(id)) }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scope = await scopeGitHubRoute(id)
  if ("error" in scope) return scope.error
  if (!isGitHubConfigured()) return NextResponse.json({ code: "GITHUB_NOT_CONFIGURED" }, { status: 503 })
  const parsed = githubSettingsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 })
  const input = parsed.data
  const repo = parseGitHubRepository(input.repository)!
  const existing = await getGitHubConnection(id)
  if (!input.token && !existing && !input.appSelection) return NextResponse.json({ code: "GITHUB_TOKEN_REQUIRED" }, { status: 400 })
  try {
    let authType = existing?.authType ?? "token"
    let installationId = existing?.installationId ?? null, repositoryId = existing?.repositoryId ?? null, githubLogin = existing?.githubLogin ?? null
    let token: string
    if (input.appSelection) {
      if (input.token) throw new GitHubError("INVALID_INPUT", 400)
      const authorization = await getGitHubAuthorization(scope.session.user.id, id)
      if (!authorization) throw new GitHubError("GITHUB_AUTH_EXPIRED", 409)
      const selected = await verifyGitHubSelection(authorization, input.appSelection.installationId, input.appSelection.repositoryId)
      if (selected.fullName.toLowerCase() !== `${repo.owner}/${repo.repository}`.toLowerCase()) throw new GitHubError("GITHUB_REPOSITORY_UNAVAILABLE", 409)
      token = await githubInstallationToken(input.appSelection.installationId, input.appSelection.repositoryId)
      authType = "github_app"; installationId = input.appSelection.installationId; repositoryId = input.appSelection.repositoryId; githubLogin = authorization.githubLogin
    } else if (input.token) {
      token = input.token; authType = "token"; installationId = null; repositoryId = null; githubLogin = null
    } else {
      if (existing!.authType === "github_app" && `${existing!.owner}/${existing!.repository}`.toLowerCase() !== `${repo.owner}/${repo.repository}`.toLowerCase()) throw new GitHubError("GITHUB_REPOSITORY_UNAVAILABLE", 409)
      token = await githubToken(existing!)
    }
    let contextPaths = input.contextPaths
    if (input.appSelection && input.autoContext) {
      try {
        const readme = await githubRequest<{ path: string }>(token, `${repositoryPath(repo.owner, repo.repository)}/readme`)
        contextPaths = githubSettingsSchema.shape.contextPaths.safeParse([readme.path]).success ? [readme.path] : []
      } catch (error) { if (!(error instanceof GitHubError && error.code === "GITHUB_NOT_FOUND")) throw error; contextPaths = [] }
    }
    const context = await loadGitHubContext(token, repo.owner, repo.repository, contextPaths)
    if (input.codexWorkflow) {
      const workflow = await githubRequest<{ state: string }>(token, `${repositoryPath(repo.owner, repo.repository)}/actions/workflows/${encodeURIComponent(input.codexWorkflow)}`)
      if (workflow.state !== "active") return NextResponse.json({ code: "GITHUB_WORKFLOW_INACTIVE" }, { status: 400 })
    }
    const now = new Date()
    const values = {
      owner: context.owner, repository: context.repository, defaultBranch: context.defaultBranch, encryptedToken: authType === "token" ? encryptGitHubToken(token, id) : "",
      authType, installationId, repositoryId, githubLogin,
      contextPaths, contextFiles: context.files, projectNotes: input.projectNotes,
      codexWorkflow: input.codexWorkflow, contextSyncedAt: now, updatedAt: now,
    }
    const [connection] = await db.insert(githubConnection).values({ id: randomUUID(), businessId: id, ...values })
      .onConflictDoUpdate({ target: githubConnection.businessId, set: values }).returning()
    if (input.appSelection) await db.delete(githubAuthorization).where(and(eq(githubAuthorization.businessId, id), eq(githubAuthorization.userId, scope.session.user.id)))
    return NextResponse.json({ connection: publicGitHubConnection(connection) })
  } catch (error) {
    return NextResponse.json({ code: error instanceof GitHubError ? error.code : "GITHUB_REQUEST_FAILED" }, { status: error instanceof GitHubError && error.status < 500 ? 400 : 502 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scope = await scopeGitHubRoute(id)
  if ("error" in scope) return scope.error
  await db.delete(githubConnection).where(eq(githubConnection.businessId, id))
  await db.delete(githubAuthorization).where(eq(githubAuthorization.businessId, id))
  await db.delete(githubOAuthState).where(eq(githubOAuthState.businessId, id))
  return NextResponse.json({ ok: true })
}
