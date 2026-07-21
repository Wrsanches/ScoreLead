import { NextResponse } from "next/server"
import { processWhatsAppQueue } from "@/lib/jobs/whatsapp-queue"

export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 })
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await processWhatsAppQueue()
  return NextResponse.json({ ok: true })
}
