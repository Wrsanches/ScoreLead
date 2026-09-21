import { describe, expect, test } from "bun:test"
import {
  SAMPLE_EMAIL_CONTEXT,
  allowedRecipients,
  buildEmailContext,
  ensureUnsubscribeFooter,
  extractVariables,
  findUnknownVariables,
  htmlToText,
  renderEmailString,
  renderEmailTemplate,
} from "./render"

describe("variable substitution", () => {
  test("replaces known variables and escapes values in html mode", () => {
    const ctx = { ...SAMPLE_EMAIL_CONTEXT, "lead.name": `<script>alert(1)</script> & "Co"` }
    const html = renderEmailString("<p>Hi {{ lead.name }}</p>", ctx, { html: true })
    expect(html.output).toBe("<p>Hi &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Co&quot;</p>")
    expect(html.unknown).toEqual([])
    const text = renderEmailString("Hi {{lead.name}}", ctx, { html: false })
    expect(text.output).toBe(`Hi <script>alert(1)</script> & "Co"`)
  })

  test("unknown variables render empty and are reported once", () => {
    const out = renderEmailString("{{nope}} {{lead.name}} {{nope}} {{lead.zzz}}", SAMPLE_EMAIL_CONTEXT, { html: false })
    expect(out.output).toBe(" Bloom Yoga Studio  ")
    expect(out.unknown).toEqual(["nope", "lead.zzz"])
    expect(extractVariables("{{a}} {{ b }} {{a}}")).toEqual(["a", "b"])
    expect(findUnknownVariables("{{lead.name}}", "{{bad}}")).toEqual(["bad"])
  })

  test("firstName falls back from owner name to business name", () => {
    const base = { business: {}, sender: { name: "S", email: "s@x.io" }, unsubscribeUrl: "u" }
    expect(buildEmailContext({ ...base, lead: { ownerName: "Ana Maria Silva" } })["lead.firstName"]).toBe("Ana")
    expect(buildEmailContext({ ...base, lead: { name: "Studio Zen" } })["lead.firstName"]).toBe("Studio")
    expect(buildEmailContext({ ...base, lead: {} })["lead.firstName"]).toBe("")
  })
})

describe("document assembly", () => {
  test("fragments are wrapped, full documents are kept, and the opt-out footer is added once", () => {
    const rendered = renderEmailTemplate(
      { subject: "Hello {{lead.firstName}}", bodyHtml: "<p>Hi {{lead.firstName}}</p>" },
      SAMPLE_EMAIL_CONTEXT,
    )
    expect(rendered.subject).toBe("Hello Maria")
    expect(rendered.html).toContain("<!doctype html>")
    expect(rendered.html).toContain("<p>Hi Maria</p>")
    expect(rendered.html.match(/Unsubscribe/g)?.length).toBe(1)
    expect(rendered.html.indexOf(SAMPLE_EMAIL_CONTEXT.unsubscribe_url)).toBeLessThan(rendered.html.indexOf("</body>"))
    expect(rendered.text).toContain("Hi Maria")
    expect(rendered.bytes).toBeGreaterThan(0)

    const full = renderEmailTemplate(
      { subject: "x", bodyHtml: '<html><body><p>Own layout <a href="{{unsubscribe_url}}">Opt out</a></p></body></html>' },
      SAMPLE_EMAIL_CONTEXT,
    )
    expect(full.html.startsWith("<html>")).toBe(true)
    expect(full.html.match(/\/u\/sample/g)?.length).toBe(1)
  })

  test("footer is appended to bodiless fragments and skipped when the link exists", () => {
    expect(ensureUnsubscribeFooter("<p>x</p>", "https://u")).toContain('href="https://u"')
    expect(ensureUnsubscribeFooter('<p><a href="https://u">bye</a></p>', "https://u")).toBe('<p><a href="https://u">bye</a></p>')
  })

  test("plain text keeps structure and link targets", () => {
    const text = htmlToText(
      "<html><head><style>p{}</style></head><body><h1>Title</h1><p>Line one<br>two &amp; three</p><ul><li>A</li><li>B</li></ul><p><a href=\"https://x.io\">Visit</a></p></body></html>",
    )
    expect(text).toBe("Title\nLine one\ntwo & three\n- A\n- B\nVisit (https://x.io)")
  })
})

describe("recipients", () => {
  test("dedupes and lowercases across primary, discovered, and decision makers", () => {
    expect(
      allowedRecipients({
        email: "Owner@Example.com",
        emails: ["owner@example.com", "info@example.com", "", "not-an-email"],
        decisionMakers: [{ name: "A", email: "ceo@example.com" }, { name: "B" }],
      }),
    ).toEqual(["owner@example.com", "info@example.com", "ceo@example.com"])
    expect(allowedRecipients({})).toEqual([])
  })
})

describe("variable aliases and preview context", () => {
  test("underscore and case variants resolve to canonical keys", () => {
    const ctx = { ...SAMPLE_EMAIL_CONTEXT, "business.name": "Acme", "lead.firstName": "Ana" }
    const out = renderEmailString("{{business_name}} {{Business.Name}} {{lead_first_name}} {{LEAD.FIRSTNAME}} {{unsubscribe.url}}", ctx, { html: false })
    expect(out.output).toBe(`Acme Acme Ana Ana ${ctx.unsubscribe_url}`)
    expect(out.unknown).toEqual([])
    expect(findUnknownVariables("{{business_name}} {{business_nope}}")).toEqual(["business_nope"])
  })

  test("preview context mixes the sample lead with the real business and sender", async () => {
    const { buildPreviewContext, SAMPLE_LEAD } = await import("./render")
    const business = { name: "Acme Studio", website: "https://acme.example", services: null as string | null, location: "Porto" }
    const ctx = buildPreviewContext({ business, sender: { name: "Will", email: "will@acme.example" } })
    expect(ctx["business.name"]).toBe("Acme Studio")
    expect(ctx["business.services"]).toBe("")
    expect(ctx["sender.name"]).toBe("Will")
    expect(ctx["lead.name"]).toBe(SAMPLE_LEAD.name ?? "")
  })
})
