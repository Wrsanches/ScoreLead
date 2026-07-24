import { getIndexNowKey } from "@/lib/indexnow"

export const dynamic = "force-dynamic"

export function GET() {
  const key = getIndexNowKey()
  if (!key) {
    return new Response("Not configured", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  }

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  })
}
