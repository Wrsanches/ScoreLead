import { after } from "next/server"
import { z } from "zod"
import { submitIndexNow } from "@/lib/indexnow"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const requestSchema = z.object({
  urls: z.array(z.string().min(1)).min(1).max(10_000),
})

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : null
}

export async function POST(request: Request) {
  const expectedSecret = process.env.INDEXNOW_WEBHOOK_SECRET
  if (!expectedSecret || readBearerToken(request) !== expectedSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json(
      { error: "Expected an array of 1 to 10,000 ScoreLead URLs." },
      { status: 400 },
    )
  }

  const urls = parsed.data.urls
  after(async () => {
    try {
      await submitIndexNow(urls)
    } catch (error) {
      console.error("IndexNow submission failed", error)
    }
  })

  return Response.json({ accepted: urls.length }, { status: 202 })
}
