/** Run only against an empty disposable local database. Providers are mocked. */
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "bun:test"
import { generateKeyPairSync, randomUUID } from "node:crypto"
import { and, eq, sql } from "drizzle-orm"
import { migrate } from "drizzle-orm/node-postgres/migrator"

const url = process.env.SUPPORT_TEST_DATABASE_URL
if (!url) throw new Error("Set SUPPORT_TEST_DATABASE_URL to a disposable local scorelead_support_test* database")
const parsed = new URL(url)
if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || !/^\/scorelead_support_test\w*$/.test(parsed.pathname)) throw new Error("Refusing a non-local or non-test database")
process.env.DATABASE_URL = url
process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "ab".repeat(32)
process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = "cd".repeat(32)
process.env.OPENAI_API_KEY = "test-placeholder"
process.env.META_APP_SECRET = "support-test-meta-secret"

let db: typeof import("@/lib/db").db
let pool: typeof import("@/lib/db").pool
let schema: typeof import("@/lib/db/schema")
let recordSupportInbound: typeof import("@/lib/support/ingest").recordSupportInbound
let inboundAudio: typeof import("@/lib/support/ingest").inboundAudio
let getSupportConversation: typeof import("@/lib/support/data").getSupportConversation
let listSupportConversations: typeof import("@/lib/support/data").listSupportConversations
let queueSupportTriage: typeof import("@/lib/support/queue").queueSupportTriage
let processSupportQueue: typeof import("@/lib/support/queue").processSupportQueue
let publishSupportTask: typeof import("@/lib/support/tasks").publishSupportTask
let dispatchSupportTask: typeof import("@/lib/support/tasks").dispatchSupportTask
let encryptGitHubToken: typeof import("@/lib/github/security").encryptGitHubToken
let encryptWhatsAppToken: typeof import("@/lib/whatsapp/security").encryptWhatsAppToken
let oauth: typeof import("@/lib/github/oauth")
const originalFetch = globalThis.fetch
let providerFetch = originalFetch
const forwardingFetch = ((input: RequestInfo | URL, init?: RequestInit) => providerFetch(input, init)) as typeof fetch
let businessId: string, connectionId: string
let userId: string
const proposal = { title: "Add CSV export", description: "Add an export button to the customer list.", acceptanceCriteria: ["CSV contains visible columns"], priority: "medium" as const, rationale: "A customer requested an export." }

beforeAll(async () => {
  ;({ db, pool } = await import("@/lib/db"))
  schema = await import("@/lib/db/schema")
  ;({ recordSupportInbound, inboundAudio } = await import("@/lib/support/ingest"))
  ;({ getSupportConversation, listSupportConversations } = await import("@/lib/support/data"))
  ;({ queueSupportTriage, processSupportQueue } = await import("@/lib/support/queue"))
  ;({ publishSupportTask, dispatchSupportTask } = await import("@/lib/support/tasks"))
  ;({ encryptGitHubToken } = await import("@/lib/github/security"))
  ;({ encryptWhatsAppToken } = await import("@/lib/whatsapp/security"))
  oauth = await import("@/lib/github/oauth")
  await migrate(db, { migrationsFolder: "drizzle" })
  await migrate(db, { migrationsFolder: "drizzle" })
})
beforeEach(async () => {
  globalThis.fetch = forwardingFetch
  providerFetch = originalFetch
  await db.execute(sql`truncate "user" cascade`)
  userId = randomUUID(); businessId = randomUUID(); connectionId = randomUUID()
  await db.insert(schema.user).values({ id: userId, name: "Support test", email: "support-test@example.test" })
  await db.insert(schema.subscription).values({ id: randomUUID(), referenceId: userId, plan: "growth", status: "active" })
  await db.insert(schema.business).values({ id: businessId, userId, name: "Test business" })
  await db.insert(schema.whatsappConnection).values({ id: connectionId, businessId, wabaId: "test-waba", phoneNumberId: "12345", encryptedAccessToken: encryptWhatsAppToken("test-whatsapp-token") })
})
afterEach(() => { globalThis.fetch = originalFetch; providerFetch = originalFetch })
afterAll(async () => { await pool.end() })

