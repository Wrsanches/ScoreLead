/**
 * Pure template rendering for business emails. No database or Node-only
 * imports: the template editor runs this in the browser for live preview and
 * the send route runs it on the server, so both must agree byte for byte.
 */

export const EMAIL_TEMPLATE_VARIABLES = [
  "lead.name",
  "lead.ownerName",
  "lead.firstName",
  "lead.city",
  "lead.state",
  "lead.country",
  "lead.website",
  "lead.email",
  "lead.industry",
  "business.name",
  "business.website",
  "business.services",
  "business.location",
  "sender.name",
  "sender.email",
  "unsubscribe_url",
] as const

export type EmailVariableKey = (typeof EMAIL_TEMPLATE_VARIABLES)[number]
export type EmailContext = Record<EmailVariableKey, string>

const VARIABLE_SET: ReadonlySet<string> = new Set(EMAIL_TEMPLATE_VARIABLES)
const VARIABLE_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\}\}/g

/**
 * People type variables in many spellings: `business_name`, `Lead.First_Name`,
 * `lead_first_name`. Resolve those to the canonical key when unambiguous.
 */
export function canonicalVariableKey(raw: string): EmailVariableKey | null {
  if (VARIABLE_SET.has(raw)) return raw as EmailVariableKey
  const lower = raw.toLowerCase()
  if (lower === "unsubscribe_url" || lower === "unsubscribe.url" || lower === "unsubscribeurl") return "unsubscribe_url"
  const match = lower.match(/^(lead|business|sender)[._]?(.+)$/)
  if (!match) return null
  const camel = match[2].replace(/[_.\s]+(.)/g, (_, c: string) => c.toUpperCase())
  const key = `${match[1]}.${camel}`
  if (VARIABLE_SET.has(key)) return key as EmailVariableKey
  // Case-insensitive fallback: `lead.firstname` -> `lead.firstName`.
  const ci = EMAIL_TEMPLATE_VARIABLES.find((k) => k.toLowerCase() === key.toLowerCase())
  return ci ?? null
}

export const EMAIL_HTML_MAX_BYTES = 100_000
export const EMAIL_SUBJECT_MAX = 200

export interface EmailContextLead {
  name?: string | null
  ownerName?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  website?: string | null
  email?: string | null
  emails?: string[] | null
  industry?: string | null
  decisionMakers?: { name: string; title?: string; linkedin?: string; email?: string }[] | null
}

export interface EmailContextBusiness {
  name?: string | null
  website?: string | null
  services?: string | null
  location?: string | null
}

export interface EmailContextSender {
  name: string
  email: string
}

function firstName(lead: EmailContextLead): string {
  const source = (lead.ownerName || lead.name || "").trim()
  return source.split(/\s+/)[0] ?? ""
}

export function buildEmailContext(input: {
  lead: EmailContextLead
  business: EmailContextBusiness
  sender: EmailContextSender
  to?: string | null
  unsubscribeUrl: string
}): EmailContext {
  const { lead, business, sender } = input
  return {
    "lead.name": lead.name ?? "",
    "lead.ownerName": lead.ownerName ?? "",
    "lead.firstName": firstName(lead),
    "lead.city": lead.city ?? "",
    "lead.state": lead.state ?? "",
    "lead.country": lead.country ?? "",
    "lead.website": lead.website ?? "",
    "lead.email": input.to ?? lead.email ?? "",
    "lead.industry": lead.industry ?? "",
    "business.name": business.name ?? "",
    "business.website": business.website ?? "",
    "business.services": business.services ?? "",
    "business.location": business.location ?? "",
    "sender.name": sender.name,
    "sender.email": sender.email,
    unsubscribe_url: input.unsubscribeUrl,
  }
}

/** A believable lead for previews; the business and sender side come from real data. */
export const SAMPLE_LEAD: EmailContextLead = {
  name: "Bloom Yoga Studio",
  ownerName: "Maria Alves",
  city: "Lisbon",
  state: "Lisboa",
  country: "Portugal",
  website: "https://bloomyoga.example",
  email: "maria@bloomyoga.example",
  industry: "Fitness & Wellness",
}

export const SAMPLE_UNSUBSCRIBE_URL = "https://app.scorelead.io/u/sample"

/**
 * Preview context: the sample lead plus the business's own name, website,
 * services, and location, and the real sender. Templates then read the way
 * they will for the first real send, not with placeholder company names.
 */
export function buildPreviewContext(input: { business: EmailContextBusiness; sender: EmailContextSender }): EmailContext {
  return buildEmailContext({ lead: SAMPLE_LEAD, business: input.business, sender: input.sender, unsubscribeUrl: SAMPLE_UNSUBSCRIBE_URL })
}

