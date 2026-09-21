import { describe, expect, test } from "bun:test"
import { validateGeneratedEmailDrafts, type EmailTemplateBusinessProfile } from "./email-template-draft"

const profile: EmailTemplateBusinessProfile = {
  name: "Acme Studio",
  description: "Web design for local shops",
  persona: null, clientPersona: null, field: null, category: null, tags: null,
  location: "Porto, Portugal", language: "pt", website: "https://acme.example",
  instagram: null, facebook: null, linkedin: null, services: null, serviceArea: null,
  brandStyle: null, businessModel: null, logo: "https://acme.example/logo.png",
  brandColorPrimary: "#10b981", brandColorSecondary: null,
}

const goodEmail = (angle: string) => ({
  name: `Intro ${angle}`,
  subject: "Quick idea for {{lead.name}}",
  previewText: "A small change that brings walk-ins",
  angle,
  blocks: [
    { type: "heading", text: "Hi {{lead.firstName}}", level: 1 },
    { type: "text", paragraphs: ["We help shops in {{lead.city}} get found.", "Would a 15 minute call make sense?"] },
    { type: "button", label: "See our work", href: "javascript:alert(1)" },
    { type: "button", label: "Second button ignored", href: "https://acme.example/x" },
  ],
})

describe("validateGeneratedEmailDrafts", () => {
  test("converts blocks, repairs bad button hrefs, caps buttons, and merges components", () => {
    const out = validateGeneratedEmailDrafts(
      {
        emails: [goodEmail("Value first"), goodEmail("Proof"), { ...goodEmail("Ask"), blocks: [{ type: "text", paragraphs: ["Hello {{lead.foo}}"] }, { type: "divider" }] }],
        components: {
          header: { businessName: "Acme Studio", tagline: "Web design that sells" },
          footer: { businessName: "Acme Studio", locationText: "Porto", note: "You received this because we work with shops like yours.", unsubscribeLabel: "" },
        },
      },
      profile,
    )
    // the third email uses an unknown variable and is dropped
    expect(out.drafts).toHaveLength(2)
    const doc = out.drafts[0].doc
    expect(doc.blocks.map((b) => b.type)).toEqual(["heading", "text", "button"])
    const button = doc.blocks[2]
    if (button.type !== "button") throw new Error()
    expect(button.props.href).toBe("{{business.website}}")
    expect(doc.previewText).toBe("A small change that brings walk-ins")
    expect(out.components?.header?.logoUrl).toBe("https://acme.example/logo.png")
    expect(out.components?.footer?.website).toBe("https://acme.example")
    expect(out.components?.footer?.unsubscribeLabel).toBe("Unsubscribe")
  })

  test("throws when nothing usable comes back", () => {
    expect(() =>
      validateGeneratedEmailDrafts(
        { emails: [{ ...goodEmail("x"), blocks: [{ type: "text", paragraphs: ["{{made.up}}"] }, { type: "divider" }] }], components: { header: null, footer: null } },
        profile,
      ),
    ).toThrow()
  })
})
