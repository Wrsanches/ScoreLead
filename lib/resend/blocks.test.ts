import { describe, expect, test } from "bun:test"
import {
  EMAIL_BLOCK_KINDS,
  TOKEN_EMAIL_CONTEXT,
  collectDocumentStrings,
  createBlock,
  createEmptyDocument,
  emailBlockSchema,
  emailDocumentSchema,
  findIncompleteBlocks,
  normalizeRichDoc,
  resolveComponents,
  richDocToPlainText,
  textToRichDoc,
} from "./blocks"

describe("block schema", () => {
  test("every freshly created block validates", () => {
    for (const kind of EMAIL_BLOCK_KINDS) {
      expect(emailBlockSchema.safeParse(createBlock(kind)).success).toBe(true)
    }
    expect(emailDocumentSchema.safeParse(createEmptyDocument()).success).toBe(true)
  })

  test("rejects insecure urls and unknown variables", () => {
    const image = createBlock("image")
    if (image.type !== "image") throw new Error()
    expect(emailBlockSchema.safeParse({ ...image, props: { ...image.props, src: "http://x.io/a.png" } }).success).toBe(false)
    expect(emailBlockSchema.safeParse({ ...image, props: { ...image.props, src: "https://x.io/a.png" } }).success).toBe(true)
    const button = createBlock("button")
    if (button.type !== "button") throw new Error()
    expect(emailBlockSchema.safeParse({ ...button, props: { ...button.props, href: "javascript:alert(1)" } }).success).toBe(false)
    expect(emailBlockSchema.safeParse({ ...button, props: { ...button.props, href: "{{lead.website}}" } }).success).toBe(true)
    const text = createBlock("text")
    if (text.type !== "text") throw new Error()
    const bad = { ...text, props: { ...text.props, doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "variable", attrs: { key: "lead.nope" } }] }] } } }
    expect(emailBlockSchema.safeParse(bad).success).toBe(false)
  })

  test("incomplete blocks are reported by id", () => {
    const doc = createEmptyDocument()
    const heading = createBlock("heading")
    const divider = createBlock("divider")
    doc.blocks = [heading, divider, createBlock("image")]
    expect(findIncompleteBlocks(doc)).toEqual([heading.id, doc.blocks[2].id])
  })
})

describe("rich text helpers", () => {
  test("textToRichDoc splits known tokens into variable nodes", () => {
    const doc = textToRichDoc(["Hi {{lead.firstName}},\nthis is {{nope}}", ""])
    expect(doc.content).toHaveLength(1)
    const p = doc.content[0]
    if (p.type !== "paragraph") throw new Error()
    expect(p.content).toEqual([
      { type: "text", text: "Hi " },
      { type: "variable", attrs: { key: "lead.firstName" } },
      { type: "text", text: "," },
      { type: "hardBreak" },
      { type: "text", text: "this is {{nope}}" },
    ])
    expect(richDocToPlainText(doc)).toBe("Hi {{lead.firstName}},\nthis is {{nope}}")
  })

  test("normalizeRichDoc strips unknown marks, flattens nested lists, and keeps words", () => {
    const messy = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title", marks: [{ type: "underline" }, { type: "bold" }] }] },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "one", marks: [{ type: "link", attrs: { href: "javascript:x" } }] }] },
                { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "nested" }] }] }] },
              ],
            },
          ],
        },
        { type: "codeBlock", content: [{ type: "text", text: "code" }] },
        { type: "paragraph", content: [{ type: "mention", attrs: {}, content: [{ type: "text", text: "@x" }] }, { type: "variable", attrs: { key: "business.name" } }] },
      ],
    }
    const doc = normalizeRichDoc(messy)
    expect(doc.content[0]).toEqual({ type: "paragraph", content: [{ type: "text", text: "Title", marks: [{ type: "bold" }] }] })
    const list = doc.content[1]
    if (list.type !== "bulletList") throw new Error()
    expect(list.content).toHaveLength(2)
    expect(list.content[0].content[0].content?.[0]).toEqual({ type: "text", text: "one" })
    expect(list.content[1].content[0].content?.[0]).toEqual({ type: "text", text: "nested" })
    expect(doc.content[2]).toEqual({ type: "paragraph", content: [{ type: "text", text: "code" }] })
    expect(doc.content[3]).toEqual({ type: "paragraph", content: [{ type: "text", text: "@x" }, { type: "variable", attrs: { key: "business.name" } }] })
    expect(normalizeRichDoc(null)).toEqual({ type: "doc", content: [{ type: "paragraph" }] })
  })
})

describe("documents and components", () => {
  test("collectDocumentStrings includes hrefs and component copy", () => {
    const doc = createEmptyDocument()
    const button = createBlock("button")
    if (button.type !== "button") throw new Error()
    button.props.label = "Book"
    button.props.href = "https://x.io"
    doc.blocks = [button]
    doc.previewText = "Preview {{lead.name}}"
    const strings = collectDocumentStrings(doc, resolveComponents(null))
    expect(strings).toContain("https://x.io")
    expect(strings).toContain("Book")
    expect(strings).toContain("{{business.location}}")
  })

  test("defaults keep the footer compliant and the token context maps every key", () => {
    const resolved = resolveComponents(null)
    expect(resolved.footer.businessName).toBe("{{business.name}}")
    expect(resolved.footer.unsubscribeLabel).toBe("Unsubscribe")
    expect(TOKEN_EMAIL_CONTEXT["lead.firstName"]).toBe("{{lead.firstName}}")
    expect(TOKEN_EMAIL_CONTEXT.unsubscribe_url).toBe("{{unsubscribe_url}}")
  })
})
