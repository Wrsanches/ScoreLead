import { describe, expect, test } from "bun:test"
import { renderBlocksToHtml } from "./render-blocks"
import { SAMPLE_EMAIL_CONTEXT, renderEmailTemplate } from "./render"
import { TOKEN_EMAIL_CONTEXT, createBlock, createEmptyDocument, resolveComponents, textToRichDoc, type EmailDocument } from "./blocks"
import { DEFAULT_BRAND_THEME, brandThemeFromBusiness, readableTextOn } from "@/lib/emails/blocks/theme"

function sampleDoc(): EmailDocument {
  const doc = createEmptyDocument()
  const heading = createBlock("heading")
  if (heading.type === "heading") heading.props.text = "Hello {{lead.firstName}}"
  const text = createBlock("text")
  if (text.type === "text") {
    text.props.doc = textToRichDoc(["We help {{lead.name}} in {{lead.city}}.", "Second paragraph"])
    const p = text.props.doc.content[0]
    if (p.type === "paragraph" && p.content) {
      p.content[0] = { type: "text", text: "We help ", marks: [{ type: "bold" }] }
      p.content.push({ type: "text", text: " Visit us", marks: [{ type: "link", attrs: { href: "https://example.com" } }] })
    }
  }
  const button = createBlock("button")
  if (button.type === "button") {
    button.props.label = "Book a call"
    button.props.href = "{{business.website}}"
  }
  const image = createBlock("image")
  if (image.type === "image") {
    image.props.src = "https://example.com/hero.png"
    image.props.alt = "Hero"
  }
  doc.blocks = [heading, text, button, image, createBlock("divider"), createBlock("spacer")]
  doc.previewText = "A short preview"
  return doc
}

async function renderWith(doc: EmailDocument, ctx = SAMPLE_EMAIL_CONTEXT) {
  const html = await renderBlocksToHtml({ doc, components: resolveComponents(null), theme: DEFAULT_BRAND_THEME, subject: "Hi {{lead.firstName}}" })
  return renderEmailTemplate({ subject: "Hi {{lead.firstName}}", bodyHtml: html }, ctx)
}

describe("block rendering", () => {
  test("renders a full document with variables substituted and exactly one unsubscribe link", async () => {
    const out = await renderWith(sampleDoc())
    expect(out.subject).toBe("Hi Maria")
    expect(out.html).toContain("<!DOCTYPE html")
    expect(out.html).toContain("Hello Maria")
    expect(out.html).toContain("<strong>We help </strong>")
    expect(out.html).toContain('href="https://example.com"')
    expect(out.html).toContain("Book a call")
    expect(out.html).toContain(`href="${SAMPLE_EMAIL_CONTEXT["business.website"]}"`)
    expect(out.html).toContain('src="https://example.com/hero.png"')
    expect(out.html).toContain("A short preview")
    expect(out.html.split(SAMPLE_EMAIL_CONTEXT.unsubscribe_url).length - 1).toBe(1)
    expect(out.html).toContain("Bloom Yoga Studio")
    expect(out.text).toContain("Book a call")
    expect(out.text).toContain("Unsubscribe")
    expect(out.unknownVariables).toEqual([])
    expect(out.bytes).toBeLessThan(20_000)
  })

  test("values are escaped once and cannot inject markup", async () => {
    const ctx = { ...SAMPLE_EMAIL_CONTEXT, "lead.firstName": "<script>alert(1)</script>", "lead.name": "Tom & Jerry" }
    const out = await renderWith(sampleDoc(), ctx)
    expect(out.html).not.toContain("<script>")
    expect(out.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(out.html).toContain("Tom &amp; Jerry")
    expect(out.html).not.toContain("&amp;amp;")
  })

  test("token context keeps every variable literal for snapshots", async () => {
    const out = await renderWith(sampleDoc(), TOKEN_EMAIL_CONTEXT)
    expect(out.html).toContain("Hello {{lead.firstName}}")
    expect(out.html).toContain('href="{{unsubscribe_url}}"')
    expect(out.html.split("{{unsubscribe_url}}").length - 1).toBe(1)
    expect(out.unknownVariables).toEqual([])
  })

  test("a hidden footer still yields an unsubscribe link", async () => {
    const doc = sampleDoc()
    doc.shared.footer = false
    const out = await renderWith(doc)
    expect(out.html.split(SAMPLE_EMAIL_CONTEXT.unsubscribe_url).length - 1).toBe(1)
  })

  test("theme derives from brand colors with readable button text", () => {
    const theme = brandThemeFromBusiness({ brandColorPrimary: "#FFD600", brandColors: ["#123456"] })
    expect(theme.primary).toBe("#ffd600")
    expect(theme.secondary).toBe("#123456")
    expect(readableTextOn(theme.primary)).toBe("#18181b")
    expect(readableTextOn("#10b981")).toBe("#ffffff")
    expect(brandThemeFromBusiness({ brandColorPrimary: "nope" }).primary).toBe(DEFAULT_BRAND_THEME.primary)
  })
})

describe("brand design system", () => {
  test("fonts, colors, and style flow into the theme and the rendered email", async () => {
    const theme = brandThemeFromBusiness({
      brandColorPrimary: "#1d4ed8",
      brandColorSecondary: "#0f172a",
      brandFonts: ["'Poppins', sans-serif", "Playfair Display", "Arial"],
      brandStyle: "Modern, rounded and friendly",
    })
    expect(theme.fontStack.startsWith("'Poppins',")).toBe(true)
    expect(theme.headingFontStack.startsWith("'Playfair Display',")).toBe(true)
    expect(theme.webFontUrl).toContain("family=Poppins")
    expect(theme.webFontUrl).toContain("family=Playfair+Display")
    expect(theme.headingColor).toBe("#0f172a")
    expect(theme.buttonRadius).toBe(999)
    expect(theme.accentSoft).not.toBe(theme.primary)
    const html = await renderBlocksToHtml({ doc: sampleDoc(), components: resolveComponents(null), theme, subject: "x" })
    expect(html).toContain("fonts.googleapis.com/css2?family=Poppins")
    expect(html).toContain("border-top:4px solid #1d4ed8")
    expect(html).toContain("Playfair Display")
  })

  test("system fonts and unreadable secondaries fall back safely", () => {
    const theme = brandThemeFromBusiness({ brandColorSecondary: "#fef08a", brandFonts: ["Arial", "Helvetica"], brandStyle: "sharp minimal" })
    expect(theme.webFontUrl).toBeNull()
    expect(theme.fontStack).toBe(DEFAULT_BRAND_THEME.fontStack)
    expect(theme.headingColor).toBe(DEFAULT_BRAND_THEME.text)
    expect(theme.buttonRadius).toBe(6)
  })
})
