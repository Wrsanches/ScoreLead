import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export const routing = defineRouting({
  locales: ["en", "pt", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Keep locale selection URL-driven so public HTML is deterministic and can
  // be cached at the CDN edge. LanguageSwitcher already links to explicit
  // locale URLs (`/` for English, `/pt`, `/es`), so neither Accept-Language
  // detection nor a response cookie is needed here.
  localeDetection: false,
  localeCookie: false,
  // Next.js metadata and the sitemap publish the standards-facing `pt-BR`
  // hreflang. Disable next-intl's automatic HTTP Link header so it does not
  // publish a conflicting generic `pt` alternate for the same URL.
  alternateLinks: false,
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
