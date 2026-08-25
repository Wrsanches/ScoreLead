import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export const routing = defineRouting({
  locales: ["en", "pt", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: true,
  // Next.js metadata and the sitemap publish the standards-facing `pt-BR`
  // hreflang. Disable next-intl's automatic HTTP Link header so it does not
  // publish a conflicting generic `pt` alternate for the same URL.
  alternateLinks: false,
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
