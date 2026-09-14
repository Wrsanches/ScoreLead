import { randomBytes } from "node:crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supportAssistant, supportGithubState } from "@/lib/db/schema"
import {
  getSupportSettings,
  retireArtifacts,
  scopeSupport,
} from "@/lib/support/data"
import {
  authorizeRepository,
  githubCallbackUrl,
  githubConfigured,
  GitHubError,
  hashState,
} from "@/lib/support/github"
import { repositoryName } from "@/lib/support/policy"
import { decryptSupportToken } from "@/lib/support/security"

type Context = { params: Promise<{ id: string }> }
export async function POST(request: Request, context: Context) {
  const { id } = await context.params,
    scope = await scopeSupport(id, true, request)
  if (scope.error) return scope.error
  if (!githubConfigured())
    return NextResponse.json({ code: "github_not_configured" }, { status: 503 })
  const body = await request.json().catch(() => ({})),
    locale = ["en", "pt", "es"].includes(body?.locale) ? body?.locale : "en"
  const state = randomBytes(32).toString("base64url"),
    verifier = randomBytes(32).toString("base64url")
  await db
    .insert(supportGithubState)
    .values({
      id: hashState(state),
      businessId: id,
      userId: scope.session.user.id,
      verifier,
      locale,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    })
  const url = new URL("https://github.com/login/oauth/authorize")
  url.search = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: githubCallbackUrl(),
    state,
    code_challenge: Buffer.from(hashState(verifier), "hex").toString(
      "base64url",
    ),
    code_challenge_method: "S256",
  }).toString()
  return NextResponse.json({ url: url.toString() })
}
export async function PUT(request: Request, context: Context) {
  const { id } = await context.params,
    scope = await scopeSupport(id, true, request)
  if (scope.error) return scope.error
  const body = await request.json().catch(() => ({})),
    name = repositoryName.safeParse(body?.repository)
  if (!name.success)
    return NextResponse.json({ code: "invalid_repository" }, { status: 400 })
  const row = await getSupportSettings(id)
  if (
    !row.grantToken ||
    row.grantUserId !== scope.session.user.id ||
    !row.grantExpiresAt ||
    row.grantExpiresAt <= new Date()
  )
    return NextResponse.json(
      { code: "github_access_required" },
      { status: 401 },
    )
  try {
    const repository = await authorizeRepository(
      name.data,
      decryptSupportToken(row.grantToken, id),
    )
    const saved = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(supportAssistant)
        .where(eq(supportAssistant.businessId, id))
        .for("update")
      if (
        current.version !== row.version ||
        current.grantToken !== row.grantToken
      )
        return false
      await retireArtifacts(tx, current)
      await tx
        .update(supportAssistant)
        .set({
          ...repository,
          enabled: false,
          version: row.version + 1,
          githubUserId: row.grantGithubUserId,
          grantToken: null,
          grantUserId: null,
          grantGithubUserId: null,
          grantExpiresAt: null,
          vectorStoreId: null,
          fileId: null,
          snapshotSha: null,
          snapshotPaths: [],
          lastSyncedAt: null,
          status: "queued",
          previewedVersion: null,
          syncRequestedAt: new Date(),
          syncToken: null,
          errorCode: null,
          updatedAt: new Date(),
        })
        .where(eq(supportAssistant.businessId, id))
      return true
    })
    return saved
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ code: "settings_changed" }, { status: 409 })
  } catch (error) {
    return NextResponse.json(
      {
        code: error instanceof GitHubError ? error.code : "github_unavailable",
      },
      { status: 422 },
    )
  }
}
