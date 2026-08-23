import { describe, expect, test } from "bun:test"
import {
  buildTestTemplateParameters,
  whatsappTestMessageRequestSchema,
} from "./test-message"

describe("WhatsApp test messages", () => {
  test("builds numbered and named template parameters", () => {
    expect(
      buildTestTemplateParameters(
        [{ type: "BODY", text: "Hi {{1}}, welcome to {{business_name}}." }],
        ["Ana", "Ceramik"],
      ),
    ).toEqual([
      { type: "text", text: "Ana" },
      { type: "text", parameterName: "business_name", text: "Ceramik" },
    ])
  })

  test("requires exactly one value for every variable", () => {
    expect(() =>
      buildTestTemplateParameters(
        [{ type: "BODY", text: "Hi {{1}}, your code is {{2}}." }],
        ["Ana"],
      ),
    ).toThrow("Provide one value for each template variable")
  })

  test("requires the inline recipient-permission confirmation", () => {
    expect(
      whatsappTestMessageRequestSchema.safeParse({
        phoneE164: "+5511999999999",
        templateId: "template-1",
        values: [],
        consentConfirmed: false,
      }).success,
    ).toBe(false)
  })
})