/** Fully synthetic context, used only where no business is available (unit tests, fallbacks). */
export const SAMPLE_EMAIL_CONTEXT: EmailContext = {
  "lead.name": "Bloom Yoga Studio",
  "lead.ownerName": "Maria Alves",
  "lead.firstName": "Maria",
  "lead.city": "Lisbon",
  "lead.state": "Lisboa",
  "lead.country": "Portugal",
  "lead.website": "https://bloomyoga.example",
  "lead.email": "maria@bloomyoga.example",
  "lead.industry": "Fitness & Wellness",
  "business.name": "Your Business",
  "business.website": "https://yourbusiness.example",
  "business.services": "Web design, branding",
  "business.location": "Porto, Portugal",
  "sender.name": "You",
  "sender.email": "you@yourbusiness.example",
  unsubscribe_url: "https://app.scorelead.io/u/sample",
}

export function extractVariables(text: string): string[] {
  const found: string[] = []
  for (const match of text.matchAll(VARIABLE_RE)) {
    if (!found.includes(match[1])) found.push(match[1])
  }
  return found
}

export function findUnknownVariables(...texts: (string | null | undefined)[]): string[] {
  const unknown: string[] = []
  for (const text of texts) {
    if (!text) continue
    for (const key of extractVariables(text)) {
      if (!canonicalVariableKey(key) && !unknown.includes(key)) unknown.push(key)
    }
  }
  return unknown
}

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Substitute `{{ key }}` tokens. In HTML mode the values are escaped so a lead
 * name like `<script>` can never become markup. Unknown keys render empty and
 * are reported so the UI can warn.
 */
export function renderEmailString(
  input: string,
  ctx: EmailContext,
  options: { html: boolean },
): { output: string; unknown: string[] } {
  const unknown: string[] = []
  const output = input.replace(VARIABLE_RE, (_, key: string) => {
    const canonical = canonicalVariableKey(key)
    if (!canonical) {
      if (!unknown.includes(key)) unknown.push(key)
      return ""
    }
    const value = ctx[canonical] ?? ""
    return options.html ? escapeEmailHtml(value) : value
  })
  return { output, unknown }
}

/**
 * Minimal, unbranded email document around a body fragment. Intentionally not
 * the ScoreLead transactional layout: this mail is the customer's, not ours.
 */
export function wrapEmailHtml(fragment: string, title = ""): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeEmailHtml(title)}</title>`,
    "</head>",
    '<body style="margin:0;padding:24px;background:#ffffff;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">',
    '<div style="max-width:600px;margin:0 auto;">',
    fragment,
    "</div>",
    "</body>",
    "</html>",
  ].join("\n")
}

/** A template is a full document when it brings its own body element. */
export function isFullHtmlDocument(html: string): boolean {
  return /<body[\s>]/i.test(html)
}

/**
 * Every outgoing email carries a working opt-out. If the author already placed
 * the unsubscribe link, leave the design alone; otherwise append a discreet
 * footer just before the body closes.
 */
export function ensureUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  if (!unsubscribeUrl || html.includes(unsubscribeUrl)) return html
  const footer =
    `<p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#71717a;">` +
    `<a href="${escapeEmailHtml(unsubscribeUrl)}" style="color:#71717a;">Unsubscribe</a></p>`
  const close = html.search(/<\/body\s*>/i)
  if (close === -1) return html + footer
  return html.slice(0, close) + footer + html.slice(close)
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
}

/** Plain-text alternative: block tags become line breaks, everything else is stripped. */
export function htmlToText(html: string): string {
  let text = html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
      const inner = label.replace(/<[^>]+>/g, "").trim()
      return inner && inner !== href ? `${inner} (${href})` : href
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
  text = text.replace(/&(#\d+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase()
    if (key in ENTITIES) return ENTITIES[key]
    if (key.startsWith("#")) {
      const code = Number(key.slice(1))
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return match
  })
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export interface RenderableEmailTemplate {
  subject: string
  bodyHtml: string
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
  unknownVariables: string[]
  bytes: number
}

export function renderEmailTemplate(
  template: RenderableEmailTemplate,
  ctx: EmailContext,
): RenderedEmail {
  const subject = renderEmailString(template.subject, ctx, { html: false })
  const body = renderEmailString(template.bodyHtml, ctx, { html: true })
  const document = isFullHtmlDocument(body.output)
    ? body.output
    : wrapEmailHtml(body.output, subject.output)
  const html = ensureUnsubscribeFooter(document, ctx.unsubscribe_url)
  const unknownVariables = [...new Set([...subject.unknown, ...body.unknown])]
  return {
    subject: subject.output.replace(/\s+/g, " ").trim(),
    html,
    text: htmlToText(html),
    unknownVariables,
    bytes: new TextEncoder().encode(html).length,
  }
}

/** Addresses a lead may be emailed at: primary, discovered, and decision makers. */
export function allowedRecipients(lead: EmailContextLead): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const push = (value: string | null | undefined) => {
    const normalized = value?.trim().toLowerCase()
    if (!normalized || !normalized.includes("@") || seen.has(normalized)) return
    seen.add(normalized)
    out.push(normalized)
  }
  push(lead.email)
  for (const e of lead.emails ?? []) push(e)
  for (const dm of lead.decisionMakers ?? []) push(dm.email)
  return out
}
