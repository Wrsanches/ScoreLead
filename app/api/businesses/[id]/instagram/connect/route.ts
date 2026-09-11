import { rateLimit } from "@/lib/rate-limit"
import { randomBytes } from "node:crypto"
import { lt } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { instagramOAuthState } from "@/lib/db/schema"
import { authorizationUrl } from "@/lib/instagram/api"
import { instagramEnabled } from "@/lib/instagram/config"
import { instagramAccess, publishingResponse } from "@/lib/instagram/http"
import { stateHash } from "@/lib/instagram/security"
import { PublishingError } from "@/lib/instagram/validation"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { session } = await instagramAccess(request, id, true)
    if (!rateLimit(`instagram-connect:${session.user.id}`, 10, 60_000).allowed)
      throw new PublishingError("RATE_LIMITED", 429)
    if (!instagramEnabled())
      throw new PublishingError("INSTAGRAM_NOT_CONFIGURED", 503)
    const body = await request.json().catch(() => ({}))
    const locale = ["pt", "en", "es"].includes(body.locale) ? body.locale : "en"
    const state = randomBytes(32).toString("base64url")
    await db
      .delete(instagramOAuthState)
      .where(lt(instagramOAuthState.expiresAt, new Date()))
    await db
      .insert(instagramOAuthState)
      .values({
        hash: stateHash(state),
        userId: session.user.id,
        businessId: id,
        locale,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      })
    return NextResponse.json(
      { url: authorizationUrl(state) },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    return publishingResponse(error)
  }
}
