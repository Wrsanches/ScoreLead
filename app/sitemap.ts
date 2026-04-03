import type { MetadataRoute } from "next"

const baseUrl = "https://scorelead.io"
const locales = ["en", "pt", "es"]

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemap: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    const url = locale === "en" ? baseUrl : `${baseUrl}/${locale}`

    sitemap.push({
      url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: baseUrl,
          pt: `${baseUrl}/pt`,
          es: `${baseUrl}/es`,
        },
      },
    })
  }

  return sitemap
}
