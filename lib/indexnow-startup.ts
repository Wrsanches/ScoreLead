import { getIndexableUrls } from "@/app/sitemap"
import { getIndexNowKey, submitIndexNow } from "@/lib/indexnow"

export async function submitIndexableUrlsOnStartup() {
  if (process.env.NODE_ENV !== "production" || !getIndexNowKey()) {
    return
  }

  try {
    const result = await submitIndexNow(getIndexableUrls())
    console.info(`Submitted ${result.submitted} URLs to IndexNow.`)
  } catch (error) {
    console.error("Automatic IndexNow submission failed", error)
  }
}
