import type { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog"
import { marketingPages } from "@/lib/marketing"
import { getLanguageAlternates, getLocalizedUrl, supportedLocales } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { pathname: "", lastModified: "2026-07-23", changeFrequency: "weekly" as const, priority: 1 },
    { pathname: "contact", lastModified: "2026-07-22", changeFrequency: "monthly" as const, priority: 0.7 },
    { pathname: "blog", lastModified: "2026-07-23", changeFrequency: "weekly" as const, priority: 0.8 },
    { pathname: "privacy", lastModified: "2026-07-22", changeFrequency: "yearly" as const, priority: 0.4 },
    { pathname: "terms", lastModified: "2026-07-22", changeFrequency: "yearly" as const, priority: 0.4 },
    { pathname: "data-deletion", lastModified: "2026-07-22", changeFrequency: "yearly" as const, priority: 0.4 },
  ]

  const staticPages = pages.flatMap((page) =>
    supportedLocales.map((locale) => ({
      url: getLocalizedUrl(locale, page.pathname),
      lastModified: new Date(`${page.lastModified}T12:00:00Z`),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: getLanguageAlternates(page.pathname),
      },
    })),
  )

  const blogPages = blogPosts.flatMap((post) =>
    supportedLocales.map((locale) => {
      const pathname = `blog/${post.slug}`
      return {
        url: getLocalizedUrl(locale, pathname),
        lastModified: new Date(`${post.updatedAt}T12:00:00Z`),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: {
          languages: getLanguageAlternates(pathname),
        },
      }
    }),
  )

  const commercialPages = marketingPages.flatMap((page) =>
    supportedLocales.map((locale) => ({
      url: getLocalizedUrl(locale, page.pathname),
      lastModified: new Date(`${page.updatedAt}T12:00:00Z`),
      changeFrequency: page.group === "tools" ? ("monthly" as const) : ("weekly" as const),
      priority: page.group === "company" ? 0.7 : 0.8,
      alternates: {
        languages: getLanguageAlternates(page.pathname),
      },
    })),
  )

  return [...staticPages, ...commercialPages, ...blogPages]
}