async function inbound(overrides: Partial<Parameters<typeof recordSupportInbound>[0]> = {}) {
  return recordSupportInbound({ connectionId, businessId, leadId: null, metaMessageId: randomUUID(), fromPhone: "+5511999990000", messageType: "text", textBody: "Can I export my customers?", receivedAt: new Date(), contactName: "Customer", media: inboundAudio({}), ...overrides })
}
async function conversation() { const [row] = await db.select().from(schema.supportConversation).where(eq(schema.supportConversation.businessId, businessId)); return row }
async function approvedTask() {
  const message = await inbound()
  const row = await conversation()
  const [task] = await db.insert(schema.supportTask).values({ id: randomUUID(), conversationId: row.id, sourceMessageId: message!.id, proposal, status: "approved", reviewedAt: new Date() }).returning()
  await db.insert(schema.githubConnection).values({ id: randomUUID(), businessId, owner: "acme", repository: "repo", defaultBranch: "main", encryptedToken: encryptGitHubToken("test-github-token", businessId), codexWorkflow: "scorelead-codex.yml" })
  return task
}

test("concurrent duplicate webhooks create one message and one conversation", async () => {
  const metaMessageId = randomUUID()
  const results = await Promise.all(Array.from({ length: 8 }, () => inbound({ metaMessageId })))
  expect(results.filter(Boolean)).toHaveLength(1)
  expect(await db.select().from(schema.whatsappInboundMessage)).toHaveLength(1)
  expect(await db.select().from(schema.supportConversation)).toHaveLength(1)
})

test("manual reply closes the displayed message, a newer message reopens it, and old events do not regress it", async () => {
  const first = await inbound({ receivedAt: new Date("2026-09-30T12:00:00Z") })
  const row = await conversation()
  await db.update(schema.supportConversation).set({ respondedThroughMessageId: first!.id }).where(eq(schema.supportConversation.id, row.id))
  expect((await listSupportConversations(businessId, connectionId, "pending", 0)).total).toBe(0)
  const next = await inbound({ receivedAt: new Date("2026-09-30T12:01:00Z") })
  expect((await listSupportConversations(businessId, connectionId, "pending", 0)).total).toBe(1)
  await inbound({ receivedAt: new Date("2026-09-30T11:59:00Z") })
  expect((await conversation()).lastMessageId).toBe(next!.id)
  const stale = await db.update(schema.supportConversation).set({ respondedThroughMessageId: first!.id }).where(and(eq(schema.supportConversation.id, row.id), eq(schema.supportConversation.lastMessageId, first!.id))).returning()
  expect(stale).toHaveLength(0)
  expect(await getSupportConversation(randomUUID(), connectionId, row.id)).toBeNull()
  expect(await getSupportConversation(businessId, randomUUID(), row.id)).toBeNull()
})

test("stores voice note identifiers without trusting the webhook download URL", async () => {
  await inbound({ messageType: "audio", textBody: null, media: inboundAudio({ type: "audio", audio: { id: "987", mime_type: "audio/ogg; codecs=opus", voice: true, url: "https://evil.test/audio" } }) })
  const [message] = await db.select().from(schema.whatsappInboundMessage)
  expect(message.mediaId).toBe("987"); expect(message.isVoiceNote).toBe(true); expect(JSON.stringify(message)).not.toContain("evil.test")
})

test("new messages during inference discard stale replies and tasks and requeue the conversation", async () => {
  await inbound()
  const row = await conversation()
  await queueSupportTriage(row.id)
  providerFetch = (async () => {
    await inbound({ textBody: "Actually, I found the export button.", receivedAt: new Date(Date.now() + 1000) })
    return Response.json({ id: "resp_test", object: "response", status: "completed", output: [{ type: "message", role: "assistant", id: "msg_test", status: "completed", content: [{ type: "output_text", annotations: [], text: JSON.stringify({ classification: "feature", summary: "Export requested", suggestedReply: "We will review it.", task: proposal }) }] }] })
  }) as unknown as typeof fetch
  await processSupportQueue({ conversationId: row.id, maxItems: 1 })
  const updated = await conversation()
  expect(updated.triageStatus).toBe("queued"); expect(updated.suggestedReply).toBeNull()
  expect(await db.select().from(schema.supportTask)).toHaveLength(0)
})

