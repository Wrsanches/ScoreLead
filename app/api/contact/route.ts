import { createElement } from "react"
import { render } from "@react-email/render"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { ContactNotification } from "@/lib/emails/contact-notification"
import { rateLimit } from "@/lib/rate-limit"
import { contactSchema, type ContactSubmission } from "@/lib/validations/contact"

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "hello@scorelead.io"
const MAX_BODY_BYTES = 16_384

const inquiryLabels: Record<ContactSubmission["inquiryType"], string> = {
  sales: "Sales",
  support: "Product support",
  partnership: "Partnership",
}

function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown"
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")

  if (!origin || !host) return true

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

async function contactEmailHtml(data: ContactSubmission) {
  const rows: [string, string][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Company", data.company || "Not provided"],
    ["Inquiry", inquiryLabels[data.inquiryType]],
    ["Subject", data.subject],
  ]

  return render(
    createElement(ContactNotification, {
      subject: data.subject,
      inquiryLabel: inquiryLabels[data.inquiryType],
      rows,
      message: data.message,
    }),
  )
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 })
  }

  const limit = rateLimit(`contact:${requestIp(request)}`, 5, 15 * 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_submission" }, { status: 400 })
  }

  const data = parsed.data

  // Silently accept honeypot submissions so bots do not learn the filter.
  if (data.website) {
    return NextResponse.json({ success: true })
  }

  try {
    await sendEmail({
      to: CONTACT_EMAIL,
      replyTo: data.email,
      subject: `[${inquiryLabels[data.inquiryType]}] ${data.subject}`,
      html: await contactEmailHtml(data),
      tags: [
        { name: "category", value: "contact_form" },
        { name: "inquiry_type", value: data.inquiryType },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact email failed:", error)
    return NextResponse.json({ error: "send_failed" }, { status: 500 })
  }
}
