import { describe, expect, it } from "bun:test"
import { generateJsonLd } from "./seo"

describe("homepage structured data", () => {
  it.each([
    ["en", "https://app.scorelead.io/signup"],
    ["pt", "https://app.scorelead.io/pt/signup"],
    ["es", "https://app.scorelead.io/es/signup"],
  ])("keeps %s signup actions valid and direct", (locale, signupUrl) => {
    const graph = generateJsonLd(locale)["@graph"] as Array<
      Record<string, unknown>
    >
    const software = graph.find(
      (item) => item["@type"] === "SoftwareApplication",
    )

    expect(software).toBeDefined()
    expect(software && "browserRequirements" in software).toBe(false)
    expect(software && "availableLanguage" in software).toBe(false)

    const offer = software?.offers as Record<string, unknown>
    const action = software?.potentialAction as Record<string, unknown>
    expect(offer.url).toBe(signupUrl)
    expect(action.target).toBe(signupUrl)
  })
})
