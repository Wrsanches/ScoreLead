import { describe, expect, test } from "bun:test"
import {
  allowedKnowledgePath,
  hasSensitiveContent,
  repositoryName,
  supportSettingsInput,
  withinServiceWindow,
} from "./policy"

describe("customer repository context", () => {
  test("only reads explicitly selected files or descendants", () => {
    expect(allowedKnowledgePath("README.md", ["README.md", "docs/"])).toBe(true)
    expect(allowedKnowledgePath("docs/use/payments.md", ["docs/"])).toBe(true)
    expect(allowedKnowledgePath("src/payments.ts", ["docs/"])).toBe(false)
    expect(allowedKnowledgePath("src/payments.ts", ["src/"])).toBe(true)
    expect(allowedKnowledgePath("docs-other/file.md", ["docs/"])).toBe(false)
  })
  test("excludes secret, dependency, instruction, binary and traversal paths", () => {
    for (const path of [
      ".env",
      ".env.local",
      "src/.env.local",
      "src/private-key.ts",
      "src/credentials.ts",
      "src/node_modules/lib.ts",
      "docs/AGENTS.md",
      "docs/passwords.txt",
      "docs/image.png",
      "docs/../private.md",
      "docs/.hidden.md",
      "src/tests/key.ts",
    ]) {
      expect(allowedKnowledgePath(path, ["src/", "docs/", path])).toBe(false)
    }
  })
  test("rejects source files with embedded credentials", () => {
    expect(
      hasSensitiveContent('const apiKey = "super-secret-production-value"'),
    ).toBe(true)
    expect(hasSensitiveContent("-----BEGIN PRIVATE KEY-----")).toBe(true)
    expect(hasSensitiveContent("const key = process.env.OPENAI_API_KEY")).toBe(
      false,
    )
  })
  test("rejects unsafe repository names and prefix configuration", () => {
    for (const name of [
      "../repo",
      "owner/..",
      "https://github.com/owner/repo",
      "owner/repo?token=x",
      "owner/repo/extra",
    ])
      expect(repositoryName.safeParse(name).success).toBe(false)
    expect(repositoryName.safeParse("customer/product-app").success).toBe(true)
    for (const path of [
      "/etc/passwd",
      "../docs/",
      "src/**",
      "src\\foo",
      "src/\nsecret",
    ]) {
      expect(
        supportSettingsInput.safeParse({
          version: 1,
          enabled: false,
          instructions: "",
          handoffMessage: "Contact support",
          includePaths: [path],
        }).success,
      ).toBe(false)
    }
  })
})
test("free-form replies require an unexpired service window and a send margin", () => {
  const now = new Date("2026-09-12T12:00:00Z")
  expect(withinServiceWindow(new Date("2026-09-12T11:00:00Z"), now)).toBe(true)
  expect(withinServiceWindow(new Date("2026-09-11T12:00:30Z"), now)).toBe(false)
  expect(withinServiceWindow(new Date("2026-09-11T11:00:00Z"), now)).toBe(false)
  expect(withinServiceWindow(new Date("2026-09-12T13:00:00Z"), now)).toBe(false)
})
