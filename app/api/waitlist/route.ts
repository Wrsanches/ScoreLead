import { Resend } from "resend"
import { NextResponse } from "next/server"
import { z } from "zod"

const waitlistSchema = z.object({
  email: z.email(),
})

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function POST(request: Request) {
  const body = await request.json()
  const result = waitlistSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }

  const { email } = result.data
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: "ScoreLead <hello@ceramik.app>",
      to: process.env.NOTIFY_EMAIL!,
      subject: "New ScoreLead waitlist signup",
      html: `
        <h2>New waitlist signup</h2>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Date:</strong> ${new Date().toISOString()}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Resend error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
