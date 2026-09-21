/**
 * Visual tokens for block emails, derived from the business's design system:
 * brand colors drive buttons, links, headings, accents and the page tint;
 * brand fonts load as web fonts (Apple Mail, iOS, and most webmail honor
 * them) with a system stack behind them; the brand style text nudges shape.
 */
export interface BrandTheme {
  primary: string
  secondary: string
  /** Very light tint of the primary for dividers and quiet borders. */
  accentSoft: string
  /** Body font stack, brand font first when known. */
  fontStack: string
  /** Heading font stack; the second brand font when two are set. */
  headingFontStack: string
  /** Google Fonts stylesheet for the brand fonts, or null for system fonts only. */
  webFontUrl: string | null
  text: string
  /** Heading color: the secondary brand color when it reads on white, else text. */
  headingColor: string
  muted: string
  /** Page background behind the card: a whisper of the primary. */
  background: string
  card: string
  radius: number
  buttonRadius: number
}

export const EMAIL_FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

export const DEFAULT_BRAND_THEME: BrandTheme = {
  primary: "#10b981",
  secondary: "#18181b",
  accentSoft: "#e4e4e7",
  fontStack: EMAIL_FONT_STACK,
  headingFontStack: EMAIL_FONT_STACK,
  webFontUrl: null,
  text: "#18181b",
  headingColor: "#18181b",
  muted: "#71717a",
  background: "#f4f4f5",
  card: "#ffffff",
  radius: 12,
  buttonRadius: 12,
}

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export function normalizeHex(value: string | null | undefined): string | null {
  if (!value || !HEX_RE.test(value.trim())) return null
  const raw = value.trim().slice(1)
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw
  return `#${full.toLowerCase()}`
}

function rgb(hex: string): [number, number, number] {
  const v = normalizeHex(hex) ?? "#000000"
  return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => c / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Black or white, whichever reads better on the given background. */
export function readableTextOn(hex: string): string {
  return luminance(hex) > 0.6 ? "#18181b" : "#ffffff"
}

/** Mix a color toward white; `amount` 0..1 is how much white. */
export function blendWithWhite(hex: string, amount: number): string {
  const [r, g, b] = rgb(hex)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

/** Fonts we can fetch from Google Fonts; anything else falls back to the system stack. */
const FONT_NAME_RE = /^[A-Za-z][A-Za-z0-9 ]{1,40}$/
const SYSTEM_FONTS = new Set(["arial", "helvetica", "helvetica neue", "georgia", "times new roman", "verdana", "system-ui", "sans-serif", "serif", "segoe ui", "roboto", "-apple-system"])

export function brandFontNames(fonts: string[] | null | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of fonts ?? []) {
    const name = raw.replace(/["']/g, "").split(",")[0]?.trim() ?? ""
    if (!FONT_NAME_RE.test(name) || SYSTEM_FONTS.has(name.toLowerCase()) || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    out.push(name)
    if (out.length === 2) break
  }
  return out
}

export function googleFontsUrl(names: string[]): string | null {
  if (names.length === 0) return null
  const families = names.map((n) => `family=${encodeURIComponent(n).replace(/%20/g, "+")}:wght@400;600;700`).join("&")
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

function stackWith(font: string | undefined): string {
  return font ? `'${font}',${EMAIL_FONT_STACK}` : EMAIL_FONT_STACK
}

/** Shape from the brand style description: sharp/minimal -> tight corners, rounded/playful -> pills. */
export function radiiFromStyle(style: string | null | undefined): { radius: number; buttonRadius: number } {
  const s = (style ?? "").toLowerCase()
  if (/\b(sharp|minimal|editorial|geometric|corporate|brutal|square)\b/.test(s)) return { radius: 6, buttonRadius: 6 }
  if (/\b(rounded|playful|friendly|soft|bubbly|organic|warm)\b/.test(s)) return { radius: 16, buttonRadius: 999 }
  return { radius: DEFAULT_BRAND_THEME.radius, buttonRadius: DEFAULT_BRAND_THEME.buttonRadius }
}

export function brandThemeFromBusiness(business: {
  brandColorPrimary?: string | null
  brandColorSecondary?: string | null
  brandColors?: string[] | null
  brandFonts?: string[] | null
  brandStyle?: string | null
}): BrandTheme {
  const palette = (business.brandColors ?? []).map(normalizeHex).filter((c): c is string => !!c)
  const primary = normalizeHex(business.brandColorPrimary) ?? palette[0] ?? DEFAULT_BRAND_THEME.primary
  const secondary = normalizeHex(business.brandColorSecondary) ?? palette.find((c) => c !== primary) ?? DEFAULT_BRAND_THEME.secondary
  const fonts = brandFontNames(business.brandFonts)
  const { radius, buttonRadius } = radiiFromStyle(business.brandStyle)
  return {
    ...DEFAULT_BRAND_THEME,
    primary,
    secondary,
    accentSoft: blendWithWhite(primary, 0.82),
    background: blendWithWhite(primary, 0.95),
    headingColor: luminance(secondary) < 0.45 ? secondary : DEFAULT_BRAND_THEME.text,
    fontStack: stackWith(fonts[0]),
    headingFontStack: stackWith(fonts[1] ?? fonts[0]),
    webFontUrl: googleFontsUrl(fonts),
    radius,
    buttonRadius,
  }
}
