import { describe, expect, test } from "bun:test"
import { emailTemplateFormSchema } from "./template-form"
import { createBlock, createEmptyDocument } from "./blocks"

const base = { name: "Intro", subject: "Hello {{lead.firstName}}" }
const codes = (r: ReturnType<typeof emailTemplateFormSchema.safeParse>) => (r.success ? [] : r.error.issues.map((i) => i.message.split(":")[0]))

describe("emailTemplateFormSchema", () => {
  test("blocks mode needs a document with at least one complete block", () => {
    expect(codes(emailTemplateFormSchema.safeParse({ ...base, bodyMode: "blocks" }))).toContain("BLOCKS_BODY_REQUIRED")
    expect(codes(emailTemplateFormSchema.safeParse({ ...base, bodyMode: "blocks", bodyDoc: createEmptyDocument() }))).toContain("BLOCKS_EMPTY")
    const doc = createEmptyDocument()
    doc.blocks = [createBlock("heading")]
    expect(codes(emailTemplateFormSchema.safeParse({ ...base, bodyMode: "blocks", bodyDoc: doc }))).toContain("BLOCK_INCOMPLETE")
    const heading = doc.blocks[0]
    if (heading.type === "heading") heading.props.text = "Hi {{lead.zzz}}"
    expect(codes(emailTemplateFormSchema.safeParse({ ...base, bodyMode: "blocks", bodyDoc: doc }))).toContain("UNKNOWN_VARIABLE")
    if (heading.type === "heading") heading.props.text = "Hi {{lead.firstName}}"
    expect(emailTemplateFormSchema.safeParse({ ...base, bodyMode: "blocks", bodyDoc: doc }).success).toBe(true)
  })

  test("html mode needs a body and known variables", () => {
    expect(codes(emailTemplateFormSchema.safeParse({ ...base, bodyMode: "html" }))).toContain("HTML_BODY_REQUIRED")
    expect(codes(emailTemplateFormSchema.safeParse({ ...base, bodyMode: "html", bodyHtml: "<p>{{nope}}</p>" }))).toContain("UNKNOWN_VARIABLE")
    expect(emailTemplateFormSchema.safeParse({ ...base, bodyMode: "html", bodyHtml: "<p>Hi {{lead.firstName}}</p>" }).success).toBe(true)
  })
})
