import { describe, expect, it } from "bun:test"
import {
  getHostRedirect,
  getHostname,
  getRouteRoot,
  isAppPath,
} from "./host-routing"

const hosts = {
  publicUrl: "https://scorelead.io",
  appUrl: "https://app.scorelead.io",
}

describe("host routing", () => {
  it("recognizes localized and unlocalized product paths", () => {
    expect(getRouteRoot("/pt/signup")).toBe("signup")
    expect(isAppPath("/admin/business/123")).toBe(true)
    expect(isAppPath("/es/onboarding")).toBe(true)
    expect(isAppPath("/pricing")).toBe(false)
  })

  it("normalizes forwarded host values", () => {
    expect(getHostname("APP.SCORELEAD.IO:443, proxy.internal")).toBe(
      "app.scorelead.io",
    )
  })

  it("moves legacy product paths from the public host to the app host", () => {
    expect(
      getHostRedirect({
        ...hosts,
        hostname: "scorelead.io",
        pathname: "/pt/signup",
        search: "?utm_source=google",
      }),
    ).toBe("https://app.scorelead.io/pt/signup?utm_source=google")
  })

  it("moves public pages from the app host back to the canonical host", () => {
    expect(
      getHostRedirect({
        ...hosts,
        hostname: "app.scorelead.io",
        pathname: "/pricing",
        search: "",
      }),
    ).toBe("https://scorelead.io/pricing")
  })

  it("sends each localized app root to its dashboard", () => {
    expect(
      getHostRedirect({
        ...hosts,
        hostname: "app.scorelead.io",
        pathname: "/es",
        search: "",
      }),
    ).toBe("https://app.scorelead.io/es/admin")
  })

  it("does not redirect product paths already on the app host", () => {
    expect(
      getHostRedirect({
        ...hosts,
        hostname: "app.scorelead.io",
        pathname: "/login",
        search: "",
      }),
    ).toBeNull()
  })
})
