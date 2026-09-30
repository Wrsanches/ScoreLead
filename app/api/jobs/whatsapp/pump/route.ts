import { NextResponse } from "next/server"
import { processWhatsAppQueue } from "@/lib/jobs/whatsapp-queue"
import { processSupportQueue } from "@/lib/support/queue"

export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 })
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await processWhatsAppQueue()
  await processSupportQueue({ maxItems: 1 })
  return NextResponse.json({ ok: true })
}
