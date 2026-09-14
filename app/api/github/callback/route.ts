import { and, eq, gt } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canManageBusiness } from "@/lib/business-access"
import { db } from "@/lib/db"
import { supportAssistant, supportGithubState } from "@/lib/db/schema"
import { getSupportSettings } from "@/lib/support/data"
import {
  exchangeCode,
  githubCallbackUrl,
  githubRequest,
  hashState,
} from "@/lib/support/github"
import { encryptSupportToken } from "@/lib/support/security"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session)
    return NextResponse.json({ code: "unauthorized" }, { status: 401 })
  const params = new URL(request.url).searchParams,
    state = params.get("state"),
    code = params.get("code")
  if (!state || state.length > 200)
    return NextResponse.json({ code: "invalid_state" }, { status: 400 })
  const [nonce] = await db
    .delete(supportGithubState)
    .where(
      and(
        eq(supportGithubState.id, hashState(state)),
        eq(supportGithubState.userId, session.user.id),
        gt(supportGithubState.expiresAt, new Date()),
      ),
    )
    .returning()
  if (!nonce || !(await canManageBusiness(session.user.id, nonce.businessId)))
    return NextResponse.json({ code: "invalid_state" }, { status: 400 })
  const url = new URL(
    `${nonce.locale === "en" ? "" : `/${nonce.locale}`}/admin/business/${encodeURIComponent(nonce.businessId)}/integrations`,
    githubCallbackUrl(),
  )
  try {
    if (!code || params.has("error")) throw new Error("cancelled")
    const token = await exchangeCode(code, nonce.verifier)
    const user = await githubRequest<{ id: number }>("/user", token)
    await getSupportSettings(nonce.businessId)
    await db
      .update(supportAssistant)
      .set({
        grantToken: encryptSupportToken(token, nonce.businessId),
        grantUserId: session.user.id,
        grantGithubUserId: String(user.id),
        grantExpiresAt: new Date(Date.now() + 10 * 60_000),
      })
      .where(eq(supportAssistant.businessId, nonce.businessId))
    url.searchParams.set("support", "authorized")
  } catch {
    url.searchParams.set("support", "github_error")
  }
  url.hash = "support-assistant"
  return NextResponse.redirect(url)
}
