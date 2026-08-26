import { getIndexableUrls } from "../app/sitemap"

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
      : getIndexableUrls()

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

  const result = (await response.json()) as { accepted?: number }
  console.log(
    `Accepted ${result.accepted ?? urls.length} URLs for IndexNow submission.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
