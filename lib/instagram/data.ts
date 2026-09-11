import { and, eq, gt, inArray, or } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  contentPost,
  instagramConnection,
  instagramPublication,
  instagramOAuthState,
} from "@/lib/db/schema"
import { PublishingError, publicationLocksPost } from "./validation"

export type Publication = typeof instagramPublication.$inferSelect
export type Connection = typeof instagramConnection.$inferSelect
export function publicConnection(connection: Connection | undefined) {
  if (!connection || connection.status === "disconnected") return null
  return {
    username: connection.username,
    status: connection.status,
    tokenExpiresAt: connection.tokenExpiresAt.toISOString(),
  }
}
export function publicPublication(row: Publication | undefined) {
  if (!row) return null
  return {
    id: row.id,
    status: row.status,
    scheduledAt: row.scheduledAt.toISOString(),
    timeZone: row.timeZone,
    publishedAt: row.publishedAt?.toISOString() || null,
    permalink: row.permalink,
    errorCode: row.errorCode,
  }
}
export type PublicationView = NonNullable<ReturnType<typeof publicPublication>>
export async function getConnection(businessId: string) {
  const [row] = await db
    .select()
    .from(instagramConnection)
    .where(eq(instagramConnection.businessId, businessId))
  return row
}
export async function getPublication(postId: string) {
  const [row] = await db
    .select()
    .from(instagramPublication)
    .where(eq(instagramPublication.postId, postId))
  return row
}
export async function attachPublications<T extends { id: string }>(posts: T[]) {
  if (!posts.length) return []
  const rows = await db
    .select()
    .from(instagramPublication)
    .where(
      inArray(
        instagramPublication.postId,
        posts.map((post) => post.id),
      ),
    )
  const byPost = new Map(
    rows.map((row) => [row.postId, publicPublication(row)]),
  )
  return posts.map((post) => ({
    ...post,
    publication: byPost.get(post.id) || null,
  }))
}
export async function assertPostEditable(postId: string) {
  if (publicationLocksPost((await getPublication(postId))?.status))
    throw new PublishingError("POST_LOCKED", 409)
}
/** Every content mutation and scheduling action serializes on the post row. */
export async function updateEditablePost(
  postId: string,
  values: Partial<typeof contentPost.$inferInsert>,
) {
  return db.transaction(async (tx) => {
    const [post] = await tx
      .select()
      .from(contentPost)
      .where(eq(contentPost.id, postId))
      .for("update")
    if (!post) throw new PublishingError("POST_NOT_FOUND", 404)
    const [publication] = await tx
      .select()
      .from(instagramPublication)
      .where(eq(instagramPublication.postId, postId))
    if (publicationLocksPost(publication?.status))
      throw new PublishingError("POST_LOCKED", 409)
    const [updated] = await tx
      .update(contentPost)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(contentPost.id, postId))
      .returning()
    return updated
  })
}
export async function deleteEditablePost(postId: string) {
  return db.transaction(async (tx) => {
    const [post] = await tx
      .select()
      .from(contentPost)
      .where(eq(contentPost.id, postId))
      .for("update")
    const [publication] = await tx
      .select()
      .from(instagramPublication)
      .where(eq(instagramPublication.postId, postId))
    if (publicationLocksPost(publication?.status))
      throw new PublishingError("POST_LOCKED", 409)
    if (post) await tx.delete(contentPost).where(eq(contentPost.id, postId))
    return publication?.mediaUrls || []
  })
}
/** Cancels unsent work and destroys tokens, including provider-initiated revocation. */
export async function disconnectInstagram(connectionId: string, force = false) {
  return db.transaction(async (tx) => {
    // Workers lock the connection only across the final publication request.
    const [connection] = await tx
      .select()
      .from(instagramConnection)
      .where(eq(instagramConnection.id, connectionId))
      .for("update")
    if (!connection) return
    const jobs = await tx
      .select()
      .from(instagramPublication)
      .where(eq(instagramPublication.connectionId, connectionId))
      .for("update")
    if (
      !force &&
      jobs.some((job) => job.leaseExpiresAt && job.leaseExpiresAt > new Date())
    )
      throw new PublishingError("PUBLICATION_BUSY", 409)
    await tx
      .update(instagramConnection)
      .set({
        status: "disconnected",
        accessTokenEncrypted: null,
        updatedAt: new Date(),
      })
      .where(eq(instagramConnection.id, connectionId))
    for (const job of jobs) {
      if (!["scheduled", "publishing"].includes(job.status)) continue
      await tx
        .update(instagramPublication)
        .set({
          status: job.publishAttemptedAt ? "needs_review" : "cancelled",
          errorCode: job.publishAttemptedAt
            ? "PUBLISH_UNCERTAIN"
            : "ACCOUNT_DISCONNECTED",
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(instagramPublication.id, job.id),
            eq(instagramPublication.connectionId, connectionId),
          ),
        )
    }
  })
}

export async function consumeInstagramState(hash: string, userId: string) {
  const [pending] = await db
    .delete(instagramOAuthState)
    .where(
      and(
        eq(instagramOAuthState.hash, hash),
        eq(instagramOAuthState.userId, userId),
        gt(instagramOAuthState.expiresAt, new Date()),
      ),
    )
    .returning()
  return pending
}

/** Delete provider data, retaining authored drafts and duplicate-prevention state. */
export async function eraseInstagramUserData(userId: string) {
  await db.transaction(async (tx) => {
    const connections = await tx.select().from(instagramConnection).where(or(
      eq(instagramConnection.oauthUserId, userId),
      eq(instagramConnection.instagramUserId, userId),
    )).for("update")
    for (const connection of connections) {
      // The final publishing request holds this same connection lock.
      const jobs = await tx.select().from(instagramPublication)
        .where(eq(instagramPublication.connectionId, connection.id)).for("update")
      await tx.update(instagramConnection).set({
        status: "disconnected", accessTokenEncrypted: null,
        instagramUserId: "", oauthUserId: "", username: "",
        updatedAt: new Date(),
      }).where(eq(instagramConnection.id, connection.id))
      for (const job of jobs) {
        const pending = ["scheduled", "publishing"].includes(job.status)
        await tx.update(instagramPublication).set({
          childContainerIds: [], containerId: null, containerCreatedAt: null,
          instagramMediaId: null, permalink: null,
          ...(pending ? {
            status: job.publishAttemptedAt ? "needs_review" : "cancelled",
            errorCode: job.publishAttemptedAt ? "PUBLISH_UNCERTAIN" : "ACCOUNT_DISCONNECTED",
          } : {}),
          leaseToken: null, leaseExpiresAt: null, updatedAt: new Date(),
        }).where(eq(instagramPublication.id, job.id))
      }
      await tx.delete(instagramOAuthState)
        .where(eq(instagramOAuthState.businessId, connection.businessId))
    }
  })
}