test("publishing twice concurrently creates exactly one GitHub issue", async () => {
  const task = await approvedTask()
  let requests = 0
  providerFetch = (async () => { requests++; return Response.json({ number: 17, html_url: "https://github.com/acme/repo/issues/17" }) }) as unknown as typeof fetch
  const results = await Promise.allSettled([publishSupportTask(task, businessId), publishSupportTask(task, businessId)])
  expect(requests).toBe(1); expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1)
  expect((await db.select().from(schema.supportTask))[0].status).toBe("published")
})

test("uncertain publication cannot be blindly retried and can be reconciled", async () => {
  const task = await approvedTask()
  providerFetch = (async () => { throw new Error("connection lost") }) as unknown as typeof fetch
  await expect(publishSupportTask(task, businessId)).rejects.toThrow("GITHUB_PUBLISH_UNCERTAIN")
  const [uncertain] = await db.select().from(schema.supportTask)
  expect(uncertain.status).toBe("publish_uncertain")
  await expect(publishSupportTask(uncertain, businessId)).rejects.toThrow("TASK_STATE_CHANGED")
  providerFetch = (async (url: RequestInfo | URL) => String(url).includes("/search/issues") ? Response.json({ items: [{ number: 17, html_url: "https://github.com/acme/repo/issues/17", body: `<!-- scorelead-task:${task.id} -->` }] }) : Response.json({ number: 17, html_url: "https://github.com/acme/repo/issues/17" })) as unknown as typeof fetch
  const reconciled = await publishSupportTask(uncertain, businessId, true)
  expect(reconciled.status).toBe("published"); expect(reconciled.githubIssueNumber).toBe(17)
})

test("Codex dispatch is atomic and does not claim that implementation finished", async () => {
  const task = await approvedTask()
  await db.update(schema.supportTask).set({ status: "published", githubRepository: "acme/repo", githubIssueNumber: 17, codexStatus: "not_requested" }).where(eq(schema.supportTask.id, task.id))
  const [published] = await db.select().from(schema.supportTask)
  let requests = 0
  providerFetch = (async (_url: RequestInfo | URL, init?: RequestInit) => { requests++; expect(JSON.parse(init!.body as string).inputs).toEqual({ issue_number: "17" }); return new Response(null, { status: 204 }) }) as unknown as typeof fetch
  await Promise.allSettled([dispatchSupportTask(published, businessId), dispatchSupportTask(published, businessId)])
  expect(requests).toBe(1); expect((await db.select().from(schema.supportTask))[0].codexStatus).toBe("dispatched")
})

test("audio is downloaded, transcribed and used as conversation context", async () => {
  await inbound({ messageType: "audio", textBody: null, media: inboundAudio({ type: "audio", audio: { id: "987", mime_type: "audio/ogg", voice: true } }) })
  const row = await conversation(); await queueSupportTriage(row.id)
  let analyzedText = ""
  providerFetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const target = String(url)
    if (target.includes("graph.facebook.com")) return Response.json({ url: "https://lookaside.fbsbx.com/audio", mime_type: "audio/ogg", file_size: 8 })
    if (target.includes("lookaside.fbsbx.com")) return new Response("fake-ogg")
    if (target.includes("audio/transcriptions")) return Response.json({ text: "Quero exportar meus clientes em CSV." })
    const input = JSON.parse(init!.body as string)
    analyzedText = JSON.parse(input.input[1].content).messages[0].text
    return Response.json({ id: "resp_audio", object: "response", status: "completed", output: [{ type: "message", role: "assistant", id: "msg_audio", status: "completed", content: [{ type: "output_text", annotations: [], text: JSON.stringify({ classification: "feature", summary: "CSV export requested", suggestedReply: "Vou avaliar o pedido.", task: proposal }) }] }] })
  }) as unknown as typeof fetch
  await processSupportQueue({ conversationId: row.id, maxItems: 1 })
  expect(analyzedText).toBe("Quero exportar meus clientes em CSV.")
  expect((await db.select().from(schema.whatsappInboundMessage))[0].transcript).toBe(analyzedText)
  expect((await conversation()).triageStatus).toBe("ready")
  expect(await db.select().from(schema.supportTask)).toHaveLength(1)
})

