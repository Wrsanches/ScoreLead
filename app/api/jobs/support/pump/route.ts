import { NextResponse } from "next/server"
import { processSupportQueue } from "@/lib/support/queue"

export const maxDuration = 300
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "Worker is not configured" }, { status: 503 })
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await processSupportQueue()
  return NextResponse.json({ ok: true })
}
