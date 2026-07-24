import { blogPosts } from "../lib/blog"
import { marketingPages } from "../lib/marketing"
import { getLocalizedUrl, supportedLocales } from "../lib/seo"

async function main() {
  const endpoint = `${process.env.SCORELEAD_PUBLIC_URL ?? "https://scorelead.io"}/api/indexnow`
  const secret = process.env.INDEXNOW_WEBHOOK_SECRET

  if (!secret) {
    throw new Error("INDEXNOW_WEBHOOK_SECRET is required")
  }

  const explicitUrls = process.argv.slice(2)
  const urls =
    explicitUrls.length > 0
      ? explicitUrls
      : [
          ...marketingPages.flatMap((page) =>
            supportedLocales.map((locale) => getLocalizedUrl(locale, page.pathname)),
          ),
          ...blogPosts.flatMap((post) =>
            supportedLocales.map((locale) =>
              getLocalizedUrl(locale, `blog/${post.slug}`),
            ),
          ),
        ]

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls }),
  })

  if (!response.ok) {
    throw new Error(`ScoreLead IndexNow endpoint returned HTTP ${response.status}`)
  }

  console.log(`Accepted ${urls.length} URLs for IndexNow submission.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
