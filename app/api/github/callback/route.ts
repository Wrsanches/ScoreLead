import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBusinessAccess } from "@/lib/business-access"
import { GitHubError } from "@/lib/github/client"
import { exchangeGitHubCode, githubAppConfig } from "@/lib/github/app"
import { consumeGitHubState, saveGitHubAuthorization } from "@/lib/github/oauth"
import { getLocalizedAppPath } from "@/lib/site-urls"

export const maxDuration = 60
export async function GET(request: Request) {
  const config = githubAppConfig()
  const url = new URL(request.url)
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.redirect(new URL("/login?returnTo=%2Fadmin%2Fintegrations%2Fgithub", config.origin))
  let destination = new URL("/admin/integrations/github", config.origin)
  let validatedBusinessId: string | null = null
  try {
    const state = await consumeGitHubState(url.searchParams.get("state") || "", session.user.id)
    destination = new URL(getLocalizedAppPath("/admin/integrations/github", state.locale), config.origin)
    const access = await getBusinessAccess(session.user.id, state.businessId)
    if (!access || access.readOnly) throw new GitHubError("GITHUB_ACCESS_DENIED", 403)
    validatedBusinessId = state.businessId
    if (url.searchParams.has("error")) throw new GitHubError("GITHUB_AUTH_CANCELLED", 400)
    const code = url.searchParams.get("code")
    if (!code || code.length > 4096) throw new GitHubError("GITHUB_AUTH_FAILED", 400)
    const tokens = await exchangeGitHubCode(code, state.verifier)
    await saveGitHubAuthorization(session.user.id, state.businessId, tokens.token, tokens.expiresAt)
    destination.searchParams.set("github", "authorized")
  } catch (error) { destination.searchParams.set("github", error instanceof GitHubError ? error.code : "GITHUB_AUTH_FAILED") }
  const response = NextResponse.redirect(destination, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } })
  // Select only a server-validated business and use the canonical route. A
  // legacy client redirect could otherwise swallow the callback outcome.
  if (validatedBusinessId) response.cookies.set("active_business_id", validatedBusinessId, { path: "/", sameSite: "lax", secure: config.origin.startsWith("https:"), maxAge: 31536000 })
  return response
}
