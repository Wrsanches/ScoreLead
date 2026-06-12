import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const privateRoutes = [
    "/api/",
    "/admin/",
    "/*/admin/",
    "/onboarding/",
    "/*/onboarding/",
  ]

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: privateRoutes,
      },
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "DuckDuckBot",
          "OAI-SearchBot",
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Applebot",
          "Applebot-Extended",
        ],
        allow: ["/"],
        disallow: privateRoutes,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
