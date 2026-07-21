import { NextResponse } from "next/server"
import { escapeHtml, sendEmail } from "@/lib/email"
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

function contactEmailHtml(data: ContactSubmission) {
  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["Company", data.company || "Not provided"],
    ["Inquiry", inquiryLabels[data.inquiryType]],
    ["Subject", data.subject],
  ]

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #e4e4e7;">
                <p style="margin:0 0 6px;color:#059669;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">ScoreLead contact form</p>
                <h1 style="margin:0;font-size:22px;line-height:1.3;">${escapeHtml(data.subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${rows.map(([label, value]) => `
                    <tr>
                      <td style="width:110px;padding:7px 12px 7px 0;color:#71717a;font-size:13px;vertical-align:top;">${label}</td>
                      <td style="padding:7px 0;color:#27272a;font-size:14px;">${escapeHtml(value)}</td>
                    </tr>
                  `).join("")}
                </table>
                <div style="margin-top:20px;padding:18px;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.65;">${escapeHtml(data.message)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
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
      html: contactEmailHtml(data),
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
