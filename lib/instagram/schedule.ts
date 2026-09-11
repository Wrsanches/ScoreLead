import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  contentPost,
  instagramConnection,
  instagramPublication,
} from "@/lib/db/schema"
import { instagramEnabled } from "./config"
import { preparePublicationImages, removePublicationImages } from "./media"
import { getConnection, getPublication, type Publication } from "./data"
import {
  PublishingError,
  publicationLocksPost,
  validatePost,
  validateSchedule,
} from "./validation"

export async function scheduleInstagramPost(
  postId: string,
  scheduledFor: string,
  timeZone: string,
  expectedUpdatedAt: string,
) {
  if (!instagramEnabled())
    throw new PublishingError("INSTAGRAM_NOT_CONFIGURED", 503)
  const scheduledAt = validateSchedule(scheduledFor, timeZone)
  const [post] = await db
    .select()
    .from(contentPost)
    .where(eq(contentPost.id, postId))
  if (!post) throw new PublishingError("POST_NOT_FOUND", 404)
  const connection = await getConnection(post.businessId)
  if (
    !connection?.accessTokenEncrypted ||
    connection.status !== "connected" ||
    connection.tokenExpiresAt <= new Date()
  )
    throw new PublishingError("RECONNECT_REQUIRED", 409)
  if (publicationLocksPost((await getPublication(postId))?.status))
    throw new PublishingError("POST_LOCKED", 409)
  if (post.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime())
    throw new PublishingError("POST_CHANGED", 409)
  const { caption, images } = validatePost(post)
  const id = randomUUID()
  const mediaUrls = await preparePublicationImages(
    id,
    post.id,
    images.map((image) => image.url),
  )
  let oldMedia: string[] = []
  try {
    const result = await db.transaction(async (tx) => {
      // Match the worker/disconnect lock order: connection, then post/publication.
      const [currentConnection] = await tx
        .select()
        .from(instagramConnection)
        .where(eq(instagramConnection.id, connection.id))
        .for("update")
      if (
        !currentConnection?.accessTokenEncrypted ||
        currentConnection.status !== "connected" ||
        currentConnection.instagramUserId !== connection.instagramUserId
      )
        throw new PublishingError("RECONNECT_REQUIRED", 409)
      const [current] = await tx
        .select()
        .from(contentPost)
        .where(eq(contentPost.id, postId))
        .for("update")
      if (!current || current.updatedAt.getTime() !== post.updatedAt.getTime())
        throw new PublishingError("POST_CHANGED", 409)
      const [previous] = await tx
        .select()
        .from(instagramPublication)
        .where(eq(instagramPublication.postId, postId))
        .for("update")
      if (publicationLocksPost(previous?.status))
        throw new PublishingError("POST_LOCKED", 409)
      if (scheduledAt <= new Date())
        throw new PublishingError("SCHEDULE_IN_FUTURE")
      if (previous) {
        oldMedia = previous.mediaUrls
        await tx
          .delete(instagramPublication)
          .where(eq(instagramPublication.id, previous.id))
      }
      const [publication] = await tx
        .insert(instagramPublication)
        .values({
          id,
          postId,
          connectionId: connection.id,
          scheduledAt,
          timeZone,
          caption,
          mediaUrls,
          nextAttemptAt: new Date(
            Math.max(Date.now(), scheduledAt.getTime() - 15 * 60_000),
          ),
        })
        .returning()
      await tx
        .update(contentPost)
        .set({
          scheduledFor: scheduledAt,
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(contentPost.id, postId))
      return publication
    })
    await removePublicationImages(oldMedia)
    return result
  } catch (error) {
    await removePublicationImages(mediaUrls)
    throw error
  }
}
export async function cancelInstagramPost(
  postId: string,
): Promise<Publication | undefined> {
  return db.transaction(async (tx) => {
    await tx
      .select({ id: contentPost.id })
      .from(contentPost)
      .where(eq(contentPost.id, postId))
      .for("update")
    const [job] = await tx
      .select()
      .from(instagramPublication)
      .where(eq(instagramPublication.postId, postId))
      .for("update")
    if (!job || job.status === "cancelled") return job
    if (job.status !== "scheduled" || job.publishAttemptedAt)
      throw new PublishingError("CANNOT_CANCEL", 409)
    if (job.leaseExpiresAt && job.leaseExpiresAt > new Date())
      throw new PublishingError("PUBLICATION_BUSY", 409)
    const [cancelled] = await tx
      .update(instagramPublication)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(instagramPublication.id, job.id))
      .returning()
    return cancelled
  })
}
