import { describe, expect, test } from "bun:test"
import { validateGeneratedWhatsAppTemplateDraft } from "./whatsapp-template-draft"

describe("WhatsApp AI template drafts", () => {
  test("accepts sequential variables with matching examples", () => {
    expect(
      validateGeneratedWhatsAppTemplateDraft(
        {
          name: "service_follow_up",
          headerText: "How can we help?",
          body: "Hi {{1}}, would you like to learn more about {{2}}?",
          bodyExamples: ["Ana", "our installation service"],
          footerText: "Reply STOP to opt out",
        },
        { language: "en_US", category: "MARKETING" },
      ),
    ).toEqual({
      name: "service_follow_up",
      headerText: "How can we help?",
      body: "Hi {{1}}, would you like to learn more about {{2}}?",
      bodyExamples: ["Ana", "our installation service"],
      footerText: "Reply STOP to opt out",
    })
  })

  test("rejects a draft whose examples do not match its variables", () => {
    expect(() =>
      validateGeneratedWhatsAppTemplateDraft(
        {
          name: "service_follow_up",
          headerText: null,
          body: "Hi {{1}}, we can help with {{2}}.",
          bodyExamples: ["Ana"],
          footerText: null,
        },
        { language: "en_US", category: "MARKETING" },
      ),
    ).toThrow("Provide one example value")
  })
})
