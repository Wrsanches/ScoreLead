import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailMessage } from "@/lib/db/schema"
import { addSuppression } from "@/lib/resend/data"
import { verifyUnsubscribeToken } from "@/lib/resend/security"
import { escapeEmailHtml } from "@/lib/resend/render"

/**
 * Public one-click unsubscribe. The token is an HMAC over the message id, so
 * a valid link proves the visitor received that exact email. Idempotent.
 */
async function unsubscribe(token: string): Promise<{ ok: true; email: string } | { ok: false }> {
  let messageId: string | null
  try {
    messageId = verifyUnsubscribeToken(token)
  } catch {
    messageId = null
  }
  if (!messageId) return { ok: false }
  const [message] = await db.select().from(emailMessage).where(eq(emailMessage.id, messageId)).limit(1)
  if (!message) return { ok: false }
  await addSuppression({
    businessId: message.businessId,
    email: message.toEmail,
    reason: "unsubscribed",
    messageId: message.id,
  })
  return { ok: true, email: message.toEmail }
}

function page(title: string, body: string, status: number) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeEmailHtml(title)}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#09090b;color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}main{max-width:420px;padding:32px;text-align:center}h1{font-size:20px;margin:0 0 8px}p{margin:0;color:#a1a1aa;font-size:15px;line-height:1.6}</style></head><body><main><h1>${escapeEmailHtml(title)}</h1><p>${body}</p></main></body></html>`
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await unsubscribe(token)
  if (!result.ok) return page("Link not valid", "This unsubscribe link is invalid or has expired.", 400)
  return page("You're unsubscribed", `${escapeEmailHtml(result.email)} will not receive further emails from this sender.`, 200)
}

/** RFC 8058 one-click: mail clients POST here without a page load. */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await unsubscribe(token)
  return NextResponse.json({ ok: result.ok }, { status: result.ok ? 200 : 400 })
}
