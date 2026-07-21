import { describe, expect, test } from "bun:test"
import {
  getTemplateVariables,
  isSupportedMarketingTemplate,
  renderTemplateBody,
  renderTemplatePreview,
} from "./templates"
import { isWhatsAppOptOut } from "./webhooks"

const components = [
  { type: "BODY", text: "Hi {{first_name}}, I noticed {{business_name}} serves the local community." },
  { type: "FOOTER", text: "Reply STOP to opt out" },
]

describe("WhatsApp templates", () => {
  test("accepts approved text-only marketing templates", () => {
    expect(isSupportedMarketingTemplate({
      category: "MARKETING",
      status: "APPROVED",
      components,
    })).toBe(true)
    expect(isSupportedMarketingTemplate({
      category: "UTILITY",
      status: "APPROVED",
      components,
    })).toBe(false)
  })

  test("extracts and renders named variables without modifying fixed copy", () => {
    expect(getTemplateVariables(components)).toEqual(["first_name", "business_name"])
    expect(renderTemplateBody(components, [
      { type: "text", parameterName: "first_name", text: "Ana" },
      { type: "text", parameterName: "business_name", text: "Studio Sol" },
    ])).toBe("Hi Ana, I noticed Studio Sol serves the local community.")
  })

  test("shows fixed CTA content in the immutable approval preview", () => {
    const ctaComponents = [
      { type: "BODY", text: "Hi {{1}}, see our offer." },
      { type: "BUTTONS", buttons: [{ type: "URL", text: "View offer", url: "https://example.com/offer" }] },
    ]
    expect(renderTemplatePreview(ctaComponents, [{ type: "text", text: "Ana" }])).toBe(
      "Hi Ana, see our offer.\n\nView offer — https://example.com/offer",
    )
    expect(isSupportedMarketingTemplate({
      category: "MARKETING",
      status: "APPROVED",
      components: [
        { type: "BODY", text: "A fixed marketing message." },
        { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Stop" }] },
      ],
    })).toBe(false)
  })

  test("recognizes only exact localized opt-out commands", () => {
    expect(isWhatsAppOptOut(" parar ")).toBe(true)
    expect(isWhatsAppOptOut("STOP")).toBe(true)
    expect(isWhatsAppOptOut("please stop later")).toBe(false)
  })
})
