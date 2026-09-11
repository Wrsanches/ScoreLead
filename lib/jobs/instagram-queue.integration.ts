/** Run only against a disposable local DB: see docs/instagram-setup.md. */
import { afterAll, beforeAll, beforeEach, expect, mock, test } from "bun:test"
import { eq } from "drizzle-orm"
import { createHmac } from "node:crypto"
const databaseUrl = new URL(process.env.DATABASE_URL || "http://missing")
if (
  !["127.0.0.1", "localhost"].includes(databaseUrl.hostname) ||
  !databaseUrl.pathname.endsWith("_test")
)
  throw new Error("Use a disposable local *_test database")
process.env.INSTAGRAM_INTEGRATION_ENABLED = "true"
process.env.INSTAGRAM_APP_ID = "test-app"
process.env.INSTAGRAM_APP_SECRET = "test-secret"
process.env.INSTAGRAM_REDIRECT_URI =
  "http://localhost:3000/api/instagram/callback"
process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString(
  "base64",
)
let publishes = 0
let loseResponse = false
let metaPublished = false
mock.module("@/lib/instagram/api", () => ({
  InstagramApiError: class extends Error {
    code = 0
    transient = true
  },
  createImageContainer: async () => "container",
  createCarouselContainer: async () => "carousel",
  containerStatus: async () => (metaPublished ? "PUBLISHED" : "FINISHED"),
  publishContainer: async () => {
    publishes++
    metaPublished = true
    if (loseResponse) throw new Error("timeout")
    return "media"
  },
  mediaPermalink: async () => "https://www.instagram.com/p/test/",
  refreshInstagramToken: async () => {
    throw new Error("Unexpected refresh")
  },
}))
import { db, pool } from "@/lib/db"
import {
  user,
  business,
  contentPost,
  instagramConnection,
  instagramPublication,
  instagramOAuthState,
} from "@/lib/db/schema"
import { encryptInstagramToken } from "@/lib/instagram/security"
let processInstagramQueue: (typeof import("./instagram-queue"))["processInstagramQueue"]
let claimInstagramPublication: (typeof import("./instagram-queue"))["claimInstagramPublication"]
import {
  updateEditablePost,
  disconnectInstagram,
  consumeInstagramState,
} from "@/lib/instagram/data"
let cancelInstagramPost: (typeof import("@/lib/instagram/schedule"))["cancelInstagramPost"]
let scheduleInstagramPost: (typeof import("@/lib/instagram/schedule"))["scheduleInstagramPost"]
import { getBusinessAccess } from "@/lib/business-access"
mock.module("@/lib/instagram/media", () => ({
  preparePublicationImages: async (id: string) => [
    `https://images.example.invalid/${id}.jpg`,
  ],
  removePublicationImages: async () => {},
}))
beforeAll(async () => {
  ;({ cancelInstagramPost, scheduleInstagramPost } =
    await import("@/lib/instagram/schedule"))
  ;({ processInstagramQueue, claimInstagramPublication } =
    await import("./instagram-queue"))
})
const UID = "ig-queue-test-user"
const BIZ = "ig-queue-test-business"
beforeEach(async () => {
  await db.delete(user).where(eq(user.id, UID))
  await db
    .insert(user)
    .values({
      id: UID,
      name: "Queue test",
      email: "ig-queue-test@example.invalid",
    })
  await db.insert(business).values({ id: BIZ, userId: UID, name: "Queue test" })
  await db
    .insert(contentPost)
    .values({
      id: "ig-post",
      userId: UID,
      businessId: BIZ,
      scheduledFor: new Date(),
      caption: "hello",
    })
  await db
    .insert(instagramConnection)
    .values({
      id: "ig-conn",
      businessId: BIZ,
      instagramUserId: "123",
      oauthUserId: "123",
      username: "test",
      accessTokenEncrypted: encryptInstagramToken("test-token", BIZ),
      tokenExpiresAt: new Date(Date.now() + 30 * 86400_000),
      refreshAfter: new Date(Date.now() + 86400_000),
    })
  publishes = 0
  loseResponse = false
  metaPublished = false
})
afterAll(async () => {
  await db.delete(user).where(eq(user.id, UID))
  await pool.end()
})
async function enqueue(extra = {}) {
  await db
    .insert(instagramPublication)
    .values({
      id: "ig-pub",
      postId: "ig-post",
      connectionId: "ig-conn",
      scheduledAt: new Date(Date.now() - 1000),
      timeZone: "UTC",
      caption: "snapshot",
      mediaUrls: ["https://example.invalid/image.jpg"],
      containerId: "container",
      nextAttemptAt: new Date(Date.now() - 1000),
      ...extra,
    })
}
async function publication() {
  return (
    await db
      .select()
      .from(instagramPublication)
      .where(eq(instagramPublication.id, "ig-pub"))
  )[0]
}
test("signed data deletion erases provider data, cancels jobs and authenticates its receipt", async () => {
  await enqueue({ instagramMediaId: "provider-media", permalink: "https://www.instagram.com/p/private/" })
  const { POST, GET } = await import("@/app/api/instagram/data-deletion/route")
  const payload = Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "123" })).toString("base64url")
  const signature = createHmac("sha256", "test-secret").update(payload).digest("base64url")
  const request = (signed: string) => new Request("https://untrusted.invalid/api/instagram/data-deletion", {
    method: "POST", body: new URLSearchParams({ signed_request: signed }),
  })
  expect((await POST(request("invalid"))).status).toBe(403)
  expect((await publication()).status).toBe("scheduled")
  const response = await POST(request(`${signature}.${payload}`))
  expect(response.status).toBe(200)
  const receipt = await response.json()
  expect(new URL(receipt.url).origin).toBe("http://localhost:3000")
  const [connection] = await db.select().from(instagramConnection).where(eq(instagramConnection.id, "ig-conn"))
  expect(connection.accessTokenEncrypted).toBeNull()
  expect(connection.instagramUserId).toBe("")
  expect(connection.oauthUserId).toBe("")
  expect(connection.username).toBe("")
  const job = await publication()
  expect(job.status).toBe("cancelled")
  expect(job.instagramMediaId).toBeNull()
  expect(job.permalink).toBeNull()
  expect(job.containerId).toBeNull()
  expect((await GET(new Request(receipt.url))).status).toBe(200)
  expect((await GET(new Request(receipt.url + "0"))).status).toBe(404)
  expect((await POST(request(`${signature}.${payload}`))).status).toBe(200)
  await processInstagramQueue()
  expect(publishes).toBe(0)
  expect((await db.select().from(contentPost).where(eq(contentPost.id, "ig-post")))).toHaveLength(1)
})
test("concurrent workers cannot claim the same publication", async () => {
  await enqueue()
  const claims = await Promise.all(
    Array.from({ length: 6 }, () => claimInstagramPublication()),
  )
  expect(claims.filter(Boolean)).toHaveLength(1)
})
test("a due post is published once and a second pump does not resend", async () => {
  await enqueue()
  await processInstagramQueue()
  await processInstagramQueue()
  expect(publishes).toBe(1)
  expect((await publication()).status).toBe("published")
  expect((await publication()).permalink).toBe(
    "https://www.instagram.com/p/test/",
  )
})
test("restart after an accepted request with a lost response reconciles the saved container", async () => {
  await enqueue()
  loseResponse = true
  await processInstagramQueue()
  expect((await publication()).publishAttemptedAt).not.toBeNull()
  await db
    .update(instagramPublication)
    .set({
      nextAttemptAt: new Date(Date.now() - 1000),
      leaseExpiresAt: new Date(Date.now() - 1000),
    })
    .where(eq(instagramPublication.id, "ig-pub"))
  await processInstagramQueue()
  expect(publishes).toBe(1)
  expect((await publication()).status).toBe("published")
})
test("future posts, cancellation and disconnection cannot publish", async () => {
  await enqueue({ scheduledAt: new Date(Date.now() + 3600_000) })
  await processInstagramQueue()
  expect(publishes).toBe(0)
  await cancelInstagramPost("ig-post")
  await processInstagramQueue()
  expect((await publication()).status).toBe("cancelled")
  expect(publishes).toBe(0)
  await db
    .update(instagramPublication)
    .set({ status: "scheduled" })
    .where(eq(instagramPublication.id, "ig-pub"))
  await disconnectInstagram("ig-conn")
  expect((await publication()).status).toBe("cancelled")
  expect(
    (await db.select().from(instagramConnection))[0].accessTokenEncrypted,
  ).toBeNull()
})
test("scheduled content is locked; cancellation permits editing", async () => {
  await enqueue()
  await expect(
    updateEditablePost("ig-post", { caption: "changed" }),
  ).rejects.toThrow("POST_LOCKED")
  await cancelInstagramPost("ig-post")
  expect(
    (await updateEditablePost("ig-post", { caption: "changed" })).caption,
  ).toBe("changed")
})
test("OAuth state is user-bound, expires and can only be consumed once", async () => {
  await db
    .insert(instagramOAuthState)
    .values({
      hash: "test-state",
      userId: UID,
      businessId: BIZ,
      locale: "pt",
      expiresAt: new Date(Date.now() + 60_000),
    })
  expect(
    await consumeInstagramState("test-state", "other-user"),
  ).toBeUndefined()
  const attempts = await Promise.all([
    consumeInstagramState("test-state", UID),
    consumeInstagramState("test-state", UID),
  ])
  expect(attempts.filter(Boolean)).toHaveLength(1)
  await db
    .insert(instagramOAuthState)
    .values({
      hash: "expired-state",
      userId: UID,
      businessId: BIZ,
      locale: "pt",
      expiresAt: new Date(Date.now() - 1000),
    })
  expect(await consumeInstagramState("expired-state", UID)).toBeUndefined()
})
test("another user cannot access a business connection or publishing scope", async () => {
  expect(await getBusinessAccess("unrelated-user", BIZ)).toBeNull()
  expect((await getBusinessAccess(UID, BIZ))?.isOwner).toBe(true)
})

