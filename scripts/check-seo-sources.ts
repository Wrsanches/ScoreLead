import { blogPosts } from "../lib/blog"

async function main() {
  const sources = Array.from(
    new Map(
      blogPosts
        .flatMap((post) => post.sources)
        .map((source) => [source.url, source]),
    ).values(),
  )

  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const response = await fetch(source.url, {
          redirect: "follow",
          headers: {
            "User-Agent": "ScoreLead source integrity check",
          },
        })
        return {
          ...source,
          status: response.status,
          ok: response.status >= 200 && response.status < 400,
        }
      } catch (error) {
        return {
          ...source,
          status: 0,
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }),
  )

  for (const result of results) {
    const status = result.status || "ERROR"
    console.log(`${status} ${result.url}`)
  }

  const failures = results.filter((result) => !result.ok)
  if (failures.length) {
    throw new Error(`${failures.length} SEO source URL(s) failed validation`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
