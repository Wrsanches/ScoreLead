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
  const searchCrawlers = [
    "Googlebot",
    "Bingbot",
    "DuckDuckBot",
    "OAI-SearchBot",
    "Claude-SearchBot",
    "PerplexityBot",
    "Applebot",
  ]
  const userInitiatedCrawlers = [
    "ChatGPT-User",
    "Claude-User",
    "Perplexity-User",
  ]
  // Training access is a separate policy choice from search visibility.
  // Keep these agents in their own group so that choice can be changed without
  // accidentally blocking search or user-requested retrieval.
  const trainingCrawlers = ["GPTBot", "ClaudeBot", "Applebot-Extended"]

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: privateRoutes,
      },
      {
        userAgent: searchCrawlers,
        allow: ["/"],
        disallow: privateRoutes,
      },
      {
        userAgent: userInitiatedCrawlers,
        allow: ["/"],
        disallow: privateRoutes,
      },
      {
        userAgent: trainingCrawlers,
        allow: ["/"],
        disallow: privateRoutes,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
