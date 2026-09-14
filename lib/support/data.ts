import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBusinessAccess } from "@/lib/business-access"
import { db } from "@/lib/db"
import {
  business,
  supportArtifactCleanup,
  supportAssistant,
} from "@/lib/db/schema"
import { can, getUserPlan } from "@/lib/plan"

export type SupportSettings = typeof supportAssistant.$inferSelect
export type SupportTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0]

export async function scopeSupport(
  businessId: string,
  paid = false,
  request?: Request,
) {
  const origin = request?.headers.get("origin")
  if (
    request &&
    request.method !== "GET" &&
    origin &&
    origin !== new URL(request.url).origin
  ) {
    return {
      error: NextResponse.json({ code: "unauthorized" }, { status: 403 }),
    } as const
  }
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session)
    return {
      error: NextResponse.json({ code: "unauthorized" }, { status: 401 }),
    } as const
  const access = await getBusinessAccess(session.user.id, businessId)
  if (!access || access.readOnly)
    return {
      error: NextResponse.json({ code: "not_found" }, { status: 404 }),
    } as const
  if (
    paid &&
    !can(await getUserPlan(access.ownerUserId), "whatsappAutomation")
  ) {
    return {
      error: NextResponse.json({ code: "plan_required" }, { status: 402 }),
    } as const
  }
  return { session, access } as const
}

export async function getSupportSettings(businessId: string) {
  const [existing] = await db
    .select()
    .from(supportAssistant)
    .where(eq(supportAssistant.businessId, businessId))
  if (existing) return existing
  const [owner] = await db
    .select({ language: business.language })
    .from(business)
    .where(eq(business.id, businessId))
  const language = owner?.language?.toLowerCase() || "en"
  const handoffMessage = language.startsWith("pt")
    ? "Não tenho informações suficientes para responder. Uma pessoa da equipe precisa continuar o atendimento."
    : language.startsWith("es")
      ? "No tengo información suficiente para responder. Una persona del equipo debe continuar la atención."
      : "I do not have enough information to answer. Someone from the team needs to continue this conversation."
  await db
    .insert(supportAssistant)
    .values({ businessId, handoffMessage })
    .onConflictDoNothing()
  const [settings] = await db
    .select()
    .from(supportAssistant)
    .where(eq(supportAssistant.businessId, businessId))
  return settings
}

export function publicSettings(row: SupportSettings, actorId: string) {
  return {
    enabled: row.enabled,
    version: row.version,
    instructions: row.instructions,
    handoffMessage: row.handoffMessage,
    repository: row.repository,
    branch: row.branch,
    includePaths: row.includePaths,
    status: row.status,
    lastSyncedAt: row.lastSyncedAt,
    snapshotSha: row.snapshotSha,
    snapshotPaths: row.snapshotPaths,
    skippedFiles: row.skippedFiles,
    errorCode: row.errorCode,
    tested: row.previewedVersion === row.version,
    authorized:
      !!row.grantToken &&
      row.grantUserId === actorId &&
      !!row.grantExpiresAt &&
      row.grantExpiresAt > new Date(),
  }
}

export async function retireArtifacts(
  tx: SupportTransaction,
  row: { vectorStoreId: string | null; fileId: string | null },
) {
  if (row.vectorStoreId || row.fileId)
    await tx
      .insert(supportArtifactCleanup)
      .values({
        id: randomUUID(),
        vectorStoreId: row.vectorStoreId,
        fileId: row.fileId,
      })
}

export async function disconnectSupport(businessId: string) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(supportAssistant)
      .where(eq(supportAssistant.businessId, businessId))
      .for("update")
    if (!row) return
    await retireArtifacts(tx, row)
    await tx
      .update(supportAssistant)
      .set({
        enabled: false,
        version: row.version + 1,
        status: "disconnected",
        repository: null,
        repositoryId: null,
        installationId: null,
        githubUserId: null,
        branch: null,
        grantToken: null,
        grantUserId: null,
        grantGithubUserId: null,
        grantExpiresAt: null,
        vectorStoreId: null,
        fileId: null,
        snapshotSha: null,
        snapshotPaths: [],
        lastSyncedAt: null,
        syncRequestedAt: null,
        syncStartedAt: null,
        syncToken: null,
        errorCode: null,
        updatedAt: new Date(),
      })
      .where(eq(supportAssistant.businessId, businessId))
  })
}
