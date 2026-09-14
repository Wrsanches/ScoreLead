import { afterAll, beforeAll, beforeEach, expect, mock, test } from "bun:test"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import { createHmac } from "node:crypto"
import { resolve } from "node:path"

const pg = new PGlite(),
  testDb = drizzle(pg)
mock.module("@/lib/db", () => ({ db: testDb }))
let actorId = "owner-a",
  planAllowed = true,
  sends: unknown[] = [],
  answers: string[] = [],
  onGenerate: (() => Promise<void>) | null = null,
  sendingFails = false
mock.module("@/lib/auth", () => ({
  auth: { api: { getSession: async () => ({ user: { id: actorId } }) } },
}))
mock.module("next/headers", () => ({ headers: async () => new Headers() }))
mock.module("@/lib/plan", () => ({
  can: () => planAllowed,
  getUserPlan: async () => "growth",
}))
mock.module("@/lib/support/answers", () => ({
  supportAI: () => ai,
  generateSupportAnswer: async (settings: { businessId: string }) => {
    answers.push(settings.businessId)
    await onGenerate?.()
    return { reply: `Answer for ${settings.businessId}`, handoff: false }
  },
}))

let processSupportSync: typeof import("./sync").processSupportSync
let indexState = "in_progress",
  uploaded = 0,
  onRead: (() => Promise<void>) | null = null
const deleted: string[] = []
const ai = {
  files: {
    create: async () => ({ id: `import-file-${++uploaded}` }),
    delete: async (id: string) => {
      deleted.push(id)
    },
  },
  vectorStores: {
    create: async () => ({ id: `import-store-${uploaded}` }),
    delete: async (id: string) => {
      deleted.push(id)
    },
    files: { retrieve: async () => ({ status: indexState }) },
  },
}
let processWhatsAppWebhook: typeof import("@/lib/whatsapp/webhooks").processWhatsAppWebhook
let processSupportReplies: typeof import("./queue").processSupportReplies
let encryptWhatsAppToken: typeof import("@/lib/whatsapp/security").encryptWhatsAppToken
let conversationsRoute: typeof import("@/app/api/businesses/[id]/support/conversations/route")
let githubWebhook: typeof import("@/app/api/webhooks/github/route")

beforeAll(async () => {
  const github = await import("./github")
  mock.module("./github", () => ({
    ...github,
    readRepository: async () => {
      await onRead?.()
      return {
        sha: "commit-123",
        text: "Customer-facing product facts",
        paths: ["README.md"],
        skipped: 0,
      }
    },
  }))
  ;({ processSupportSync } = await import("./sync"))
  const meta = await import("@/lib/whatsapp/meta")
  mock.module("@/lib/whatsapp/meta", () => ({
    ...meta,
    sendTextMessage: async (input: unknown) => {
      sends.push(input)
      if (sendingFails) throw new Error("timeout")
      return { messageId: `out-${sends.length}` }
    },
  }))
  ;({ processWhatsAppWebhook } = await import("@/lib/whatsapp/webhooks"))
  ;({ processSupportReplies } = await import("./queue"))
  ;({ encryptWhatsAppToken } = await import("@/lib/whatsapp/security"))
  conversationsRoute =
    await import("@/app/api/businesses/[id]/support/conversations/route")
  githubWebhook = await import("@/app/api/webhooks/github/route")

  await migrate(testDb, {
    migrationsFolder: resolve(import.meta.dir, "../../drizzle"),
  })
  process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString(
    "base64",
  )
  process.env.GITHUB_WEBHOOK_SECRET = "test-only-webhook-secret"
}, 30_000)
beforeEach(async () => {
  await pg.exec(
    'TRUNCATE "user", support_github_delivery, support_artifact_cleanup CASCADE',
  )
  indexState = "in_progress"
  uploaded = 0
  onRead = null
  deleted.length = 0
  actorId = "owner-a"
  sends = []
  answers = []
  onGenerate = null
  sendingFails = false
  planAllowed = true
  for (const suffix of ["a", "b"]) {
    await pg.query('INSERT INTO "user" (id,name,email) VALUES ($1,$2,$3)', [
      `owner-${suffix}`,
      `Owner ${suffix}`,
      `${suffix}@example.com`,
    ])
    await pg.query(
      'INSERT INTO business (id,"userId",name) VALUES ($1,$2,$3)',
      [`business-${suffix}`, `owner-${suffix}`, `Business ${suffix}`],
    )
    await pg.query(
      'INSERT INTO whatsapp_connection (id,"businessId","wabaId","phoneNumberId","encryptedAccessToken") VALUES ($1,$2,$3,$4,$5)',
      [
        `connection-${suffix}`,
        `business-${suffix}`,
        `waba-${suffix}`,
        `phone-${suffix}`,
        encryptWhatsAppToken("test-token"),
      ],
    )
    await pg.query(
      'INSERT INTO support_assistant ("businessId",enabled,status,repository,"repositoryId","installationId","githubUserId","vectorStoreId","fileId") VALUES ($1,true,\'ready\',$2,$3,$4,$5,$6,$7)',
      [
        `business-${suffix}`,
        `${suffix}/repo`,
        suffix === "a" ? "1" : "2",
        suffix === "a" ? "11" : "22",
        suffix === "a" ? "111" : "222",
        `vs-${suffix}`,
        `file-${suffix}`,
      ],
    )
  }
})
afterAll(async () => {
  await pg.close()
  mock.restore()
})