test("concurrent schedule requests create one immutable publishing snapshot", async () => {
  const [post] = await db
    .update(contentPost)
    .set({
      images: [
        {
          url: "https://images.example.invalid/original.png",
          headline: "",
          prompt: "uploaded-by-user",
        },
      ],
      caption: "Saved caption",
      hashtags: ["photo"],
    })
    .where(eq(contentPost.id, "ig-post"))
    .returning()
  const time = new Date(Date.now() + 10 * 60_000).toISOString()
  const results = await Promise.allSettled([
    scheduleInstagramPost(
      post.id,
      time,
      "America/Sao_Paulo",
      post.updatedAt.toISOString(),
    ),
    scheduleInstagramPost(
      post.id,
      time,
      "America/Sao_Paulo",
      post.updatedAt.toISOString(),
    ),
  ])
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1)
  const rows = await db
    .select()
    .from(instagramPublication)
    .where(eq(instagramPublication.postId, post.id))
  expect(rows).toHaveLength(1)
  expect(rows[0].caption).toBe("Saved caption\n\n#photo")
  expect(rows[0].scheduledAt.toISOString()).toBe(time)
  expect(rows[0].timeZone).toBe("America/Sao_Paulo")
})
test("disconnect frees the Instagram account for another business", async () => {
  await db
    .insert(business)
    .values({ id: "ig-other-business", userId: UID, name: "Other business" })
  const values = {
    id: "ig-other-connection",
    businessId: "ig-other-business",
    instagramUserId: "123",
    oauthUserId: "123",
    username: "test",
    tokenExpiresAt: new Date(Date.now() + 86400_000),
    refreshAfter: new Date(Date.now() + 86400_000),
  }
  await expect(
    (async () => {
      await db.insert(instagramConnection).values(values)
    })(),
  ).rejects.toThrow()
  await disconnectInstagram("ig-conn")
  await db.insert(instagramConnection).values(values)
  const rows = await db
    .select()
    .from(instagramConnection)
    .where(eq(instagramConnection.instagramUserId, "123"))
  expect(rows.filter((row) => row.status === "connected")).toHaveLength(1)
})
