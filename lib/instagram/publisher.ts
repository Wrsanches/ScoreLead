import * as api from "./api"
import type { Publication } from "./data"

export type PublicationPatch = Partial<Publication>
export type PublisherDependencies = {
  api: Pick<
    typeof api,
    "createImageContainer" | "createCarouselContainer" | "containerStatus"
  >
  save: (patch: PublicationPatch) => Promise<void>
  publish: () => Promise<void>
}
/** One durable step. Container creation can retry; media_publish is attempted once. */
export async function advancePublication(
  job: Publication,
  accountId: string,
  token: string,
  deps: PublisherDependencies,
  now = new Date(),
) {
  const wait = (milliseconds: number) =>
    deps.save({ nextAttemptAt: new Date(now.getTime() + milliseconds) })
  if (job.publishAttemptedAt) {
    if (!job.containerId)
      return deps.save({
        status: "needs_review",
        errorCode: "PUBLISH_UNCERTAIN",
      })
    const status = await deps.api.containerStatus(job.containerId, token)
    if (status === "PUBLISHED")
      return deps.save({
        status: "published",
        publishedAt: now,
        errorCode: null,
      })
    if (status === "ERROR" || status === "EXPIRED")
      return deps.save({
        status: "failed",
        errorCode: "CONTAINER_FAILED",
        publishAttemptedAt: null,
      })
    if (now.getTime() - job.publishAttemptedAt.getTime() >= 10 * 60_000)
      return deps.save({
        status: "needs_review",
        errorCode: "PUBLISH_UNCERTAIN",
      })
    return wait(60_000)
  }
  if (now.getTime() > job.scheduledAt.getTime() + 60 * 60_000)
    return deps.save({ status: "failed", errorCode: "PUBLICATION_OVERDUE" })
  // Unpublished containers expire after 24h. Discard only before any publish attempt.
  if (
    job.containerCreatedAt &&
    now.getTime() - job.containerCreatedAt.getTime() > 23 * 3600_000
  ) {
    return deps.save({
      containerId: null,
      childContainerIds: [],
      containerCreatedAt: null,
      nextAttemptAt: now,
    })
  }
  if (!job.containerId) {
    if (job.mediaUrls.length === 1) {
      const id = await deps.api.createImageContainer(
        accountId,
        token,
        job.mediaUrls[0],
        job.caption,
      )
      return deps.save({
        containerId: id,
        containerCreatedAt: now,
        attempts: 0,
        nextAttemptAt: now,
      })
    }
    // Each image may still be processing after container creation. Checking
    // the newest child before advancing means all earlier children are ready,
    // without issuing ten polling requests in one lease.
    const lastChild = job.childContainerIds.at(-1)
    if (lastChild) {
      const childStatus = await deps.api.containerStatus(lastChild, token)
      if (childStatus === "ERROR" || childStatus === "EXPIRED")
        return deps.save({ status: "failed", errorCode: "CONTAINER_FAILED" })
      if (childStatus !== "FINISHED") return wait(60_000)
    }
    if (job.childContainerIds.length < job.mediaUrls.length) {
      const index = job.childContainerIds.length
      const child = await deps.api.createImageContainer(
        accountId,
        token,
        job.mediaUrls[index],
      )
      return deps.save({
        childContainerIds: [...job.childContainerIds, child],
        containerCreatedAt: job.containerCreatedAt || now,
        attempts: 0,
        nextAttemptAt: now,
      })
    }
    const id = await deps.api.createCarouselContainer(
      accountId,
      token,
      job.childContainerIds,
      job.caption,
    )
    return deps.save({ containerId: id, attempts: 0, nextAttemptAt: now })
  }
  const status = await deps.api.containerStatus(job.containerId, token)
  if (status === "PUBLISHED")
    return deps.save({ status: "published", publishedAt: now, errorCode: null })
  if (status === "ERROR" || status === "EXPIRED")
    return deps.save({ status: "failed", errorCode: "CONTAINER_FAILED" })
  if (status !== "FINISHED") return wait(60_000)
  if (now < job.scheduledAt)
    return deps.save({ nextAttemptAt: job.scheduledAt, attempts: 0 })
  // Persist before crossing the network. After a timeout/crash, reconciliation
  // only reads this container's status; it never creates or publishes a duplicate.
  await deps.save({
    status: "publishing",
    publishAttemptedAt: now,
    nextAttemptAt: new Date(now.getTime() + 60_000),
    errorCode: null,
  })
  await deps.publish()
}
