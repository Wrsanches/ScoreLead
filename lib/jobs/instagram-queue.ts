import { randomUUID } from "node:crypto"
import { and, eq, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { instagramConnection, instagramPublication } from "@/lib/db/schema"
import * as api from "@/lib/instagram/api"
import { instagramEnabled } from "@/lib/instagram/config"
import {
  decryptInstagramToken,
  encryptInstagramToken,
} from "@/lib/instagram/security"
import {
  advancePublication,
  type PublicationPatch,
} from "@/lib/instagram/publisher"
import type { Publication } from "@/lib/instagram/data"

export async function refreshDueInstagramConnection() {
  const claimed = await db.execute(sql`
    UPDATE instagram_connection SET "refreshAfter" = now() + interval '1 hour'
    WHERE id = (SELECT id FROM instagram_connection WHERE status = 'connected'
      AND "refreshAfter" <= now() ORDER BY "refreshAfter" FOR UPDATE SKIP LOCKED LIMIT 1)
    RETURNING *
  `)
  const row = claimed.rows[0] as
    typeof instagramConnection.$inferSelect | undefined
  if (!row || !row.accessTokenEncrypted) return
  if (new Date(row.tokenExpiresAt) <= new Date()) {
    await db
      .update(instagramConnection)
      .set({
        status: "needs_action",
        accessTokenEncrypted: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(instagramConnection.id, row.id),
          eq(
            instagramConnection.accessTokenEncrypted,
            row.accessTokenEncrypted,
          ),
        ),
      )
    return
  }
  try {
    const refreshed = await api.refreshInstagramToken(
      decryptInstagramToken(row.accessTokenEncrypted, row.businessId),
    )
    await db
      .update(instagramConnection)
      .set({
        accessTokenEncrypted: encryptInstagramToken(
          refreshed.access_token,
          row.businessId,
        ),
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        refreshAfter: new Date(
          Date.now() + Math.min(30 * 86400, refreshed.expires_in / 2) * 1000,
        ),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(instagramConnection.id, row.id),
          eq(instagramConnection.status, "connected"),
          eq(
            instagramConnection.accessTokenEncrypted,
            row.accessTokenEncrypted,
          ),
        ),
      )
  } catch (error) {
    if (error instanceof api.InstagramApiError && error.code === 190) {
      await db
        .update(instagramConnection)
        .set({
          status: "needs_action",
          accessTokenEncrypted: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(instagramConnection.id, row.id),
            eq(
              instagramConnection.accessTokenEncrypted,
              row.accessTokenEncrypted,
            ),
          ),
        )
    }
  }
}

export async function claimInstagramPublication() {
  const leaseToken = randomUUID()
  const result = await db.execute(sql`
    UPDATE instagram_publication SET "leaseToken" = ${leaseToken},
      "leaseExpiresAt" = now() + interval '2 minutes', attempts = attempts + 1
    WHERE id = (SELECT id FROM instagram_publication
      WHERE status IN ('scheduled', 'publishing') AND "nextAttemptAt" <= now()
      AND ("leaseExpiresAt" IS NULL OR "leaseExpiresAt" < now())
      ORDER BY "nextAttemptAt" FOR UPDATE SKIP LOCKED LIMIT 1)
    RETURNING *
  `)
  const claimedId = result.rows[0]?.id
  if (typeof claimedId !== "string") return undefined
  // Drizzle maps timestamptz on typed selects; raw execute rows may contain
  // strings depending on the driver's parsers. Never cast them to Date.
  const [claimed] = await db
    .select()
    .from(instagramPublication)
    .where(
      and(
        eq(instagramPublication.id, claimedId),
        eq(instagramPublication.leaseToken, leaseToken),
      ),
    )
  return claimed
}

async function runClaimed(job: Publication) {
  const leaseToken = job.leaseToken!
  let usedTokenEnvelope: string | null = null
  const owned = and(
    eq(instagramPublication.id, job.id),
    eq(instagramPublication.leaseToken, leaseToken),
  )
  const save = async (patch: PublicationPatch) => {
    const updated = await db
      .update(instagramPublication)
      .set({ ...patch, updatedAt: new Date() })
      .where(owned)
      .returning({ id: instagramPublication.id })
    if (!updated.length) throw new Error("LEASE_LOST")
    Object.assign(job, patch)
  }
  try {
    const [connection] = await db
      .select()
      .from(instagramConnection)
      .where(eq(instagramConnection.id, job.connectionId))
    if (
      !connection?.accessTokenEncrypted ||
      connection.status !== "connected" ||
      connection.tokenExpiresAt <= new Date()
    ) {
      await save({
        status: job.publishAttemptedAt ? "needs_review" : "failed",
        errorCode: job.publishAttemptedAt
          ? "PUBLISH_UNCERTAIN"
          : "RECONNECT_REQUIRED",
      })
      return
    }
    const token = decryptInstagramToken(
      connection.accessTokenEncrypted,
      connection.businessId,
    )
    usedTokenEnvelope = connection.accessTokenEncrypted
    await advancePublication(job, connection.instagramUserId, token, {
      api,
      save,
      publish: async () => {
        // Serializes the final send against disconnect/reconnect. The attempt
        // marker was committed above and survives rollback or process death.
        await db.transaction(async (tx) => {
          const [current] = await tx
            .select()
            .from(instagramConnection)
            .where(eq(instagramConnection.id, connection.id))
            .for("update")
          const [fresh] = await tx
            .select()
            .from(instagramPublication)
            .where(owned)
            .for("update")
          if (
            !fresh ||
            fresh.status !== "publishing" ||
            !fresh.containerId ||
            !current?.accessTokenEncrypted ||
            current.status !== "connected" ||
            current.instagramUserId !== connection.instagramUserId
          )
            throw new Error("LEASE_LOST")
          const currentToken = decryptInstagramToken(
            current.accessTokenEncrypted,
            current.businessId,
          )
          const mediaId = await api.publishContainer(
            current.instagramUserId,
            currentToken,
            fresh.containerId,
          )
          await tx
            .update(instagramPublication)
            .set({
              status: "published",
              instagramMediaId: mediaId,
              publishedAt: new Date(),
              errorCode: null,
              updatedAt: new Date(),
            })
            .where(owned)
          job.instagramMediaId = mediaId
        })
        if (job.instagramMediaId) {
          try {
            const permalink = await api.mediaPermalink(
              job.instagramMediaId,
              token,
            )
            await save({ permalink })
          } catch {
            /* Published successfully; the profile still exposes the post. */
          }
        }
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "LEASE_LOST") return
    const authError =
      error instanceof api.InstagramApiError && error.code === 190
    if (authError && usedTokenEnvelope) {
      await db
        .update(instagramConnection)
        .set({
          status: "needs_action",
          accessTokenEncrypted: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(instagramConnection.id, job.connectionId),
            eq(instagramConnection.accessTokenEncrypted, usedTokenEnvelope),
          ),
        )
    }
    const terminal =
      authError ||
      (error instanceof api.InstagramApiError && !error.transient) ||
      job.attempts >= 8
    // Once a send was attempted, never turn an ambiguous outcome into a retry.
    if (job.publishAttemptedAt) {
      const needsReview =
        Date.now() - job.publishAttemptedAt.getTime() >= 10 * 60_000
      await save({
        status: needsReview ? "needs_review" : "publishing",
        errorCode: "PUBLISH_UNCERTAIN",
        nextAttemptAt: new Date(Date.now() + 60_000),
      }).catch(() => {})
    } else {
      await save({
        status: terminal ? "failed" : "scheduled",
        errorCode: authError
          ? "RECONNECT_REQUIRED"
          : "INSTAGRAM_REQUEST_FAILED",
        nextAttemptAt: new Date(
          Date.now() +
            Math.min(15 * 60_000, 30_000 * 2 ** Math.min(job.attempts, 5)),
        ),
      }).catch(() => {})
    }
  } finally {
    await db
      .update(instagramPublication)
      .set({ leaseToken: null, leaseExpiresAt: null })
      .where(owned)
  }
}
let pumping = false
export async function processInstagramQueue() {
  if (!instagramEnabled() || pumping) return { processed: 0 }
  pumping = true
  let processed = 0
  try {
    await refreshDueInstagramConnection()
    const deadline = Date.now() + 40_000
    while (Date.now() < deadline && processed < 20) {
      const job = await claimInstagramPublication()
      if (!job) break
      await runClaimed(job)
      processed++
    }
    // Expired OAuth attempts contain no tokens and have no remaining purpose.
    const { instagramOAuthState } = await import("@/lib/db/schema")
    await db
      .delete(instagramOAuthState)
      .where(lt(instagramOAuthState.expiresAt, new Date()))
    return { processed }
  } finally {
    pumping = false
  }
}