test("queue reads current repository source and saves consulted commit and files with the draft", async () => {
  const message = await inbound({ textBody: "Como adiciono novos alunos?" })
  await db.insert(schema.githubConnection).values({ id: randomUUID(), businessId, owner: "acme", repository: "repo", defaultBranch: "main", encryptedToken: encryptGitHubToken("test-github-token", businessId), contextFiles: [{ path: "README.md", sha: "old", text: "Studio app" }] })
  const row = await conversation(); await queueSupportTriage(row.id)
  const commit = "a".repeat(40), tree = "b".repeat(40), blob = "c".repeat(40)
  let inference = 0
  providerFetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const target = String(url)
    if (target.includes("api.github.com")) {
      if (target.endsWith("/repos/acme/repo")) return Response.json({ default_branch: "main" })
      if (target.includes("/git/ref/")) return Response.json({ object: { sha: commit } })
      if (target.includes("/git/commits/")) return Response.json({ sha: commit, tree: { sha: tree } })
      if (target.includes("/git/trees/")) return Response.json({ sha: tree, truncated: false, tree: [{ path: "app/students.tsx", type: "blob", mode: "100644", sha: blob, size: 100 }] })
      return Response.json({ sha: blob, encoding: "base64", content: Buffer.from('button("Convidar alunos", () => navigate("/invite-students"))').toString("base64"), size: 100 })
    }
    const input = JSON.parse(init!.body as string)
    if (inference++ === 0) {
      expect(input.tool_choice).toBe("required")
      return Response.json({ id: "resp_source", object: "response", status: "completed", output: [{ type: "function_call", id: "fc_source", call_id: "read_source", name: "read_repository_file", arguments: JSON.stringify({ path: "app/students.tsx", startLine: 1, endLine: 50 }), status: "completed" }] })
    }
    expect(JSON.stringify(input.input)).not.toContain("parsed_arguments")
    expect(input.input.find((item: { type: string }) => item.type === "function_call_output").output).toContain("Convidar alunos")
    return Response.json({ id: "resp_draft", object: "response", status: "completed", output: [{ type: "message", role: "assistant", id: "msg_draft", status: "completed", content: [{ type: "output_text", annotations: [], text: JSON.stringify({ classification: "question", summary: "Adicionar alunos por convite", suggestedReply: 'Toque em "Convidar alunos" na tela de alunos.', task: null }) }] }] })
  }) as unknown as typeof fetch
  await processSupportQueue({ conversationId: row.id, maxItems: 1 })
  const updated = await conversation()
  expect(updated.triageStatus).toBe("ready")
  expect(updated.analyzedThroughMessageId).toBe(message!.id)
  expect(updated.suggestedReply).toContain("Convidar alunos")
  expect(updated.repositoryEvidence?.commit).toBe(commit)
  expect(updated.repositoryEvidence?.files[0].path).toBe("app/students.tsx")
  expect((await listSupportConversations(businessId, connectionId, "pending", 0)).conversations[0].repositoryEvidence?.files).toHaveLength(1)
  expect(await db.select().from(schema.supportTask)).toHaveLength(0)
})

test("marking replied does not strand queued analysis in a permanent loading state", async () => {
  const message = await inbound()
  const row = await conversation(); await queueSupportTriage(row.id)
  await db.update(schema.supportConversation).set({ respondedThroughMessageId: message!.id }).where(eq(schema.supportConversation.id, row.id))
  providerFetch = (async () => Response.json({ id: "resp_replied", object: "response", status: "completed", output: [{ type: "message", role: "assistant", id: "msg_replied", status: "completed", content: [{ type: "output_text", annotations: [], text: JSON.stringify({ classification: "question", summary: "Export question", suggestedReply: "Posso ajudar com a exportação.", task: null }) }] }] })) as unknown as typeof fetch
  await processSupportQueue({ maxItems: 1 })
  expect((await conversation()).triageStatus).toBe("ready")
  expect((await listSupportConversations(businessId, connectionId, "responded", 0)).total).toBe(1)
})

