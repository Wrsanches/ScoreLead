import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

/**
 * In dev we read the JSON off disk on every request so new translation
 * keys show up immediately after a hot-reload - no server restart needed.
 *
 * In production we cache the parsed JSON once per process. Reading a
 * ~30KB file once at startup is negligible and avoids repeated disk IO.
 */
const prodCache = new Map<string, Record<string, unknown>>()

function loadMessages(locale: string): Record<string, unknown> {
  const isDev = process.env.NODE_ENV !== "production"
  if (!isDev) {
    const hit = prodCache.get(locale)
    if (hit) return hit
  }
  const raw = readFileSync(
    join(process.cwd(), "i18n", "locales", `${locale}.json`),
    "utf8",
  )
  const parsed = JSON.parse(raw) as Record<string, unknown>
  if (!isDev) prodCache.set(locale, parsed)
  return parsed
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as "en" | "pt" | "es")) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: loadMessages(locale),
  }
})