function inbound(
  messageId: string,
  suffix = "a",
  text = "How does it work?",
  ageMs = 0,
) {
  return processWhatsAppWebhook({
    object: "whatsapp_business_account",
    entry: [
      {
        id: `waba-${suffix}`,
        changes: [
          {
            field: "messages",
            value: {
              metadata: { phone_number_id: `phone-${suffix}` },
              messages: [
                {
                  id: messageId,
                  from: "5511999999999",
                  type: "text",
                  text: { body: text },
                  timestamp: String(Math.floor((Date.now() - ageMs) / 1000)),
                },
              ],
            },
          },
        ],
      },
    ],
  })
}
const count = async (table: string) =>
  (await pg.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${table}`))
    .rows[0].n

test("duplicate Meta deliveries create one inbound record and one reply; unknown contacts work", async () => {
  await inbound("message-1")
  await inbound("message-1")
  expect(await count("whatsapp_inbound_message")).toBe(1)
  expect(await count("support_conversation")).toBe(1)
  expect(await count("support_reply")).toBe(1)
  expect(
    (
      await pg.query<{ leadId: string | null }>(
        'SELECT "leadId" FROM whatsapp_inbound_message',
      )
    ).rows[0].leadId,
  ).toBeNull()
  await processSupportReplies()
  await processSupportReplies()
  expect(sends.length).toBe(1)
  expect(answers).toEqual(["business-a"])
})
test("identical customer phone numbers stay separate between businesses", async () => {
  await inbound("message-a", "a")
  await inbound("message-b", "b")
  await processSupportReplies()
  await processSupportReplies()
  expect(new Set(answers)).toEqual(new Set(["business-a", "business-b"]))
  expect(await count("support_conversation")).toBe(2)
})
test("conversation APIs reject another business's session and conversation id", async () => {
  await inbound("message-b", "b")
  const context = { params: Promise.resolve({ id: "business-b" }) }
  const result = await conversationsRoute.GET(
    new Request(
      "http://localhost/api/businesses/business-b/support/conversations",
    ),
    context,
  )
  expect(result.status).toBe(404)
  const id = (
    await pg.query<{ id: string }>("SELECT id FROM support_conversation")
  ).rows[0].id
  const other = await conversationsRoute.GET(
    new Request(
      `http://localhost/api/businesses/business-a/support/conversations?conversation=${id}`,
    ),
    { params: Promise.resolve({ id: "business-a" }) },
  )
  expect(other.status).toBe(404)
})
test("STOP pauses without generating a reply; expired messages are never queued", async () => {
  await inbound("stop", "a", "PARAR")
  await inbound("old", "b", "Old question", 25 * 60 * 60_000)
  expect(await count("support_reply")).toBe(0)
  expect(
    (
      await pg.query<{ mode: string }>(
        "SELECT mode FROM support_conversation WHERE \"businessId\"='business-a'",
      )
    ).rows[0].mode,
  ).toBe("human")
})
test("takeover during generation prevents dispatch; resume does not replay old questions", async () => {
  await inbound("one")
  onGenerate = async () => {
    const id = (
      await pg.query<{ id: string }>("SELECT id FROM support_conversation")
    ).rows[0].id
    for (const mode of ["human", "bot"]) {
      const response = await conversationsRoute.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: id, mode }),
        }),
        { params: Promise.resolve({ id: "business-a" }) },
      )
      expect(response.status).toBe(200)
    }
  }
  await processSupportReplies()
  expect(sends.length).toBe(0)
})
test("uncertain sends are recorded for review and never automatically retried", async () => {
  await inbound("one")
  sendingFails = true
  await processSupportReplies()
  await processSupportReplies()
  expect(sends.length).toBe(1)
  expect(
    (await pg.query<{ status: string }>("SELECT status FROM support_reply"))
      .rows[0].status,
  ).toBe("needs_review")
  expect(
    (await pg.query<{ mode: string }>("SELECT mode FROM support_conversation"))
      .rows[0].mode,
  ).toBe("human")
})
test("index refresh waits without sending; loss of entitlement skips delivery", async () => {
  await inbound("one")
  await pg.exec(
    "UPDATE support_assistant SET status='syncing' WHERE \"businessId\"='business-a'",
  )
  await processSupportReplies()
  expect(sends.length).toBe(0)
  expect(
    (await pg.query<{ status: string }>("SELECT status FROM support_reply"))
      .rows[0].status,
  ).toBe("queued")
  await inbound("other-tenant", "b")
  await processSupportReplies()
  expect(answers).toEqual(["business-b"])
  await pg.exec(
    "UPDATE support_assistant SET status='ready' WHERE \"businessId\"='business-a'",
  )
  planAllowed = false
  await processSupportReplies()
  expect(answers).toEqual(["business-b"])
})
test("signed GitHub revocation immediately invalidates only the matching tenant and queues deletion", async () => {
  const body = JSON.stringify({ action: "deleted", installation: { id: 11 } })
  const signature = `sha256=${createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!).update(body).digest("hex")}`
  const request = () =>
    new Request("http://localhost/api/webhooks/github", {
      method: "POST",
      body,
      headers: {
        "x-hub-signature-256": signature,
        "x-github-event": "installation",
        "x-github-delivery": "delivery-1",
      },
    })
  expect((await githubWebhook.POST(request())).status).toBe(200)
  expect((await githubWebhook.POST(request())).status).toBe(200)
  const rows = (
    await pg.query<{
      businessId: string
      enabled: boolean
      vectorStoreId: string | null
    }>(
      'SELECT "businessId",enabled,"vectorStoreId" FROM support_assistant ORDER BY "businessId"',
    )
  ).rows
  expect(rows[0].enabled).toBe(false)
  expect(rows[0].vectorStoreId).toBeNull()
  expect(rows[1].enabled).toBe(true)
  expect(rows[1].vectorStoreId).toBe("vs-b")
  expect(await count("support_artifact_cleanup")).toBe(1)
})

