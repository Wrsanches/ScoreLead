import { NextResponse } from "next/server"
import { z } from "zod"
import { escapeHtml, sendEmail } from "@/lib/email"

const waitlistSchema = z.object({
  email: z.email(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const result = waitlistSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }

  const { email } = result.data
  const notifyEmail = process.env.NOTIFY_EMAIL

  if (!notifyEmail) {
    console.error("NOTIFY_EMAIL is not configured")
    return NextResponse.json({ error: "Email notification is not configured" }, { status: 500 })
  }

  try {
    await sendEmail({
      to: notifyEmail,
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
