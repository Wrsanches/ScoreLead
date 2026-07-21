import { Resend, type CreateEmailOptions } from "resend"

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

function authEmailHtml(opts: {
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
  footer: string
}) {
  const url = escapeHtml(opts.ctaUrl)
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 24px;font-size:15px;font-weight:700;color:#10b981;letter-spacing:-0.02em;">ScoreLead</p>
                <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#18181b;letter-spacing:-0.02em;">${opts.heading}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">${opts.body}</p>
                <a href="${url}" style="display:inline-block;background-color:#10b981;color:#09090b;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;">${opts.ctaLabel}</a>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">${opts.footer}</p>
                <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;word-break:break-all;">If the button doesn't work, copy this link: ${url}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function sendVerificationEmail(opts: {
  to: string
  name: string | null
  url: string
}) {
  const firstName = opts.name?.split(" ")[0]
  await sendEmail({
    to: opts.to,
    subject: "Verify your email - ScoreLead",
    html: authEmailHtml({
      heading: firstName ? `Welcome, ${escapeHtml(firstName)}!` : "Welcome!",
      body: "Confirm your email address to activate your ScoreLead account and start discovering leads.",
      ctaLabel: "Verify email",
      ctaUrl: opts.url,
      footer:
        "This link expires in 1 hour. If you didn't create a ScoreLead account, you can safely ignore this email.",
    }),
  })
}

export async function sendPasswordResetEmail(opts: {
  to: string
  name: string | null
  url: string
}) {
  await sendEmail({
    to: opts.to,
    subject: "Reset your password - ScoreLead",
    html: authEmailHtml({
      heading: "Reset your password",
      body: "We received a request to reset the password for your ScoreLead account. Click the button below to choose a new one.",
      ctaLabel: "Reset password",
      ctaUrl: opts.url,
      footer:
        "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email - your password won't change.",
    }),
  })
}
