import { NextResponse } from "next/server"
import { z } from "zod"
import { scopeGitHubRoute } from "@/lib/github/route-scope"
import { beginGitHubConnection } from "@/lib/github/oauth"
import { GitHubError } from "@/lib/github/client"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scope = await scopeGitHubRoute(id)
  if ("error" in scope) return scope.error
  const origin = new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").origin
  if (request.headers.get("origin") !== origin) return NextResponse.json({ code: "INVALID_ORIGIN" }, { status: 403 })
  const parsed = z.object({ locale: z.enum(["en", "pt", "es"]).default("en") }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 })
  try { return NextResponse.json({ url: await beginGitHubConnection(scope.session.user.id, id, parsed.data.locale) }, { headers: { "Cache-Control": "no-store" } }) }
  catch (error) { return NextResponse.json({ code: error instanceof GitHubError ? error.code : "GITHUB_AUTH_FAILED" }, { status: error instanceof GitHubError ? error.status : 502 }) }
}
