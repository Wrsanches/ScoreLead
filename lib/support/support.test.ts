import { afterEach, expect, test } from "bun:test"
import OpenAI from "openai"
import { contextPathSchema, githubSettingsSchema, parseGitHubRepository } from "@/lib/github/contracts"
import { GitHubError, githubRequest, buildTaskIssue, loadGitHubContext } from "@/lib/github/client"
import { encryptGitHubToken, decryptGitHubToken } from "@/lib/github/security"
import { readLimitedBody } from "@/lib/integrations/http"
import { supportTriageSchema, isConversationPending } from "@/lib/support/contracts"
import { generateSupportTriage, transcribeSupportAudio, transcriptionFilename } from "@/lib/support/ai"
import { isWhatsAppMediaUrl } from "@/lib/whatsapp/meta"

const originalFetch = globalThis.fetch
const originalKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY
afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalKey === undefined) delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY
  else process.env.GITHUB_TOKEN_ENCRYPTION_KEY = originalKey
})

const proposal = { title: "Fix export", description: "CSV export fails on accented names.", acceptanceCriteria: ["Accented names export correctly"], priority: "medium" as const, rationale: "Customer reported reproducible export failure." }

test("limits repository references and selected context paths", () => {
  expect(parseGitHubRepository("https://github.com/acme/product.git")).toEqual({ owner: "acme", repository: "product" })
  for (const value of ["https://github.com.evil.test/acme/repo", "http://localhost/acme/repo", "acme/repo/issues", "acme/..", "https://github.com/user:token@acme/repo"]) expect(parseGitHubRepository(value)).toBeNull()
  for (const value of ["../README.md", ".env", "docs/.secret.md", "docs/%2e%2e/README.md", "docs/a\n.md", "docs//README.md"]) expect(contextPathSchema.safeParse(value).success).toBe(false)
  expect(contextPathSchema.safeParse("docs/support.md").success).toBe(true)
  expect(githubSettingsSchema.safeParse({ repository: "acme/repo", contextPaths: ["README.md", "README.md"] }).success).toBe(false)
})

test("GitHub credentials are bound to the business and authenticated", () => {
  process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "ab".repeat(32)
  const encrypted = encryptGitHubToken("test-token", "business-a")
  expect(encrypted).not.toContain("test-token")
  expect(decryptGitHubToken(encrypted, "business-a")).toBe("test-token")
  expect(() => decryptGitHubToken(encrypted, "business-b")).toThrow()
  const parts = encrypted.split("."); parts[2] = "aa".repeat(12)
  expect(() => decryptGitHubToken(parts.join("."), "business-a")).toThrow()
})

test("manual replied state is invalidated by a new inbound message", () => {
  expect(isConversationPending("new", null)).toBe(true)
  expect(isConversationPending("old", "old")).toBe(false)
  expect(isConversationPending("new", "old")).toBe(true)
})

test("media credentials cannot be forwarded to arbitrary hosts or redirects", () => {
  expect(isWhatsAppMediaUrl("https://lookaside.fbsbx.com/whatsapp_business/audio")).toBe(true)
  for (const url of ["http://lookaside.fbsbx.com/a", "https://lookaside.fbsbx.com.evil.test/a", "https://127.0.0.1/a", "https://user@lookaside.fbsbx.com/a", "https://lookaside.fbsbx.com:8443/a"]) expect(isWhatsAppMediaUrl(url)).toBe(false)
})

test("bounded downloads reject chunked payloads before buffering the whole response", async () => {
  let canceled = false
  const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(5)); controller.enqueue(new Uint8Array(5)) }, cancel() { canceled = true } }))
  await expect(readLimitedBody(response, 6)).rejects.toThrow("PAYLOAD_TOO_LARGE")
  expect(canceled).toBe(true)
})

test("uncertain GitHub POST failures are distinguishable from rejected requests", async () => {
  globalThis.fetch = (async () => { throw new Error("timeout") }) as unknown as typeof fetch
  try { await githubRequest("test-token", "/repos/acme/repo/issues", { method: "POST", body: "{}" }); throw new Error("expected failure") }
  catch (error) { expect(error).toBeInstanceOf(GitHubError); expect((error as GitHubError).uncertain).toBe(true) }
  globalThis.fetch = (async () => new Response("{}", { status: 403 })) as unknown as typeof fetch
  try { await githubRequest("test-token", "/repos/acme/repo/issues", { method: "POST", body: "{}" }); throw new Error("expected failure") }
  catch (error) { expect((error as GitHubError).uncertain).toBe(false); expect((error as GitHubError).code).toBe("GITHUB_PERMISSION_DENIED") }
})

test("project context limits count UTF-8 bytes for multilingual documentation", async () => {
  const text = "á".repeat(35000)
  globalThis.fetch = (async (url: RequestInfo | URL) => String(url).includes("/contents/")
    ? Response.json({ type: "file", size: Buffer.byteLength(text), encoding: "base64", content: Buffer.from(text).toString("base64"), sha: "test-sha" })
    : Response.json({ default_branch: "main", full_name: "acme/repo", has_issues: true })) as unknown as typeof fetch
  await expect(loadGitHubContext("test-token", "acme", "repo", ["README.md", "docs/product.md"])).rejects.toThrow("GITHUB_CONTEXT_TOO_LARGE")
})

test("voice notes are submitted as OGG to transcription and retain their text", async () => {
  let filename = ""
  const api = { audio: { transcriptions: { create: async (input: { file: File; response_format: string }) => { filename = input.file.name; expect(input.response_format).toBe("json"); return { text: " Quero exportar os dados. " } } } } } as unknown as OpenAI
  expect(await transcribeSupportAudio(Buffer.from("fake-ogg"), "audio/ogg; codecs=opus", api)).toBe("Quero exportar os dados.")
  expect(filename).toBe("voice-note.ogg")
  expect(transcriptionFilename("audio/amr")).toBeNull()
  await expect(transcribeSupportAudio(Buffer.from("fake-amr"), "audio/amr", api)).rejects.toThrow("AUDIO_FORMAT_UNSUPPORTED")
})

test("triage uses structured output and treats repository files and customers as untrusted sources", async () => {
  let instructions = ""
  const api = { responses: { parse: async (input: { store: boolean; input: { content: string }[] }) => {
    expect(input.store).toBe(false); instructions = input.input[0].content
    return { output_parsed: { classification: "bug", summary: "Export failed", suggestedReply: "Can you share the error?", task: proposal } }
  } } } as unknown as OpenAI
  const result = await generateSupportTriage({ businessProfile: { name: "Test" }, projectNotes: "", repository: "acme/repo", contextFiles: [], messages: [], taskDecision: null }, api)
  expect(result.task?.title).toBe("Fix export")
  expect(instructions).toContain("untrusted source material")
  expect(instructions).toContain("If rejected, task must be null")
  expect(supportTriageSchema.safeParse({ ...result, task: { ...proposal, acceptanceCriteria: [] } }).success).toBe(false)
  expect(buildTaskIssue("task-123", proposal)).toContain("<!-- scorelead-task:task-123 -->")
})
