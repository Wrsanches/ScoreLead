import { test, expect, describe } from "bun:test"
import {
  parseRelevanceScore,
  RELEVANCE_DROP_FLOOR,
  extractFromSearchResults,
} from "./lead-extractor"

describe("extractFromSearchResults (snippet mining, no AI)", () => {
  // The Ateliê Diana case: a Google Places lead with no website, but rich data
  // sitting in the search snippets + social URLs.
  const results = [
    {
      title: "Ateliê DiAna Ceramistas (@dianaceramistas)",
      description:
        "aulas de cerâmica em Curitiba! peças sob encomenda R. Des. Antônio de Paula, 3374, LJ 2, Boqueirão. Contato via WhatsApp.",
      url: "https://www.instagram.com/dianaceramistas/reels",
    },
    {
      title: "Diana Cerâmicas | Curitiba PR",
      description: "No ateliê o trabalho nunca para! #ceramicacuritiba #auladeceramica",
      url: "https://www.facebook.com/dianaceramistas",
    },
  ]

  test("pulls the Instagram handle and social URLs from result URLs", async () => {
    const data = await extractFromSearchResults(results, { runAI: false })
    expect(data.instagramHandle).toBe("dianaceramistas")
    expect(data.socialMedia?.instagram).toContain("instagram.com/dianaceramistas")
    expect(data.socialMedia?.facebook).toContain("facebook.com/dianaceramistas")
  })

  test("returns nothing for an empty result set", async () => {
    const data = await extractFromSearchResults([], { runAI: false })
    expect(data).toEqual({})
  })
})

describe("parseRelevanceScore", () => {
  test("reads a numeric score", () => {
    expect(parseRelevanceScore({ relevanceScore: 0.7 })).toBe(0.7)
  })

  test("parses a numeric string", () => {
    expect(parseRelevanceScore({ relevanceScore: "0.4" })).toBe(0.4)
  })

  test("clamps out-of-range values", () => {
    expect(parseRelevanceScore({ relevanceScore: 1.8 })).toBe(1)
    expect(parseRelevanceScore({ relevanceScore: -0.5 })).toBe(0)
  })

  test("falls back to the legacy boolean flag", () => {
    expect(parseRelevanceScore({ relevant: true })).toBe(1)
    expect(parseRelevanceScore({ relevant: false })).toBe(0)
  })

  test("defaults to a passing 1.0 when nothing usable is present", () => {
    expect(parseRelevanceScore({})).toBe(1)
    expect(parseRelevanceScore({ relevanceScore: "not a number" })).toBe(1)
  })

  test("drop floor sits below the legacy true value", () => {
    expect(RELEVANCE_DROP_FLOOR).toBeLessThan(1)
    expect(parseRelevanceScore({ relevant: false })).toBeLessThan(RELEVANCE_DROP_FLOOR)
  })
})
