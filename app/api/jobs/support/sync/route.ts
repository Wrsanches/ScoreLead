import { NextResponse } from "next/server"
import { processSupportSync } from "@/lib/support/sync"

export const maxDuration = 300
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ code: "unauthorized" }, { status: 401 })
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json({ code: "ai_not_configured" }, { status: 503 })
  await processSupportSync()
  return NextResponse.json({ ok: true })
}
