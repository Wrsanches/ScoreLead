import { NextResponse } from "next/server"
import { verifyMetaWebhookSignature } from "@/lib/whatsapp/security"
import { processWhatsAppWebhook } from "@/lib/whatsapp/webhooks"
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types"

export const maxDuration = 60

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")
  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } })
  }
  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 })
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifyMetaWebhookSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
  }
  let payload: WhatsAppWebhookPayload
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  await processWhatsAppWebhook(payload)
  return NextResponse.json({ ok: true })
}
