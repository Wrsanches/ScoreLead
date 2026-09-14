import { NextResponse } from "next/server"
import { processSupportReplies } from "@/lib/support/queue"

export const maxDuration = 120
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ code: "unauthorized" }, { status: 401 })
  await processSupportReplies()
  return NextResponse.json({ ok: true })
}
