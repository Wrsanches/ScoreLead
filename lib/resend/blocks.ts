/**
 * Block-based email documents. Pure and client-safe: the builder validates and
 * normalizes documents in the browser with exactly the same schema the save
 * route enforces on the server.
 *
 * Text blocks store TipTap JSON restricted to a small whitelist. Rendering
 * walks that JSON into React Email elements, so no HTML string is ever trusted.
 */
import { z } from "zod"
import { EMAIL_TEMPLATE_VARIABLES, canonicalVariableKey, renderEmailString, type EmailContext } from "@/lib/resend/render"

export const EMAIL_BLOCK_KINDS = ["heading", "text", "button", "image", "divider", "spacer"] as const
export const EMAIL_COMPONENT_KINDS = ["header", "footer"] as const
export type EmailBlockKind = (typeof EMAIL_BLOCK_KINDS)[number]
export type EmailComponentKind = (typeof EMAIL_COMPONENT_KINDS)[number]

export const EMAIL_DOC_MAX_BLOCKS = 60
export const EMAIL_DOC_MAX_BYTES = 60_000

const TOKEN_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\}\}/g
const URL_VARIABLE_RE = /^\{\{\s*(business\.website|lead\.website|unsubscribe_url)\s*\}\}$/

const blockId = z.string().min(1).max(40)
const align = z.enum(["left", "center"])
export type EmailAlign = z.infer<typeof align>

/** Images and logos must be hosted on an absolute https URL to load in mail clients. */
export const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => /^https:\/\/[^\s]+$/i.test(v), "HTTPS_REQUIRED")

/** Link targets: http(s) URL or one of the URL-bearing variables. Blocks javascript: and data:. */
export const hrefSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => /^https?:\/\/[^\s]+$/i.test(v) || URL_VARIABLE_RE.test(v), "INVALID_HREF")

export function isValidHref(value: string): boolean {
  return hrefSchema.safeParse(value).success
}

// ------------------------------------------------------------------ rich text

const markSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({ type: z.literal("link"), attrs: z.object({ href: hrefSchema }) }),
])
const textNode = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(5000),
  marks: z.array(markSchema).max(3).optional(),
})
const variableNode = z.object({
  type: z.literal("variable"),
  attrs: z.object({ key: z.enum(EMAIL_TEMPLATE_VARIABLES) }),
})
const hardBreakNode = z.object({ type: z.literal("hardBreak") })
const inlineNode = z.discriminatedUnion("type", [textNode, variableNode, hardBreakNode])
const paragraphNode = z.object({
  type: z.literal("paragraph"),
  content: z.array(inlineNode).max(500).optional(),
})
const listItemNode = z.object({
  type: z.literal("listItem"),
  content: z.array(paragraphNode).min(1).max(20),
})
const bulletListNode = z.object({ type: z.literal("bulletList"), content: z.array(listItemNode).min(1).max(50) })
const orderedListNode = z.object({ type: z.literal("orderedList"), content: z.array(listItemNode).min(1).max(50) })

export const richDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.discriminatedUnion("type", [paragraphNode, bulletListNode, orderedListNode])).min(1).max(100),
})
export type RichDoc = z.infer<typeof richDocSchema>
export type RichInline = z.infer<typeof inlineNode>
export type RichParagraph = z.infer<typeof paragraphNode>
export type RichBlockNode = RichDoc["content"][number]
export type RichMark = z.infer<typeof markSchema>

// --------------------------------------------------------------------- blocks

/**
 * Content fields are allowed to be empty in the schema so an in-progress
 * document (a just-added image without a source) still validates for preview.
 * `findIncompleteBlocks` enforces completeness at save time.
 */
const optionalHref = z.union([z.literal(""), hrefSchema])
const optionalHttpsUrl = z.union([z.literal(""), httpsUrl])

export const emailBlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: blockId,
    type: z.literal("heading"),
    props: z.object({ text: z.string().max(200), level: z.union([z.literal(1), z.literal(2)]), align }),
  }),
  z.object({
    id: blockId,
    type: z.literal("text"),
    props: z.object({ doc: richDocSchema, align }),
  }),
  z.object({
    id: blockId,
    type: z.literal("button"),
    props: z.object({
      label: z.string().max(80),
      href: optionalHref,
      align,
      variant: z.enum(["primary", "secondary"]),
    }),
  }),
  z.object({
    id: blockId,
    type: z.literal("image"),
    props: z.object({
      src: optionalHttpsUrl,
      alt: z.string().max(200),
      href: optionalHref.nullable(),
      width: z.number().int().min(80).max(600).nullable(),
      align,
    }),
  }),
  z.object({ id: blockId, type: z.literal("divider"), props: z.object({}) }),
  z.object({ id: blockId, type: z.literal("spacer"), props: z.object({ height: z.number().int().min(8).max(96) }) }),
])
export type EmailBlock = z.infer<typeof emailBlockSchema>
export type EmailBlockOf<K extends EmailBlockKind> = Extract<EmailBlock, { type: K }>

