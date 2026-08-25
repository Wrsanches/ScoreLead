import { describe, expect, it } from "bun:test"
import {
  getLocalizedPublicUrl,
  isProductionAnalyticsHostname,
} from "./site-urls"

describe("site URLs", () => {
  it("limits analytics to the public and application production hosts", () => {
    expect(isProductionAnalyticsHostname("scorelead.io")).toBe(true)
    expect(isProductionAnalyticsHostname("APP.SCORELEAD.IO")).toBe(true)
    expect(isProductionAnalyticsHostname("localhost")).toBe(false)
    expect(isProductionAnalyticsHostname("scorelead-testing.up.railway.app")).toBe(
      false,
    )
  })

  it("builds absolute localized public-site links", () => {
    expect(getLocalizedPublicUrl("/privacy#cookies", "en")).toBe(
      "https://scorelead.io/privacy#cookies",
    )
    expect(getLocalizedPublicUrl("/terms", "pt")).toBe(
      "https://scorelead.io/pt/terms",
    )
    expect(getLocalizedPublicUrl("/", "es")).toBe("https://scorelead.io/es")
  })
})
