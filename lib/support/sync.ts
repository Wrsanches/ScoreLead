import { randomUUID } from "node:crypto"
import { toFile } from "openai"
import { and, eq, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  supportArtifactCleanup,
  supportAssistant,
  supportGithubState,
} from "@/lib/db/schema"
import { supportAI } from "./answers"
import { retireArtifacts } from "./data"
import { GitHubError, readRepository } from "./github"

export async function processSupportSync() {
  const client = supportAI()
  await db
    .delete(supportGithubState)
    .where(lt(supportGithubState.expiresAt, new Date()))
  await db
    .update(supportAssistant)
    .set({
      grantToken: null,
      grantUserId: null,
      grantGithubUserId: null,
      grantExpiresAt: null,
    })
    .where(lt(supportAssistant.grantExpiresAt, new Date()))
  // A crashed import is retryable; its temporary remote artifacts have a cleanup lease.
  await db.execute(
    sql`UPDATE support_assistant SET status='queued', "syncToken"=NULL WHERE status='syncing' AND "syncStartedAt" < NOW() - INTERVAL '10 minutes'`,
  )
  await db.execute(
    sql`UPDATE support_assistant SET status='queued', "syncRequestedAt"=NOW() WHERE status='ready' AND "lastSyncedAt" < NOW() - INTERVAL '24 hours'`,
  )
  const indexing = await db
    .select()
    .from(supportAssistant)
    .where(eq(supportAssistant.status, "indexing"))
    .limit(3)
  for (const row of indexing) {
    if (!row.fileId || !row.vectorStoreId) continue
    try {
      const file = await client.vectorStores.files.retrieve(row.fileId, {
        vector_store_id: row.vectorStoreId,
      })
      if (file.status === "in_progress") {
        if (
          row.syncStartedAt &&
          Date.now() - row.syncStartedAt.getTime() > 10 * 60_000
        )
          throw new Error("index_failed")
        continue
      }
      if (file.status !== "completed") throw new Error("index_failed")
      await db
        .update(supportAssistant)
        .set({
          status: "ready",
          lastSyncedAt: new Date(),
          errorCode: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(supportAssistant.businessId, row.businessId),
            eq(supportAssistant.syncToken, row.syncToken!),
          ),
        )
    } catch {
      await db
        .update(supportAssistant)
        .set({
          status: "error",
          errorCode: "index_failed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(supportAssistant.businessId, row.businessId),
            eq(supportAssistant.syncToken, row.syncToken!),
          ),
        )
    }
  }
  const claim = await db.execute<{ businessId: string }>(sql`
    UPDATE support_assistant SET status='syncing', "syncStartedAt"=NOW(), "syncToken"=${randomUUID()}
    WHERE "businessId" IN (SELECT "businessId" FROM support_assistant WHERE status='queued' AND "repositoryId" IS NOT NULL ORDER BY "syncRequestedAt" FOR UPDATE SKIP LOCKED LIMIT 1)
    RETURNING "businessId"`)
  if (claim.rows[0]) {
    const [row] = await db
      .select()
      .from(supportAssistant)
      .where(eq(supportAssistant.businessId, claim.rows[0].businessId))
    const cleanupId = randomUUID()
    try {
      const snapshot = await readRepository({
        repository: row.repository!,
        repositoryId: row.repositoryId!,
        installationId: row.installationId!,
        branch: row.branch!,
        includePaths: row.includePaths,
      })
      const file = await client.files.create({
        purpose: "assistants",
        file: await toFile(
          Buffer.from(snapshot.text),
          "repository-context.txt",
          { type: "text/plain" },
        ),
      })
      await db
        .insert(supportArtifactCleanup)
        .values({
          id: cleanupId,
          fileId: file.id,
          deleteAfter: new Date(Date.now() + 30 * 60_000),
        })
      const store = await client.vectorStores.create({
        name: `support-${row.businessId}`,
        file_ids: [file.id],
        expires_after: { anchor: "last_active_at", days: 7 },
      })
      await db
        .update(supportArtifactCleanup)
        .set({ vectorStoreId: store.id })
        .where(eq(supportArtifactCleanup.id, cleanupId))
      await db.transaction(async (tx) => {
        const [current] = await tx
          .select()
          .from(supportAssistant)
          .where(eq(supportAssistant.businessId, row.businessId))
          .for("update")
        if (
          !current ||
          current.syncToken !== row.syncToken ||
          current.version !== row.version ||
          current.status !== "syncing"
        )
          return
        await retireArtifacts(tx, current)
        await tx
          .update(supportAssistant)
          .set({
            vectorStoreId: store.id,
            fileId: file.id,
            snapshotSha: snapshot.sha,
            snapshotPaths: snapshot.paths,
            skippedFiles: snapshot.skipped,
            status: "indexing",
            errorCode: null,
            updatedAt: new Date(),
          })
          .where(eq(supportAssistant.businessId, row.businessId))
        await tx
          .delete(supportArtifactCleanup)
          .where(eq(supportArtifactCleanup.id, cleanupId))
      })
    } catch (error) {
      await db
        .update(supportAssistant)
        .set({
          status: "error",
          errorCode: error instanceof GitHubError ? error.code : "sync_failed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(supportAssistant.businessId, row.businessId),
            eq(supportAssistant.syncToken, row.syncToken!),
            eq(supportAssistant.status, "syncing"),
          ),
        )
    }
  }
  const cleanup = await db
    .select()
    .from(supportArtifactCleanup)
    .where(lt(supportArtifactCleanup.deleteAfter, new Date()))
    .limit(10)
  for (const row of cleanup) {
    try {
      const remove = async (run: () => Promise<unknown>) => {
        try {
          await run()
        } catch (error) {
          if (!(
            error &&
            typeof error === "object" &&
            "status" in error &&
            error.status === 404
          ))
            throw error
        }
      }
      if (row.vectorStoreId)
        await remove(() => client.vectorStores.delete(row.vectorStoreId!))
      if (row.fileId) await remove(() => client.files.delete(row.fileId!))
      await db
        .delete(supportArtifactCleanup)
        .where(eq(supportArtifactCleanup.id, row.id))
    } catch {
      /* Keep the cleanup job for the next authenticated pump. */
    }
  }
}
