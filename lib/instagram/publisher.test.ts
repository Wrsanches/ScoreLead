import { expect, test, mock } from "bun:test"
import { advancePublication, type PublicationPatch } from "./publisher"
import type { Publication } from "./data"
const now = new Date("2030-06-01T15:00:00Z")
function job(overrides: Partial<Publication> = {}): Publication {
  return {
    id: "pub",
    postId: "post",
    connectionId: "connection",
    status: "scheduled",
    scheduledAt: now,
    timeZone: "UTC",
    caption: "hello",
    mediaUrls: ["image"],
    childContainerIds: [],
    containerId: "container",
    containerCreatedAt: now,
    publishAttemptedAt: null,
    instagramMediaId: null,
    permalink: null,
    publishedAt: null,
    errorCode: null,
    attempts: 1,
    nextAttemptAt: now,
    leaseToken: "lease",
    leaseExpiresAt: new Date(now.getTime() + 60_000),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
function harness(row: Publication, status = "FINISHED") {
  const patches: PublicationPatch[] = []
  const deps = {
    api: {
      createImageContainer: mock(async () => "child"),
      createCarouselContainer: mock(async () => "parent"),
      containerStatus: mock(async () => status as "FINISHED"),
    },
    save: async (patch: PublicationPatch) => {
      patches.push(patch)
      Object.assign(row, patch)
    },
    publish: mock(async () => {
      expect(row.publishAttemptedAt).toEqual(now)
    }),
  }
  return { deps, patches }
}
test("never publishes before the chosen instant", async () => {
  const row = job({ scheduledAt: new Date(now.getTime() + 600_000) })
  const { deps } = harness(row)
  await advancePublication(row, "account", "token", deps, now)
  expect(deps.publish).not.toHaveBeenCalled()
  expect(row.nextAttemptAt).toEqual(row.scheduledAt)
})
test("persists the attempt before publishing", async () => {
  const row = job()
  const { deps } = harness(row)
  await advancePublication(row, "account", "token", deps, now)
  expect(deps.publish).toHaveBeenCalledTimes(1)
  expect(row.status).toBe("publishing")
})
test("a lost response is reconciled without sending again", async () => {
  const row = job({
    publishAttemptedAt: new Date(now.getTime() - 60_000),
    status: "publishing",
  })
  const { deps } = harness(row, "PUBLISHED")
  await advancePublication(row, "account", "token", deps, now)
  expect(row.status).toBe("published")
  expect(deps.publish).not.toHaveBeenCalled()
})
test("an unresolved attempt requires review, never an automatic duplicate", async () => {
  const row = job({ publishAttemptedAt: new Date(now.getTime() - 11 * 60_000) })
  const { deps } = harness(row)
  await advancePublication(row, "account", "token", deps, now)
  expect(row.status).toBe("needs_review")
  expect(deps.publish).not.toHaveBeenCalled()
})
test("carousel children are checkpointed and resumed in order", async () => {
  const row = job({
    containerId: null,
    mediaUrls: ["one", "two"],
    childContainerIds: ["existing-child"],
  })
  const { deps } = harness(row)
  await advancePublication(row, "account", "token", deps, now)
  expect(deps.api.createImageContainer).toHaveBeenCalledWith(
    "account",
    "token",
    "two",
  )
  expect(row.childContainerIds).toEqual(["existing-child", "child"])
  await advancePublication(row, "account", "token", deps, now)
  expect(deps.api.createCarouselContainer).toHaveBeenCalledWith(
    "account",
    "token",
    ["existing-child", "child"],
    "hello",
  )
})
test("overdue posts fail instead of appearing hours late", async () => {
  const row = job({ scheduledAt: new Date(now.getTime() - 61 * 60_000) })
  const { deps } = harness(row)
  await advancePublication(row, "account", "token", deps, now)
  expect(row.status).toBe("failed")
  expect(deps.publish).not.toHaveBeenCalled()
})
test("a carousel waits for each image to finish processing", async () => {
  const row = job({
    containerId: null,
    mediaUrls: ["one", "two"],
    childContainerIds: ["first"],
  })
  const { deps } = harness(row, "IN_PROGRESS")
  await advancePublication(row, "account", "token", deps, now)
  expect(deps.api.createImageContainer).not.toHaveBeenCalled()
  expect(deps.api.createCarouselContainer).not.toHaveBeenCalled()
  expect(row.nextAttemptAt.getTime()).toBe(now.getTime() + 60_000)
})