test("repository refresh replaces only its tenant index and waits for indexing completion", async () => {
  await pg.exec(
    "UPDATE support_assistant SET status='queued' WHERE \"businessId\"='business-a'",
  )
  await processSupportSync()
  let rows = (
    await pg.query<{
      businessId: string
      status: string
      vectorStoreId: string
    }>(
      'SELECT "businessId",status,"vectorStoreId" FROM support_assistant ORDER BY "businessId"',
    )
  ).rows
  expect(rows[0].status).toBe("indexing")
  expect(rows[0].vectorStoreId).toBe("import-store-1")
  expect(rows[1].vectorStoreId).toBe("vs-b")
  expect(new Set(deleted)).toEqual(new Set(["vs-a", "file-a"]))
  indexState = "completed"
  await processSupportSync()
  rows = (
    await pg.query<{
      businessId: string
      status: string
      vectorStoreId: string
    }>(
      'SELECT "businessId",status,"vectorStoreId" FROM support_assistant ORDER BY "businessId"',
    )
  ).rows
  expect(rows[0].status).toBe("ready")
})
test("revocation during import cannot restore the source and leaves new artifacts for cleanup", async () => {
  await pg.exec(
    "UPDATE support_assistant SET status='queued' WHERE \"businessId\"='business-a'",
  )
  onRead = async () => {
    await pg.exec(
      'UPDATE support_assistant SET status=\'disconnected\',enabled=false,version=version+1,"syncToken"=NULL,"vectorStoreId"=NULL WHERE "businessId"=\'business-a\'',
    )
  }
  await processSupportSync()
  const row = (
    await pg.query<{ status: string; vectorStoreId: string | null }>(
      'SELECT status,"vectorStoreId" FROM support_assistant WHERE "businessId"=\'business-a\'',
    )
  ).rows[0]
  expect(row.status).toBe("disconnected")
  expect(row.vectorStoreId).toBeNull()
  expect(await count("support_artifact_cleanup")).toBe(1)
})
test("deleting an account retains remote artifact cleanup after cascades", async () => {
  await pg.exec("DELETE FROM \"user\" WHERE id='owner-a'")
  expect(await count("support_assistant")).toBe(1)
  const row = (
    await pg.query<{ vectorStoreId: string; fileId: string }>(
      'SELECT "vectorStoreId","fileId" FROM support_artifact_cleanup',
    )
  ).rows[0]
  expect(row).toEqual({ vectorStoreId: "vs-a", fileId: "file-a" })
})

