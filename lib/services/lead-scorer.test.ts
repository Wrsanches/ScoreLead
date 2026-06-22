import { test, expect, describe } from "bun:test"
import { getLeadScoreBreakdown, type ScoringICP } from "./lead-scorer"

// A solid, well-enriched dental clinic lead used across the fit tests.
const dentalLead = {
  name: "Bright Smile Dental Clinic",
  website: "https://brightsmile.com",
  email: "hello@brightsmile.com",
  phone: "+1 555 123 4567",
  googleRating: 4.7,
  googleReviewCount: 120,
  services: ["teeth whitening", "dental implants", "orthodontics"],
  description:
    "A family dental clinic offering cosmetic dentistry, implants and orthodontic care for patients of all ages.",
  businessCategory: "dental clinic",
  aiSummary: "Established dental practice with a full cosmetic offering.",
  firecrawlEnriched: true,
  city: "Austin",
  state: "Texas",
  country: "USA",
}

describe("getLeadScoreBreakdown - backward compatibility", () => {
  test("no ICP leaves fit neutral and matches absolute-quality behaviour", () => {
    const b = getLeadScoreBreakdown(dentalLead)
    expect(b.categories.fit).toBe(0)
    // Score should still be a strong lead on quality signals alone.
    expect(b.score).toBeGreaterThanOrEqual(4)
  })

  test("score is clamped to the 1-5 range", () => {
    const empty = getLeadScoreBreakdown({})
    expect(empty.score).toBeGreaterThanOrEqual(1)
    expect(empty.score).toBeLessThanOrEqual(5)
  })
})

describe("getLeadScoreBreakdown - ICP relativity", () => {
  // A dental-supply company: the dental clinic is a great-fit customer.
  const dentalSupplyICP: ScoringICP = {
    field: "dental supplies",
    category: "wholesale",
    clientPersona:
      "dental clinics and orthodontic practices that buy implants and whitening equipment",
    services: "dental implants, whitening kits, orthodontic tools",
    serviceArea: "national",
    location: "USA",
  }

  // A wedding photographer: a dental clinic is a poor-fit customer.
  const photographyICP: ScoringICP = {
    field: "photography",
    category: "creative",
    clientPersona: "couples planning weddings and engagement shoots",
    services: "wedding photography, engagement sessions, albums",
    serviceArea: "national",
    location: "USA",
  }

  test("same lead scores differently across two ICPs", () => {
    const onTarget = getLeadScoreBreakdown(dentalLead, dentalSupplyICP)
    const offTarget = getLeadScoreBreakdown(dentalLead, photographyICP)

    expect(onTarget.categories.fit).toBeGreaterThan(offTarget.categories.fit)
    expect(onTarget.score).toBeGreaterThan(offTarget.score)
  })

  test("strong ICP overlap produces a strong-match positive signal", () => {
    const b = getLeadScoreBreakdown(dentalLead, dentalSupplyICP)
    expect(b.positives.some((s) => s.label === "Strong ICP match")).toBe(true)
    expect(b.categories.fit).toBeGreaterThanOrEqual(2)
  })

  test("off-ICP lead earns an Outside ICP risk", () => {
    const b = getLeadScoreBreakdown(dentalLead, photographyICP)
    expect(b.risks.some((s) => s.label === "Outside ICP")).toBe(true)
  })
})

describe("getLeadScoreBreakdown - graded relevance", () => {
  const icp: ScoringICP = {
    clientPersona: "dental clinics buying equipment",
    field: "dental supplies",
    serviceArea: "national",
  }

  test("high relevanceScore lifts the fit category", () => {
    const high = getLeadScoreBreakdown({ ...dentalLead, relevanceScore: 0.9 }, icp)
    const low = getLeadScoreBreakdown({ ...dentalLead, relevanceScore: 0.3 }, icp)
    expect(high.categories.fit).toBeGreaterThan(low.categories.fit)
    expect(high.positives.some((s) => s.label === "High relevance")).toBe(true)
    expect(low.risks.some((s) => s.label === "Low relevance")).toBe(true)
  })
})

describe("getLeadScoreBreakdown - service area", () => {
  const localICP: ScoringICP = {
    clientPersona: "dental clinics buying equipment",
    field: "dental supplies",
    serviceArea: "local",
    location: "Austin, Texas, USA",
  }

  test("in-area lead is rewarded, out-of-area local lead is penalised", () => {
    const inArea = getLeadScoreBreakdown(dentalLead, localICP)
    const outArea = getLeadScoreBreakdown(
      { ...dentalLead, city: "Miami", state: "Florida" },
      localICP,
    )
    expect(inArea.positives.some((s) => s.label === "In service area")).toBe(true)
    expect(outArea.risks.some((s) => s.label === "Outside service area")).toBe(true)
  })
})

describe("getLeadScoreBreakdown - firmographic signals (Apollo)", () => {
  const icp: ScoringICP = {
    clientPersona: "dental clinics buying equipment",
    field: "dental supplies",
    serviceArea: "national",
  }

  test("verified email adds a reach signal beyond a plain email", () => {
    const verified = getLeadScoreBreakdown({ ...dentalLead, emailVerified: true }, icp)
    const plain = getLeadScoreBreakdown({ ...dentalLead, emailVerified: false }, icp)
    expect(verified.positives.some((s) => s.label === "Verified email")).toBe(true)
    expect(verified.categories.reach).toBeGreaterThanOrEqual(plain.categories.reach)
  })

  test("company-size fit rewards a small lead for an SMB-targeting ICP", () => {
    const smbICP: ScoringICP = { ...icp, clientPersona: "small business and startup dental clinics" }
    const small = getLeadScoreBreakdown({ ...dentalLead, employeeCount: 12 }, smbICP)
    const large = getLeadScoreBreakdown({ ...dentalLead, employeeCount: 4000 }, smbICP)
    expect(small.positives.some((s) => s.label === "Company size fit")).toBe(true)
    expect(large.positives.some((s) => s.label === "Company size fit")).toBe(false)
  })

  test("Apollo industry/techStack feed the ICP fit match", () => {
    const sparse = { name: "Acme Co", website: "https://acme.com" }
    const withFirmo = {
      ...sparse,
      industry: "dental supplies",
      techStack: ["dental implants", "whitening", "orthodontic"],
    }
    const a = getLeadScoreBreakdown(sparse, icp)
    const b = getLeadScoreBreakdown(withFirmo, icp)
    expect(b.categories.fit).toBeGreaterThan(a.categories.fit)
  })
})

describe("getLeadScoreBreakdown - competitor guard", () => {
  test("a lead matching a listed competitor name earns a competitor risk", () => {
    const icp: ScoringICP = {
      clientPersona: "dental clinics buying equipment",
      field: "dental supplies",
      competitors: "Bright Smile Dental Clinic, Pearly Whites Inc",
      serviceArea: "national",
    }
    const b = getLeadScoreBreakdown(dentalLead, icp)
    expect(b.risks.some((s) => s.label === "Looks like a competitor")).toBe(true)
  })
})
