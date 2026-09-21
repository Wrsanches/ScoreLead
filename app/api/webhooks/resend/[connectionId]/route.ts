import { NextResponse } from "next/server"
import { createResendClient } from "@/lib/resend/client"
import { connectionWebhookSecret, getResendConnectionById } from "@/lib/resend/data"
import { processResendWebhook, type ResendEmailEvent } from "@/lib/resend/webhooks"

export const maxDuration = 30

/**
 * Per-connection endpoint: the customer's Resend account posts here. The path
 * only tells us which signing secret to check; nothing is trusted until the
 * Svix signature verifies against the raw body.
 */
export async function POST(request: Request, { params }: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = await params
  const connection = await getResendConnectionById(connectionId)
  if (!connection) return NextResponse.json({ error: "Unknown connection" }, { status: 404 })
  const secret = connectionWebhookSecret(connection)
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured", code: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 })
  }

  const payload = await request.text()
  const id = request.headers.get("svix-id")
  const timestamp = request.headers.get("svix-timestamp")
  const signature = request.headers.get("svix-signature")
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 401 })
  }

  let event: ResendEmailEvent
  try {
    // Verification is purely local (HMAC); the client needs no real key here.
    event = createResendClient("re_webhook_verify_only").webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    }) as unknown as ResendEmailEvent
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    await processResendWebhook(connection, event, id)
  } catch (error) {
    console.error("[resend] webhook processing failed:", error)
    // Acknowledge anyway: the event is recorded as claimed and a retry would be a no-op.
  }
  return NextResponse.json({ ok: true })
}
