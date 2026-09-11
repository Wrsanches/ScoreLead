import { eq, or } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { instagramConnection } from "@/lib/db/schema"
import { disconnectInstagram } from "@/lib/instagram/data"
import { signedInstagramUser } from "@/lib/instagram/security"

export async function POST(request: Request) {
  const secret = process.env.INSTAGRAM_APP_SECRET
  if (!secret)
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  const form = await request.formData().catch(() => null)
  const signed = form?.get("signed_request")
  const userId =
    typeof signed === "string" && signed.length < 10_000
      ? signedInstagramUser(signed, secret)
      : null
  if (!userId)
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
  const rows = await db
    .select({ id: instagramConnection.id })
    .from(instagramConnection)
    .where(
      or(
        eq(instagramConnection.oauthUserId, userId),
        eq(instagramConnection.instagramUserId, userId),
      ),
    )
  for (const row of rows) await disconnectInstagram(row.id, true)
  return NextResponse.json({ success: true })
}
