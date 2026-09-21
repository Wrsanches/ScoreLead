import { NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import { isSuppressed } from "@/lib/resend/data"
import { EmailSendError, sendTemplateEmail } from "@/lib/resend/send"
import { scopeLeadEmail } from "../_shared"

const schema = z.object({ templateId: z.string().min(1), to: z.string().trim().toLowerCase().email() })

export const maxDuration = 30

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  const scoped = await scopeLeadEmail(id, parsed.data.templateId)
  if ("error" in scoped) return scoped.error

  const to = parsed.data.to
  if (!scoped.recipients.includes(to)) {
    return NextResponse.json(
      { error: "That address does not belong to this lead", code: "RECIPIENT_NOT_ALLOWED" },
      { status: 400 },
    )
  }
  if (await isSuppressed(scoped.lead.businessId, to)) {
    return NextResponse.json(
      { error: "This address has bounced, complained, or unsubscribed", code: "RECIPIENT_SUPPRESSED" },
      { status: 409 },
    )
  }
  const limit = rateLimit(`resend:send:${scoped.lead.businessId}`, 20, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many emails in a short time", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    )
  }

  try {
    const message = await sendTemplateEmail({
      connection: scoped.connection,
      template: scoped.template,
      lead: scoped.lead,
      business: scoped.business,
      senderName: scoped.session.user.name,
      to,
      sentByUserId: scoped.session.user.id,
    })
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof EmailSendError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status, headers: error.status === 429 ? { "Retry-After": "1" } : undefined },
      )
    }
    console.error("[resend] send failed:", error)
    return NextResponse.json({ error: "Could not send the email", code: "PROVIDER_ERROR" }, { status: 502 })
  }
}