test("activation requires a current preview; stale edits cannot overwrite settings", async () => {
  const settingsRoute = await import("@/app/api/businesses/[id]/support/route")
  const previewRoute =
    await import("@/app/api/businesses/[id]/support/preview/route")
  const ctx = { params: Promise.resolve({ id: "business-a" }) }
  const get = await settingsRoute.GET(new Request("http://localhost"), ctx)
  const { settings } = await get.json()
  const input = {
    version: settings.version,
    enabled: true,
    instructions: settings.instructions,
    handoffMessage: settings.handoffMessage,
    includePaths: settings.includePaths,
  }
  const patch = () =>
    settingsRoute.PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      ctx,
    )
  expect((await patch()).status).toBe(409)
  const preview = await previewRoute.POST(
    new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "How does it work?" }),
    }),
    ctx,
  )
  expect(preview.status).toBe(200)
  expect((await patch()).status).toBe(200)
  expect((await patch()).status).toBe(409)
  expect(sends.length).toBe(0)
})

test("OAuth state is bound to its user and cannot be used for another account", async () => {
  const { hashState } = await import("./github")
  const callback = await import("@/app/api/github/callback/route")
  await pg.query(
    'INSERT INTO support_github_state (id,"businessId","userId",verifier,locale,"expiresAt") VALUES ($1,$2,$3,$4,$5,$6)',
    [
      hashState("owner-b-state"),
      "business-b",
      "owner-b",
      "pkce-verifier",
      "en",
      new Date(Date.now() + 60000),
    ],
  )
  const response = await callback.GET(
    new Request(
      "http://localhost/api/github/callback?state=owner-b-state&code=fake",
    ),
  )
  expect(response.status).toBe(400)
  expect(await count("support_github_state")).toBe(1)
})
