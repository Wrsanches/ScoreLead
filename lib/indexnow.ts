import "server-only"
import { siteConfig } from "@/lib/seo"

const keyPattern = /^[A-Za-z0-9-]{8,128}$/

export function getIndexNowKey() {
  const key = process.env.INDEXNOW_KEY?.trim()
  return key && keyPattern.test(key) ? key : null
}

export function normalizeIndexNowUrls(urls: string[]) {
  const siteUrl = new URL(siteConfig.url)
  return Array.from(
    new Set(
      urls
        .map((value) => {
          try {
            const url = new URL(value, siteUrl)
            if (url.origin !== siteUrl.origin) return null
            url.hash = ""
            return url.toString()
          } catch {
            return null
          }
        })
        .filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 10_000)
}

export async function submitIndexNow(urls: string[]) {
  const key = getIndexNowKey()
  if (!key) {
    throw new Error("INDEXNOW_KEY is missing or invalid")
  }

  const urlList = normalizeIndexNowUrls(urls)
  if (!urlList.length) {
    throw new Error("No valid ScoreLead URLs were supplied")
  }

  const siteUrl = new URL(siteConfig.url)
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: siteUrl.host,
      key,
      keyLocation: `${siteConfig.url}/indexnow-key.txt`,
      urlList,
    }),
    cache: "no-store",
  })

  if (!response.ok && response.status !== 202) {
    throw new Error(`IndexNow returned HTTP ${response.status}`)
  }

  return { status: response.status, submitted: urlList.length }
}
