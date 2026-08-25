import { describe, expect, it } from "bun:test"
import {
  getAuthClientBaseUrl,
  getLocalizedAppPath,
  getLocalizedAppUrl,
  getLocalizedPublicPath,
  getLocalizedPublicUrl,
  getPublicSiteLinkHref,
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

  it("keeps public links on localhost and preview deployments", () => {
    expect(getLocalizedPublicPath("/", "en")).toBe("/")
    expect(getPublicSiteLinkHref("/", "en", "http://localhost:3000")).toBe(
      "/",
    )
    expect(
      getPublicSiteLinkHref(
        "/privacy#cookies",
        "pt",
        "https://scorelead-preview.up.railway.app",
      ),
    ).toBe("/pt/privacy#cookies")
  })

  it("keeps production app links pointed at the canonical public host", () => {
    expect(
      getPublicSiteLinkHref("/", "en", "https://app.scorelead.io"),
    ).toBe("https://scorelead.io")
  })

  it("builds relative app paths for same-deployment navigation", () => {
    expect(getLocalizedAppPath("/login", "en")).toBe("/login")
    expect(getLocalizedAppPath("admin", "pt")).toBe("/pt/admin")
  })

  it("still builds absolute app URLs for non-browser destinations", () => {
    expect(getLocalizedAppUrl("/login", "es")).toBe(
      "https://app.scorelead.io/es/login",
    )
  })

  it("keeps auth on localhost and preview deployment origins", () => {
    expect(getAuthClientBaseUrl("http://localhost:3000")).toBe(
      "http://localhost:3000",
    )
    expect(
      getAuthClientBaseUrl("https://scorelead-preview.up.railway.app"),
    ).toBe("https://scorelead-preview.up.railway.app")
  })

  it("uses the app host for auth requests from the production public site", () => {
    expect(getAuthClientBaseUrl("https://scorelead.io")).toBe(
      "https://app.scorelead.io",
    )
  })
})