export const emailDocumentSchema = z.object({
  version: z.literal(1),
  /** Inbox preview line, shown next to the subject. */
  previewText: z.string().max(150),
  blocks: z.array(emailBlockSchema).max(EMAIL_DOC_MAX_BLOCKS),
  shared: z.object({ header: z.boolean(), footer: z.boolean() }),
})
export type EmailDocument = z.infer<typeof emailDocumentSchema>

// ----------------------------------------------------------- shared components

export const headerPropsSchema = z.object({
  logoUrl: httpsUrl.nullable(),
  businessName: z.string().max(120),
  tagline: z.string().max(160),
  align,
})
export const footerPropsSchema = z.object({
  businessName: z.string().max(120),
  locationText: z.string().max(200),
  website: httpsUrl.nullable(),
  socialLinks: z.array(z.object({ label: z.string().min(1).max(40), href: httpsUrl })).max(4),
  /** The link target is always {{unsubscribe_url}}; only the label is editable. */
  unsubscribeLabel: z.string().min(1).max(60),
  note: z.string().max(300),
})
export type HeaderProps = z.infer<typeof headerPropsSchema>
export type FooterProps = z.infer<typeof footerPropsSchema>

export const emailComponentPropsByKind = {
  header: headerPropsSchema,
  footer: footerPropsSchema,
} as const

export type EmailComponentSet = {
  header: HeaderProps | null
  footer: FooterProps | null
}
export type ResolvedEmailComponents = {
  header: HeaderProps
  footer: FooterProps
}

/** PUT body: any subset of kinds. */
export const emailComponentsUpdateSchema = z
  .object({
    header: headerPropsSchema.optional(),
    footer: footerPropsSchema.optional(),
  })
  .refine((v) => v.header || v.footer, { message: "EMPTY_UPDATE" })
export type EmailComponentsUpdate = z.infer<typeof emailComponentsUpdateSchema>

export function defaultComponents(): ResolvedEmailComponents {
  return {
    header: { logoUrl: null, businessName: "{{business.name}}", tagline: "", align: "left" },
    footer: {
      businessName: "{{business.name}}",
      locationText: "{{business.location}}",
      website: null,
      socialLinks: [],
      unsubscribeLabel: "Unsubscribe",
      note: "",
    },
  }
}

export function resolveComponents(set: Partial<EmailComponentSet> | null | undefined): ResolvedEmailComponents {
  const defaults = defaultComponents()
  return {
    header: set?.header ?? defaults.header,
    footer: set?.footer ?? defaults.footer,
  }
}

// -------------------------------------------------------------------- helpers

export function newBlockId(): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return raw.replace(/-/g, "").slice(0, 12)
}

export function emptyParagraph(): RichParagraph {
  return { type: "paragraph" }
}

export function createBlock(kind: EmailBlockKind): EmailBlock {
  const id = newBlockId()
  switch (kind) {
    case "heading":
      return { id, type: "heading", props: { text: "", level: 1, align: "left" } }
    case "text":
      return { id, type: "text", props: { doc: { type: "doc", content: [emptyParagraph()] }, align: "left" } }
    case "button":
      return { id, type: "button", props: { label: "", href: "{{business.website}}", align: "left", variant: "primary" } }
    case "image":
      return { id, type: "image", props: { src: "", alt: "", href: null, width: null, align: "center" } }
    case "divider":
      return { id, type: "divider", props: {} }
    case "spacer":
      return { id, type: "spacer", props: { height: 24 } }
  }
}

export function createEmptyDocument(): EmailDocument {
  return { version: 1, previewText: "", blocks: [], shared: { header: true, footer: true } }
}

/** Blocks whose required content is still missing; the save route refuses these. */
export function findIncompleteBlocks(doc: EmailDocument): string[] {
  const ids: string[] = []
  for (const block of doc.blocks) {
    switch (block.type) {
      case "heading":
        if (!block.props.text.trim()) ids.push(block.id)
        break
      case "text":
        if (!richDocToPlainText(block.props.doc).trim()) ids.push(block.id)
        break
      case "button":
        if (!block.props.label.trim() || !block.props.href) ids.push(block.id)
        break
      case "image":
        if (!block.props.src) ids.push(block.id)
        break
      default:
        break
    }
  }
  return ids
}

