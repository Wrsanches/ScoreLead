import { afterEach, expect, test } from "bun:test"
import OpenAI from "openai"
import { RepositoryContext, isRepositoryContextPath, redactRepositorySecrets } from "@/lib/github/repository-context"
import { generateSupportTriage } from "@/lib/support/ai"

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const commit = "a".repeat(40), treeSha = "b".repeat(40), sourceSha = "c".repeat(40), localeSha = "d".repeat(40)
const code = 'export function Students() { return <button onClick={() => navigate("/invite-students")}>{t("students.invite")}</button> }'
const locale = '{"students":{"invite":"Convidar alunos"}}'
const calls: string[] = []
function repositoryFetch(truncated = false) {
  calls.length = 0
  globalThis.fetch = (async (url: RequestInfo | URL) => {
    const path = new URL(String(url)).pathname
    calls.push(path)
    if (path.endsWith("/product")) return Response.json({ default_branch: "release/support" })
    if (path.includes("/git/ref/heads/")) return Response.json({ object: { sha: commit } })
    if (path.endsWith(`/git/commits/${commit}`)) return Response.json({ sha: commit, tree: { sha: treeSha } })
    if (path.endsWith(`/git/blobs/${sourceSha}`)) return Response.json({ sha: sourceSha, size: code.length, encoding: "base64", content: Buffer.from(code).toString("base64") })
    if (path.endsWith(`/git/blobs/${localeSha}`)) return Response.json({ sha: localeSha, size: locale.length, encoding: "base64", content: Buffer.from(locale).toString("base64") })
    if (path.endsWith(`/git/trees/${treeSha}`)) return Response.json({ sha: treeSha, truncated, tree: [
      { path: "app/students.tsx", sha: sourceSha, type: "blob", mode: "100644", size: code.length },
      { path: "locales/pt.json", sha: localeSha, type: "blob", mode: "100644", size: locale.length },
      { path: ".env", sha: sourceSha, type: "blob", mode: "100644", size: 100 },
      { path: "linked.ts", sha: sourceSha, type: "blob", mode: "120000", size: 100 },
    ] })
    throw new Error(`Unexpected request: ${path}`)
  }) as typeof fetch
}

test("repo context spans code and translations, pins a current commit, and reads only scoped blobs", async () => {
  repositoryFetch()
  const context = await RepositoryContext.open("repo-scoped-token", "acme", "product", "old-branch")
  expect(context.overview().branch).toBe("release/support")
  expect(context.overview().commit).toBe(commit)
  expect((await context.call("find_repository_files", { query: "student|aluno", offset: 0 }) as { paths: string[] }).paths).toEqual(["app/students.tsx"])
  const source = await context.call("read_repository_file", { path: "app/students.tsx", startLine: 1, endLine: 100 }) as { text: string }
  expect(source.text).toContain('/invite-students')
  const translation = await context.call("search_repository_file", { path: "locales/pt.json", query: "invite" }) as { snippets: { text: string }[] }
  expect(translation.snippets[0].text).toContain("Convidar alunos")
  expect(context.evidence.files.map((f) => f.sha)).toEqual([sourceSha, localeSha])
  expect(calls.every((p) => p.startsWith("/repos/acme/product/" ) || p === "/repos/acme/product")).toBe(true)
  expect(calls).toContain("/repos/acme/product/git/ref/heads/release%2Fsupport")
  // A second lookup resolves the branch again instead of reusing an old project snapshot.
  await RepositoryContext.open("other-business-token", "acme", "product", "old-branch")
  expect(calls.filter((p) => p.includes("/git/ref/")).length).toBe(2)
})

test("secrets, traversal, symlinks, dependencies and binary files never reach model tools", async () => {
  for (const path of [".env", ".env.local", "config/credentials.json", "service-account.json", "private-key.txt", "GoogleService-Info.plist", "node_modules/a.ts", "vendor/a.py", "a.png", "../secret.ts", "/app/a.ts", "app/../../a.ts", "app\\a.ts", "app/a\n.ts", "yarn.lock", "a.min.js"]) expect(isRepositoryContextPath(path)).toBe(false)
  for (const path of ["app/students.tsx", "locales/pt.json", "server/invoices.py", "backend/schema.prisma", ".github/workflows/build.yml"]) expect(isRepositoryContextPath(path)).toBe(true)
  repositoryFetch()
  const context = await RepositoryContext.open("token", "acme", "product", "main")
  const initial = calls.length
  for (const path of [".env", "../secret.ts", "linked.ts", "https://evil.test/token.ts"]) expect(await context.call("read_repository_file", { path, startLine: 1, endLine: 5 })).toHaveProperty("error")
  expect(calls.length).toBe(initial)
  const secret = 'ghp_' + 'a'.repeat(30)
  const text = redactRepositorySecrets(`const password = "secret-value";\nconst x = "${secret}";\n-----BEGIN RSA PRIVATE KEY-----\nsensitive\n-----END RSA PRIVATE KEY-----`)
  expect(text).not.toContain("secret-value"); expect(text).not.toContain(secret); expect(text).not.toContain("sensitive")
})

test("incomplete tree indices are disclosed and repository operations are bounded", async () => {
  repositoryFetch(true)
  const context = await RepositoryContext.open("token", "acme", "product", "main")
  expect(context.overview().indexComplete).toBe(false)
  for (let i = 0; i < 25; i++) await context.call("find_repository_files", { query: "", offset: 0 })
  expect(context.evidence.status).toBe("partial")
  expect(context.evidence.errorCode).toBe("GITHUB_CONTEXT_BUDGET")
})