test("rejected tasks remain rejected even if a later model output proposes the task again", async () => {
  const task = await approvedTask()
  await db.update(schema.supportTask).set({ status: "rejected", rejectionReason: "This feature is outside the roadmap." }).where(eq(schema.supportTask.id, task.id))
  const row = await conversation(); await queueSupportTriage(row.id)
  providerFetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    const input = JSON.parse(init!.body as string)
    expect(JSON.parse(input.input[1].content).taskDecision.reason).toBe("This feature is outside the roadmap.")
    return Response.json({ id: "resp_rejected", object: "response", status: "completed", output: [{ type: "message", role: "assistant", id: "msg_rejected", status: "completed", content: [{ type: "output_text", annotations: [], text: JSON.stringify({ classification: "feature", summary: "Feature request declined", suggestedReply: "Esse recurso não está previsto por enquanto.", task: proposal }) }] }] })
  }) as unknown as typeof fetch
  await processSupportQueue({ conversationId: row.id, maxItems: 1 })
  expect((await db.select().from(schema.supportTask))[0].status).toBe("rejected")
  expect((await conversation()).suggestedReply).toBe("Esse recurso não está previsto por enquanto.")
})

test("OAuth state is actor-bound, expires, and is consumed atomically only once", async () => {
  const key = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString()
  process.env.GITHUB_APP_PRIVATE_KEY = key; process.env.GITHUB_APP_CLIENT_ID = "test-client"; process.env.GITHUB_APP_CLIENT_SECRET = "test-secret"; process.env.GITHUB_APP_SLUG = "scorelead-test"
  const authorization = new URL(await oauth.beginGitHubConnection(userId, businessId, "pt"))
  const state = authorization.searchParams.get("state")!
  await expect(oauth.consumeGitHubState(state, randomUUID())).rejects.toThrow("GITHUB_AUTH_EXPIRED")
  const results = await Promise.allSettled([oauth.consumeGitHubState(state, userId), oauth.consumeGitHubState(state, userId)])
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1)
  const success = results.find((result) => result.status === "fulfilled") as PromiseFulfilledResult<Awaited<ReturnType<typeof oauth.consumeGitHubState>>>
  expect(success.value.businessId).toBe(businessId); expect(success.value.locale).toBe("pt")
  const expired = new URL(await oauth.beginGitHubConnection(userId, businessId, "pt"))
  await db.update(schema.githubOAuthState).set({ expiresAt: new Date(Date.now() - 1000) })
  await expect(oauth.consumeGitHubState(expired.searchParams.get("state")!, userId)).rejects.toThrow("GITHUB_AUTH_EXPIRED")
})

test("repository picker credentials remain scoped to the business and current actor", async () => {
  providerFetch = (async () => Response.json({ login: "test-owner" })) as unknown as typeof fetch
  await oauth.saveGitHubAuthorization(userId, businessId, "test-oauth-token", new Date(Date.now() + 3600000))
  const authorized = await oauth.getGitHubAuthorization(userId, businessId)
  expect(authorized?.githubLogin).toBe("test-owner")
  expect(authorized?.encryptedToken).not.toContain("test-oauth-token")
  expect(await oauth.getGitHubAuthorization(randomUUID(), businessId)).toBeNull()
  expect(await oauth.getGitHubAuthorization(userId, randomUUID())).toBeNull()
})

test("repository selection rejects forged installations and read-only repositories", async () => {
  providerFetch = (async () => Response.json({ login: "test-owner" })) as unknown as typeof fetch
  await oauth.saveGitHubAuthorization(userId, businessId, "test-oauth-token", new Date(Date.now() + 3600000))
  const authorized = (await oauth.getGitHubAuthorization(userId, businessId))!
  providerFetch = (async (url: RequestInfo | URL) => String(url).includes("/user/installations")
    ? Response.json({ total_count: 1, installations: [{ id: 42, account: { login: "acme" }, suspended_at: null }] })
    : Response.json({ id: 123, full_name: "acme/repo", archived: false, permissions: { push: false, admin: false } })) as unknown as typeof fetch
  await expect(oauth.verifyGitHubSelection(authorized, "999", "123")).rejects.toThrow("GITHUB_REPOSITORY_UNAVAILABLE")
  await expect(oauth.verifyGitHubSelection(authorized, "42", "123")).rejects.toThrow("GITHUB_REPOSITORY_READ_ONLY")
})
