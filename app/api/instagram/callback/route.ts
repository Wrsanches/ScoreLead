import { consumeInstagramState } from "@/lib/instagram/data"
import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  business,
  instagramConnection,
  instagramPublication,
} from "@/lib/db/schema"
import { getBusinessAccess } from "@/lib/business-access"
import { getLocalizedAppPath } from "@/lib/site-urls"
import { exchangeInstagramCode, instagramProfile, InstagramApiError } from "@/lib/instagram/api"
import { instagramConfig, instagramEnabled } from "@/lib/instagram/config"
import { encryptInstagramToken, stateHash } from "@/lib/instagram/security"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const state = url.searchParams.get("state") || ""
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session || !/^[A-Za-z0-9_-]{43}$/.test(state))
    return NextResponse.json({ error: "INVALID_OAUTH_STATE" }, { status: 400 })
  // Consume atomically, even on denial: replay and another user's callback fail.
  const pending = await consumeInstagramState(stateHash(state), session.user.id)
  if (!pending)
    return NextResponse.json({ error: "INVALID_OAUTH_STATE" }, { status: 400 })
  const destination = new URL(
    getLocalizedAppPath(
      `/admin/business/${pending.businessId}/integrations`,
      pending.locale,
    ),
    new URL(instagramConfig().redirectUri).origin,
  )
  let outcome = "AUTH_FAILED"
  let stage = "access"
  try {
    if (!instagramEnabled(pending.businessId)) throw new Error("disabled")
    const access = await getBusinessAccess(session.user.id, pending.businessId)
    if (!access || access.readOnly) throw new Error("forbidden")
    if (url.searchParams.has("error")) {
      outcome = "AUTH_CANCELLED"
      throw new Error("denied")
    }
    const code = url.searchParams.get("code")
    if (!code || code.length > 4096) throw new Error("missing code")
    stage = "token_exchange"
    const token = await exchangeInstagramCode(code)
    stage = "profile"
    const profile = await instagramProfile(token.access_token)
    stage = "save_connection"
    await db.transaction(async (tx) => {
      await tx
        .select({ id: business.id })
        .from(business)
        .where(eq(business.id, pending.businessId))
        .for("update")
      const [existing] = await tx
        .select()
        .from(instagramConnection)
        .where(eq(instagramConnection.businessId, pending.businessId))
        .for("update")
      if (existing && existing.instagramUserId !== profile.instagramUserId) {
        const jobs = await tx
          .select({ status: instagramPublication.status })
          .from(instagramPublication)
          .where(eq(instagramPublication.connectionId, existing.id))
        if (
          existing.status !== "disconnected" ||
          jobs.some((job) =>
            ["scheduled", "publishing", "needs_review"].includes(job.status),
          )
        ) {
          outcome = "DISCONNECT_FIRST"
          throw new Error("different account")
        }
      }
      const values = {
        ...profile,
        oauthUserId: token.oauthUserId,
        accessTokenEncrypted: encryptInstagramToken(
          token.access_token,
          pending.businessId,
        ),
        status: "connected",
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        refreshAfter: new Date(
          Date.now() + Math.min(30 * 86400, token.expires_in / 2) * 1000,
        ),
        updatedAt: new Date(),
      }
      if (existing)
        await tx
          .update(instagramConnection)
          .set(values)
          .where(eq(instagramConnection.id, existing.id))
      else
        await tx
          .insert(instagramConnection)
          .values({
            id: randomUUID(),
            businessId: pending.businessId,
            ...values,
          })
    })
    outcome = "connected"
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INSTAGRAM_PERMISSIONS_REQUIRED"
    )
      outcome = "PERMISSIONS_REQUIRED"
    // A unique constraint prevents an Instagram account from belonging to two tenants.
    const dbError = error as { code?: string; cause?: { code?: string } }
    if (dbError.code === "23505" || dbError.cause?.code === "23505")
      outcome = "ACCOUNT_ALREADY_CONNECTED"
    // Log only bounded diagnostic metadata, never provider payloads or tokens.
    console.warn("[instagram] OAuth connection failed", {
      stage,
      outcome,
      ...(error instanceof InstagramApiError ? {
        providerCode: error.code,
        httpStatus: error.httpStatus,
      } : {}),
      ...(error instanceof Error && [
        "INSTAGRAM_NOT_CONFIGURED", "INSTAGRAM_AUTH_FAILED",
        "INSTAGRAM_PERMISSIONS_REQUIRED", "TimeoutError", "AbortError",
      ].includes(error.message) ? { reason: error.message } : {}),
      ...(/^[A-Z0-9]{5}$/.test(dbError.code || dbError.cause?.code || "")
        ? { databaseCode: dbError.code || dbError.cause?.code } : {}),
    })
  }
  destination.searchParams.set("instagram", outcome)
  return NextResponse.redirect(destination, {
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  })
}