/**
 * Plain paragraphs into a rich doc, turning known `{{tokens}}` into variable
 * nodes so they render as chips. Unknown tokens stay as text (and fail the
 * unknown-variable check later). Newlines inside a paragraph become breaks.
 */
export function textToRichDoc(paragraphs: string[]): RichDoc {
  const content: RichParagraph[] = []
  for (const paragraph of paragraphs) {
    const inlines: RichInline[] = []
    const lines = paragraph.split(/\r?\n/)
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) inlines.push({ type: "hardBreak" })
      let last = 0
      for (const match of line.matchAll(TOKEN_RE)) {
        const index = match.index ?? 0
        if (index > last) inlines.push({ type: "text", text: line.slice(last, index) })
        const key = canonicalVariableKey(match[1])
        if (key) inlines.push({ type: "variable", attrs: { key } })
        else inlines.push({ type: "text", text: match[0] })
        last = index + match[0].length
      }
      if (last < line.length) inlines.push({ type: "text", text: line.slice(last) })
    })
    const merged: RichInline[] = []
    for (const node of inlines) {
      if (node.type === "text" && node.text.length === 0) continue
      const prev = merged[merged.length - 1]
      if (node.type === "text" && prev?.type === "text" && !prev.marks && !node.marks) {
        merged[merged.length - 1] = { type: "text", text: prev.text + node.text }
      } else {
        merged.push(node)
      }
    }
    if (merged.length === 0) continue
    content.push({ type: "paragraph", content: merged })
  }
  return { type: "doc", content: content.length > 0 ? content : [emptyParagraph()] }
}

function inlinesToText(inlines: RichInline[] | undefined): string {
  return (inlines ?? [])
    .map((node) => {
      if (node.type === "text") return node.text
      if (node.type === "variable") return `{{${node.attrs.key}}}`
      return "\n"
    })
    .join("")
}

export function richDocToPlainText(doc: RichDoc): string {
  return doc.content
    .map((node) => {
      if (node.type === "paragraph") return inlinesToText(node.content)
      return node.content.map((item, i) => `${node.type === "orderedList" ? `${i + 1}.` : "-"} ${item.content.map((p) => inlinesToText(p.content)).join("\n")}`).join("\n")
    })
    .join("\n")
}

/** Link targets inside a rich doc, for validation and unknown-variable checks. */
export function richDocHrefs(doc: RichDoc): string[] {
  const out: string[] = []
  const visit = (inlines: RichInline[] | undefined) => {
    for (const node of inlines ?? []) {
      if (node.type !== "text") continue
      for (const mark of node.marks ?? []) if (mark.type === "link") out.push(mark.attrs.href)
    }
  }
  for (const node of doc.content) {
    if (node.type === "paragraph") visit(node.content)
    else for (const item of node.content) for (const p of item.content) visit(p.content)
  }
  return out
}

type Loose = Record<string, unknown>
const asRecord = (v: unknown): Loose | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Loose) : null)
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

function normalizeInlines(nodes: unknown[]): RichInline[] {
  const out: RichInline[] = []
  for (const raw of nodes) {
    const node = asRecord(raw)
    if (!node) continue
    switch (node.type) {
      case "text": {
        const text = typeof node.text === "string" ? node.text : ""
        if (!text) break
        const marks: RichMark[] = []
        for (const rawMark of asArray(node.marks)) {
          const mark = asRecord(rawMark)
          if (!mark) continue
          if (mark.type === "bold" || mark.type === "italic") {
            if (!marks.some((m) => m.type === mark.type)) marks.push({ type: mark.type })
          } else if (mark.type === "link") {
            const href = asRecord(mark.attrs)?.href
            if (typeof href === "string" && isValidHref(href.trim()) && !marks.some((m) => m.type === "link")) {
              marks.push({ type: "link", attrs: { href: href.trim() } })
            }
          }
        }
        out.push(marks.length > 0 ? { type: "text", text, marks } : { type: "text", text })
        break
      }
      case "variable": {
        const raw = asRecord(node.attrs)?.key
        const key = typeof raw === "string" ? canonicalVariableKey(raw) : null
        if (key) out.push({ type: "variable", attrs: { key } })
        break
      }
      case "hardBreak":
        out.push({ type: "hardBreak" })
        break
      default:
        // Unknown inline (mention, emoji, image...): keep any nested text, drop the wrapper.
        out.push(...normalizeInlines(asArray(node.content)))
    }
  }
  return out
}

