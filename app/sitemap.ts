import type { MetadataRoute } from "next"
import { getLanguageAlternates, getLocalizedUrl, supportedLocales } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const pages = [
    { pathname: "", changeFrequency: "weekly" as const, priority: 1 },
    { pathname: "contact", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "privacy", changeFrequency: "yearly" as const, priority: 0.4 },
    { pathname: "terms", changeFrequency: "yearly" as const, priority: 0.4 },
    { pathname: "data-deletion", changeFrequency: "yearly" as const, priority: 0.4 },
  ]

  return pages.flatMap((page) =>
    supportedLocales.map((locale) => ({
      url: getLocalizedUrl(locale, page.pathname),
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: getLanguageAlternates(page.pathname),
      },
    })),
  )
}