test("truncated indices can browse and read files not present in the recursive index", async () => {
  const folderSha = "e".repeat(40)
  const requests: string[] = []
  globalThis.fetch = (async (url: RequestInfo | URL) => {
    const parsed = new URL(String(url)); requests.push(parsed.pathname)
    if (parsed.pathname.endsWith("/product")) return Response.json({ default_branch: "main" })
    if (parsed.pathname.includes("/git/ref/")) return Response.json({ object: { sha: commit } })
    if (parsed.pathname.includes("/git/commits/")) return Response.json({ sha: commit, tree: { sha: treeSha } })
    if (parsed.pathname.endsWith(`/git/trees/${treeSha}`)) return Response.json({ sha: treeSha, truncated: parsed.searchParams.has("recursive"), tree: [{ path: "screens", sha: folderSha, type: "tree", mode: "040000" }] })
    if (parsed.pathname.endsWith(`/git/trees/${folderSha}`)) return Response.json({ sha: folderSha, truncated: false, tree: [{ path: "students.tsx", sha: sourceSha, type: "blob", mode: "100644", size: code.length }] })
    return Response.json({ sha: sourceSha, encoding: "base64", content: Buffer.from(code).toString("base64"), size: code.length })
  }) as typeof fetch
  const context = await RepositoryContext.open("token", "acme", "product", "main")
  expect(await context.call("find_repository_files", { query: "students", offset: 0 })).toHaveProperty("total", 0)
  expect(await context.call("list_repository_directory", { path: "screens", offset: 0 })).toHaveProperty("entries", [{ path: "screens/students.tsx", type: "blob" }])
  expect(await context.call("read_repository_file", { path: "screens/students.tsx", startLine: 1, endLine: 50 })).toHaveProperty("text", expect.stringContaining("/invite-students"))
  expect(requests).toContain(`/repos/acme/product/git/trees/${folderSha}`)
  expect(context.evidence.files[0].path).toBe("screens/students.tsx")
})

test("content search reads relevant regions of large minified translation files", async () => {
  repositoryFetch()
  const fixtureFetch = globalThis.fetch
  const minified = JSON.stringify({ padding: "x".repeat(50000), invite: "Convidar alunos" })
  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => String(url).endsWith(`/git/blobs/${localeSha}`)
    ? Response.json({ sha: localeSha, encoding: "base64", content: Buffer.from(minified).toString("base64"), size: minified.length })
    : fixtureFetch(url, init)) as typeof fetch
  const context = await RepositoryContext.open("token", "acme", "product", "main")
  const result = await context.call("search_repository_file", { path: "locales/pt.json", query: "invite" }) as { snippets: { text: string; startLine: number; truncated: boolean }[] }
  expect(result.snippets[0].text).toContain("Convidar alunos")
  expect(result.snippets[0].text.length).toBeLessThan(10000)
  expect(result.snippets[0].startLine).toBe(1)
  expect(result.snippets[0].truncated).toBe(true)
})

test("repository permission failures are sanitized and recorded for the owner", async () => {
  repositoryFetch()
  const fixtureFetch = globalThis.fetch
  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => String(url).includes("/git/blobs/")
    ? new Response("sensitive provider body", { status: 403 }) : fixtureFetch(url, init)) as typeof fetch
  const context = await RepositoryContext.open("token", "acme", "product", "main")
  expect(await context.call("read_repository_file", { path: "app/students.tsx", startLine: 1, endLine: 50 })).toEqual({ error: "GITHUB_PERMISSION_DENIED" })
  expect(context.evidence.status).toBe("partial")
  expect(context.evidence.files).toHaveLength(0)
})

test("triage reads product source missing from the README and carries tool evidence into its draft", async () => {
  repositoryFetch()
  const context = await RepositoryContext.open("token", "acme", "product", "main")
  let round = 0
  const api = { responses: { parse: async (input: { store: boolean; tool_choice: string; include: string[]; input: { type?: string; output?: string; content?: string }[] }) => {
    expect(input.store).toBe(false)
    expect(input.include).toContain("reasoning.encrypted_content")
    if (round++ === 0) {
      expect(input.tool_choice).toBe("required")
      return { output: [
        { type: "reasoning", id: "reasoning_1", summary: [], encrypted_content: "encrypted" },
        { type: "function_call", call_id: "read_screen", name: "read_repository_file", parsed_arguments: { path: "app/students.tsx" }, arguments: JSON.stringify({ path: "app/students.tsx", startLine: 1, endLine: 100 }) },
        { type: "function_call", call_id: "read_locale", name: "search_repository_file", arguments: JSON.stringify({ path: "locales/pt.json", query: "invite" }) },
      ], output_parsed: null }
    }
    expect(input.input.some((item) => item.type === "reasoning")).toBe(true)
    expect(JSON.stringify(input.input)).not.toContain("parsed_arguments")
    const outputs = input.input.filter((item) => item.type === "function_call_output").map((item) => item.output).join("\n")
    expect(outputs).toContain("/invite-students"); expect(outputs).toContain("Convidar alunos")
    return { output: [], output_parsed: { classification: "question", summary: "Cadastro de alunos por convite", suggestedReply: 'Na tela de alunos, toque em "Convidar alunos".', task: null } }
  } } } as unknown as OpenAI
  const triage = await generateSupportTriage({ businessProfile: { name: "Ceramik" }, projectNotes: "", repository: "acme/product", contextFiles: [{ path: "README.md", sha: "old", text: "Ceramic studio app" }], messages: [{ type: "text", text: "Como adiciono alunos?", receivedAt: new Date().toISOString() }], taskDecision: null }, api, context)
  expect(triage.classification).toBe("question"); expect(triage.task).toBeNull(); expect(triage.suggestedReply).toContain("Convidar alunos")
  expect(context.evidence.files).toHaveLength(2)
})
