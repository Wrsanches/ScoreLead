import { NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import { ResendApiError, verifyResendApiKey } from "@/lib/resend/client"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { RESEND_API_KEY_RE } from "@/lib/resend/template-form"

const schema = z.object({ apiKey: z.string().trim().regex(RESEND_API_KEY_RE) })

/** Checks a pasted key and lists its domains. Stores nothing. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const limit = rateLimit(`resend:verify:${scoped.session.user.id}`, 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    )
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "That does not look like a Resend API key", code: "INVALID_API_KEY" }, { status: 400 })
  }
  try {
    const verified = await verifyResendApiKey(parsed.data.apiKey)
    return NextResponse.json(verified)
  } catch (error) {
    if (error instanceof ResendApiError) {
      return NextResponse.json({ error: error.message, code: "INVALID_API_KEY" }, { status: 400 })
    }
    return NextResponse.json({ error: "Could not reach Resend", code: "PROVIDER_ERROR" }, { status: 502 })
  }
}
