import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "@/lib/timezone"

/** The user's saved zone, or null when they have not been seen in a browser yet. */
export async function getUserTimeZone(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ timezone: user.timezone })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  return isValidTimeZone(row?.timezone) ? row.timezone : null
}

/** Same as getUserTimeZone but never null: falls back to UTC for server jobs. */
export async function getUserTimeZoneOrDefault(userId: string): Promise<string> {
  return (await getUserTimeZone(userId)) ?? DEFAULT_TIME_ZONE
}
