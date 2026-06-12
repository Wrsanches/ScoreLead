import type { MetadataRoute } from "next"
import { getLocalizedUrl, languageAlternates, supportedLocales } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return supportedLocales.map((locale) => ({
    url: getLocalizedUrl(locale),
    lastModified,
    changeFrequency: "weekly",
    priority: 1,
    alternates: {
      languages: languageAlternates,
    },
  }))
}
