import { and, eq, inArray, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supportAssistant, supportGithubDelivery } from "@/lib/db/schema"
import { retireArtifacts } from "@/lib/support/data"
import { verifyGitHubSignature } from "@/lib/support/github"

type Payload = {
  action?: string
  ref?: string
  installation?: { id: number }
  repository?: { id: number }
  repositories_removed?: Array<{ id: number }>
  sender?: { id: number }
}
export async function POST(request: Request) {
  const body = await request.text()
  if (body.length > 2_000_000)
    return NextResponse.json({ code: "too_large" }, { status: 413 })
  if (!verifyGitHubSignature(body, request.headers.get("x-hub-signature-256")))
    return NextResponse.json({ code: "invalid_signature" }, { status: 401 })
  const event = request.headers.get("x-github-event"),
    delivery = request.headers.get("x-github-delivery")
  if (!delivery || delivery.length > 100)
    return NextResponse.json({ code: "invalid_delivery" }, { status: 400 })
  let payload: Payload
  try {
    payload = JSON.parse(body)
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      (payload.repositories_removed !== undefined &&
        !Array.isArray(payload.repositories_removed))
    )
      throw new Error("invalid_payload")
  } catch {
    return NextResponse.json({ code: "invalid_json" }, { status: 400 })
  }
  await db.transaction(async (tx) => {
    const [claim] = await tx
      .insert(supportGithubDelivery)
      .values({ id: delivery })
      .onConflictDoNothing()
      .returning()
    if (!claim) return
    const removed =
      event === "installation_repositories"
        ? (payload.repositories_removed ?? []).map((repo) => String(repo.id))
        : []
    const revokedUser =
      event === "github_app_authorization" &&
      payload.action === "revoked" &&
      payload.sender?.id
        ? String(payload.sender.id)
        : null
    const revokedInstall =
      event === "installation" &&
      ["deleted", "suspend"].includes(payload.action || "")
    if (
      (revokedInstall && payload.installation?.id) ||
      removed.length ||
      revokedUser
    ) {
      const filter = revokedUser
        ? eq(supportAssistant.githubUserId, revokedUser)
        : and(
            eq(
              supportAssistant.installationId,
              String(payload.installation?.id),
            ),
            ...(removed.length
              ? [inArray(supportAssistant.repositoryId, removed)]
              : []),
          )
      const rows = await tx
        .select()
        .from(supportAssistant)
        .where(filter)
        .for("update")
      for (const row of rows) {
        await retireArtifacts(tx, row)
        await tx
          .update(supportAssistant)
          .set({
            enabled: false,
            status: "error",
            errorCode: "github_access_required",
            version: row.version + 1,
            vectorStoreId: null,
            fileId: null,
            snapshotPaths: [],
            snapshotSha: null,
            syncToken: null,
            updatedAt: new Date(),
          })
          .where(eq(supportAssistant.businessId, row.businessId))
      }
      if (revokedUser)
        await tx
          .update(supportAssistant)
          .set({
            grantToken: null,
            grantExpiresAt: null,
            grantUserId: null,
            grantGithubUserId: null,
          })
          .where(eq(supportAssistant.grantGithubUserId, revokedUser))
    }
    if (
      event === "push" &&
      payload.repository?.id &&
      payload.installation?.id &&
      payload.ref?.startsWith("refs/heads/")
    ) {
      await tx
        .update(supportAssistant)
        .set({
          status: "queued",
          syncRequestedAt: new Date(),
          syncToken: null,
          version: sql`${supportAssistant.version} + 1`,
          previewedVersion: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(supportAssistant.repositoryId, String(payload.repository.id)),
            eq(
              supportAssistant.installationId,
              String(payload.installation.id),
            ),
            eq(supportAssistant.branch, payload.ref.slice(11)),
          ),
        )
    }
  })
  return NextResponse.json({ ok: true })
}
