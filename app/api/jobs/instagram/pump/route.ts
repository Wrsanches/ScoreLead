import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { processInstagramQueue } from "@/lib/jobs/instagram-queue"

export const maxDuration = 60
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret)
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  const actual = Buffer.from(request.headers.get("authorization") || "")
  const expected = Buffer.from(`Bearer ${secret}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await processInstagramQueue())
}
