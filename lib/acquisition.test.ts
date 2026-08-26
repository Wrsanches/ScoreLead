import { describe, expect, it } from "bun:test"
import { classifyAcquisition, isUnwantedReferral } from "./acquisition"

describe("acquisition classification", () => {
  it("classifies search and AI discovery traffic", () => {
    expect(
      classifyAcquisition({
        currentUrl: "https://scorelead.io/pricing",
        referrer: "https://www.google.com/search?q=scorelead",
      }),
    ).toEqual({ channel: "organic", source: "google" })

    expect(
      classifyAcquisition({
        currentUrl: "https://scorelead.io/es",
        referrer: "https://www.google.es/search?q=prospeccion+b2b",
      }),
    ).toEqual({ channel: "organic", source: "google" })

    expect(
      classifyAcquisition({
        currentUrl: "https://scorelead.io/?utm_source=chatgpt.com",
      }),
    ).toEqual({ channel: "ai", source: "chatgpt" })
  })

  it("honors explicitly tagged organic visits", () => {
    expect(
      classifyAcquisition({
        currentUrl:
          "https://scorelead.io/es?utm_source=google&utm_medium=organic",
      }),
    ).toEqual({ channel: "organic", source: "google" })
  })

  it("does not turn Stripe returns into acquisition referrals", () => {
    expect(isUnwantedReferral("https://checkout.stripe.com/c/pay/test")).toBe(
      true,
    )
    expect(
      classifyAcquisition({
        currentUrl: "https://scorelead.io/pricing?upgraded=1",
        referrer: "https://billing.stripe.com/session/test",
      }),
    ).toEqual({ channel: "direct", source: "direct" })
  })

  it("keeps ordinary third-party referrals", () => {
    expect(
      classifyAcquisition({
        currentUrl: "https://scorelead.io/tools/lead-scoring-calculator",
        referrer: "https://partner.example/resources",
      }),
    ).toEqual({ channel: "referral", source: "partner.example" })
  })
})
