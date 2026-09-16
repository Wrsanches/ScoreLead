import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user, DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { isValidTimeZone } from "@/lib/timezone"

const preferencesSchema = z
  .object({
    leadAlerts: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
    timezone: z
      .string()
      .refine(isValidTimeZone, "Unknown time zone")
      .optional(),
  })
  .strict()

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [row] = await db
    .select({
      notificationPreferences: user.notificationPreferences,
      timezone: user.timezone,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  return NextResponse.json({
    preferences: row?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
    timezone: row?.timezone ?? null,
  })
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = preferencesSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const [current] = await db
    .select({ notificationPreferences: user.notificationPreferences })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  const { timezone, ...notificationPatch } = parsed.data
  const merged = {
    ...(current?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES),
    ...notificationPatch,
  }

  await db
    .update(user)
    .set({
      notificationPreferences: merged,
      ...(timezone ? { timezone } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id))

  return NextResponse.json({ success: true, preferences: merged, timezone: timezone ?? null })
}
