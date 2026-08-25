import { describe, expect, it } from "bun:test"
import { isProductionAnalyticsHostname } from "./site-urls"

describe("site URLs", () => {
  it("limits analytics to the public and application production hosts", () => {
    expect(isProductionAnalyticsHostname("scorelead.io")).toBe(true)
    expect(isProductionAnalyticsHostname("APP.SCORELEAD.IO")).toBe(true)
    expect(isProductionAnalyticsHostname("localhost")).toBe(false)
    expect(isProductionAnalyticsHostname("scorelead-testing.up.railway.app")).toBe(
      false,
    )
  })
})