function normalizeParagraph(node: Loose): RichParagraph {
  const content = normalizeInlines(asArray(node.content))
  return content.length > 0 ? { type: "paragraph", content } : emptyParagraph()
}

function normalizeListItems(items: unknown[], into: z.infer<typeof listItemNode>[]) {
  for (const raw of items) {
    const item = asRecord(raw)
    if (!item) continue
    const paragraphs: RichParagraph[] = []
    const nested: unknown[] = []
    for (const childRaw of asArray(item.content)) {
      const child = asRecord(childRaw)
      if (!child) continue
      if (child.type === "bulletList" || child.type === "orderedList") nested.push(...asArray(child.content))
      else paragraphs.push(normalizeParagraph(child))
    }
    if (paragraphs.length > 0) into.push({ type: "listItem", content: paragraphs })
    // Nested lists are flattened: their items follow the parent item.
    if (nested.length > 0) normalizeListItems(nested, into)
  }
}

/**
 * Coerce arbitrary TipTap JSON into the whitelisted shape: unknown marks and
 * nodes are dropped, foreign block nodes become paragraphs, nested lists are
 * flattened, and the result always has at least one paragraph.
 */
export function normalizeRichDoc(json: unknown): RichDoc {
  const doc = asRecord(json)
  const content: RichBlockNode[] = []
  for (const raw of asArray(doc?.content)) {
    const node = asRecord(raw)
    if (!node) continue
    if (node.type === "bulletList" || node.type === "orderedList") {
      const items: z.infer<typeof listItemNode>[] = []
      normalizeListItems(asArray(node.content), items)
      if (items.length > 0) content.push({ type: node.type, content: items.slice(0, 50) })
    } else if (node.type === "paragraph") {
      content.push(normalizeParagraph(node))
    } else if (Array.isArray(node.content)) {
      // heading, blockquote, codeBlock...: keep the words, lose the wrapper.
      content.push(normalizeParagraph(node))
    }
  }
  const result: RichDoc = { type: "doc", content: content.length > 0 ? content.slice(0, 100) : [emptyParagraph()] }
  return richDocSchema.parse(result)
}

function componentStrings(components: Partial<EmailComponentSet> | null | undefined): string[] {
  const out: string[] = []
  const h = components?.header
  if (h) out.push(h.businessName, h.tagline)
  const f = components?.footer
  if (f) out.push(f.businessName, f.locationText, f.unsubscribeLabel, f.note, ...f.socialLinks.map((l) => l.label))
  return out
}

/** Every user-authored string in a document, for unknown-variable detection. */
export function collectDocumentStrings(doc: EmailDocument, components?: Partial<EmailComponentSet> | null): string[] {
  const out: string[] = [doc.previewText]
  for (const block of doc.blocks) {
    switch (block.type) {
      case "heading":
        out.push(block.props.text)
        break
      case "text":
        out.push(richDocToPlainText(block.props.doc), ...richDocHrefs(block.props.doc))
        break
      case "button":
        out.push(block.props.label, block.props.href)
        break
      case "image":
        out.push(block.props.alt, block.props.src, block.props.href ?? "")
        break
      default:
        break
    }
  }
  out.push(...componentStrings(components))
  return out
}

export function documentBytes(doc: EmailDocument): number {
  return new TextEncoder().encode(JSON.stringify(doc)).length
}

/** Renders a template with every variable left as its own token. */
export const TOKEN_EMAIL_CONTEXT: EmailContext = Object.fromEntries(
  EMAIL_TEMPLATE_VARIABLES.map((key) => [key, `{{${key}}}`]),
) as EmailContext

/**
 * Fill variables inside shared-component copy for client-side previews (the
 * dialogs render React components directly, without the server pass).
 */
export function substituteComponentProps(set: ResolvedEmailComponents, ctx: EmailContext): ResolvedEmailComponents {
  const sub = (v: string) => renderEmailString(v, ctx, { html: false }).output
  return {
    header: { ...set.header, businessName: sub(set.header.businessName), tagline: sub(set.header.tagline) },
    footer: {
      ...set.footer,
      businessName: sub(set.footer.businessName),
      locationText: sub(set.footer.locationText),
      note: sub(set.footer.note),
      unsubscribeLabel: sub(set.footer.unsubscribeLabel),
      socialLinks: set.footer.socialLinks.map((l) => ({ ...l, label: sub(l.label) })),
    },
  }
}
