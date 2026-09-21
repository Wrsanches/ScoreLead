import { describe, expect, it } from "bun:test"
import { calculateLeadScore, toCsv } from "./tool-model"

describe("lead scoring model", () => {
  it("normalizes relative weights and applies disqualifiers before prioritization", () => {
    const inputs = [{ score: 90, weight: 4 }, { score: 40, weight: 1 }]
    expect(calculateLeadScore(inputs)).toEqual({ score: 80, status: "priority" })
    expect(calculateLeadScore(inputs, true)).toEqual({ score: 80, status: "disqualified" })
    expect(calculateLeadScore(inputs.map((row) => ({ ...row, weight: row.weight * 10 })))).toEqual(calculateLeadScore(inputs))
  })
  it("does not present an invalid or empty model as a zero score", () => {
    for (const inputs of [[], [{ score: 50, weight: 0 }], [{ score: 50, weight: NaN }], [{ score: 101, weight: 20 }], [{ score: 50, weight: -1 }]]) {
      expect(calculateLeadScore(inputs).status).toBe("invalid")
      expect(calculateLeadScore(inputs).score).toBeNull()
    }
  })
  it("reproduces the documented worked example", () => {
    expect(calculateLeadScore([90, 60, 80, 50, 40].map((score, i) => ({ score, weight: [40, 10, 20, 10, 20][i] })))).toEqual({ score: 71, status: "research" })
  })
})

describe("worksheet CSV", () => {
  it("retains Unicode, quotes, commas, and multiline entries", () => {
    expect(toCsv([["Critério", 'A, "B"\nC']])).toBe('\uFEFF"Critério","A, ""B""\nC"\r\n')
  })
  it("neutralizes formulas in user-entered cells", () => {
    expect(toCsv([["=HYPERLINK(1)", " \t@SUM(1)", "+1", "-1"]])).toBe('\uFEFF"\'=HYPERLINK(1)","\' \t@SUM(1)","\'+1","\'-1"\r\n')
  })
})
