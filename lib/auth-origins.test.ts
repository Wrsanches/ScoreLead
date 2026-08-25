import { describe, expect, it } from "bun:test"
import {
  createTrustedAuthOrigins,
  getTrustedRequestOrigin,
} from "./auth-origins"

describe("auth origins", () => {
  it("normalizes and deduplicates configured origins", () => {
    expect(
      createTrustedAuthOrigins({
        BETTER_AUTH_URL: "http://localhost:3000/",
        SCORELEAD_PUBLIC_URL: "https://scorelead.io/path",
        SCORELEAD_APP_URL: "https://app.scorelead.io/",
      }),
    ).toEqual([
      "http://localhost:3000",
      "https://scorelead.io",
      "https://app.scorelead.io",
    ])
  })

  it("allows only exact trusted origins", () => {
    const trusted = ["https://scorelead.io", "https://app.scorelead.io"]

    expect(getTrustedRequestOrigin("https://scorelead.io", trusted)).toBe(
      "https://scorelead.io",
    )
    expect(
      getTrustedRequestOrigin("https://scorelead.io.attacker.test", trusted),
    ).toBeNull()
    expect(getTrustedRequestOrigin("null", trusted)).toBeNull()
  })
})
