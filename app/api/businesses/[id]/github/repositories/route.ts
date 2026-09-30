import { NextResponse } from "next/server"
import { scopeGitHubRoute } from "@/lib/github/route-scope"
import { getGitHubAuthorization, listGitHubInstallations, listGitHubRepositories } from "@/lib/github/oauth"
import { GitHubError } from "@/lib/github/client"

export const maxDuration = 60
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scope = await scopeGitHubRoute(id)
  if ("error" in scope) return scope.error
  const row = await getGitHubAuthorization(scope.session.user.id, id)
  if (!row) return NextResponse.json({ code: "GITHUB_AUTH_EXPIRED" }, { status: 409 })
  const query = new URL(request.url).searchParams
  const installationId = query.get("installation"), page = Number(query.get("page") || 0)
  if ((installationId && !/^\d{1,20}$/.test(installationId)) || !Number.isInteger(page) || page < 0 || page > 10000) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 })
  try {
    const installations = await listGitHubInstallations(row)
    const selected = installationId ?? installations[0]?.id
    if (selected && !installations.some((installation) => installation.id === selected)) throw new GitHubError("GITHUB_REPOSITORY_UNAVAILABLE", 409)
    const result = selected ? await listGitHubRepositories(row, selected, page) : { repositories: [], total: 0, page: 0, pageSize: 25 }
    return NextResponse.json({ login: row.githubLogin, installations, installationId: selected ?? null, ...result }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) { return NextResponse.json({ code: error instanceof GitHubError ? error.code : "GITHUB_REQUEST_FAILED" }, { status: error instanceof GitHubError ? error.status : 502 }) }
}
