import { createElement } from "react"
import { render } from "@react-email/render"
import { Resend, type CreateEmailOptions } from "resend"
import { ActionEmail } from "./emails/action-email"

/**
 * Transactional email sender (Resend). Auth emails must not silently fail:
 * callers decide whether a failure is fatal (better-auth surfaces thrown
 * errors as a 500 on the triggering request).
 */

const DEFAULT_FROM = "ScoreLead <hello@uspostage.io>"
const DEFAULT_REPLY_TO = "hello@uspostage.io"

type EmailOptionsWithDefaults<T> = T extends unknown
  ? Omit<T, "from" | "replyTo"> & {
      from?: string
      replyTo?: string | string[]
    }
  : never

type SendEmailOptions = EmailOptionsWithDefaults<CreateEmailOptions>

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured")
  }
  return new Resend(process.env.RESEND_API_KEY)
}

/**
 * Send through Resend with the app-wide sender and Google Workspace reply
 * address. Resend reports API failures in the response instead of throwing,
 * so normalize them to exceptions for callers that require delivery.
 */
export async function sendEmail(options: SendEmailOptions) {
  const { data, error } = await getResend().emails.send({
    ...options,
    from: options.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM,
    replyTo: options.replyTo ?? process.env.EMAIL_REPLY_TO ?? DEFAULT_REPLY_TO,
  } as CreateEmailOptions)

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`, { cause: error })
  }

  return data
}

export function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendVerificationEmail(opts: {
  to: string
  name: string | null
  url: string
}) {
  const firstName = opts.name?.split(" ")[0]
  const element = createElement(ActionEmail, {
    preview: "Confirm your email to activate your ScoreLead account.",
    heading: firstName ? `Welcome, ${firstName}!` : "Welcome!",
    intro:
      "Confirm your email address to activate your ScoreLead account and start discovering leads.",
    ctaLabel: "Verify email",
    url: opts.url,
    note: "This link expires in 1 hour. If you didn't create a ScoreLead account, you can safely ignore this email.",
  })
  await sendEmail({
    to: opts.to,
    subject: "Verify your email - ScoreLead",
    html: await render(element),
    text: await render(element, { plainText: true }),
  })
}

export async function sendPasswordResetEmail(opts: {
  to: string
  name: string | null
  url: string
}) {
  const element = createElement(ActionEmail, {
    preview: "Reset your ScoreLead password.",
    heading: "Reset your password",
    intro:
      "We received a request to reset the password for your ScoreLead account. Click the button below to choose a new one.",
    ctaLabel: "Reset password",
    url: opts.url,
    note: "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email - your password won't change.",
  })
  await sendEmail({
    to: opts.to,
    subject: "Reset your password - ScoreLead",
    html: await render(element),
    text: await render(element, { plainText: true }),
  })
}
