import { expect, test } from "bun:test"
import { loginReturnTo } from "./auth-return-to"
test("login resumes only a valid localized MCP consent request", () => {
  for (const prefix of ["", "/pt", "/es"]) {
    const target = `${prefix}/mcp/authorize?request=${"x".repeat(43)}`
    expect(
      loginReturnTo(`?returnTo=${encodeURIComponent(target)}`, "/admin"),
    ).toBe(target)
  }
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "/admin?redirect=https://evil.test",
    "/mcp/authorize?request=bad",
    `/mcp/authorize?request=${"x".repeat(43)}&redirect=evil`,
  ])
    expect(
      loginReturnTo(`?returnTo=${encodeURIComponent(value)}`, "/admin"),
    ).toBe("/admin")
})
