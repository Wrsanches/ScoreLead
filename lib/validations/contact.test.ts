import { describe, expect, test } from "bun:test"
import { contactSchema } from "./contact"

const validSubmission = {
  name: "Ana Silva",
  email: "ana@example.com",
  company: "Acme",
  inquiryType: "sales" as const,
  subject: "Lead generation for our team",
  message: "We would like to understand how ScoreLead fits our workflow.",
  website: "",
}

describe("contactSchema", () => {
  test("accepts and trims a valid submission", () => {
    expect(contactSchema.parse({
      ...validSubmission,
      name: "  Ana Silva  ",
      company: "  Acme  ",
    })).toEqual(validSubmission)
  })

  test("rejects short messages and invalid inquiry types", () => {
    const result = contactSchema.safeParse({
      ...validSubmission,
      inquiryType: "billing",
      message: "Too short",
    })

    expect(result.success).toBe(false)
  })

  test("preserves populated honeypot fields for silent server filtering", () => {
    const result = contactSchema.safeParse({
      ...validSubmission,
      website: "https://spam.example",
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.website).toBe("https://spam.example")
  })

  test("rejects header injection in subjects", () => {
    expect(contactSchema.safeParse({
      ...validSubmission,
      subject: "Hello\nBcc: victim@example.com",
    }).success).toBe(false)
  })
})
