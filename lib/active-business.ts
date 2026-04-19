import { cookies } from "next/headers"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"

/** Cookie name used on both client and server. */
export const ACTIVE_BUSINESS_COOKIE = "active_business_id"

/**
 * Resolves the active business for a signed-in user.
 *
 * Priority:
 *   1. Cookie value, if it points at a business owned by this user.
 *   2. First onboarding-completed business for the user.
 *   3. First business for the user (for users mid-onboarding).
 *
 * Returns null if the user has no businesses.
 */
export async function getActiveBusinessIdForUser(
  userId: string,
): Promise<string | null> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value ?? null

  if (fromCookie) {
    const [owned] = await db
      .select({ id: business.id })
      .from(business)
      .where(and(eq(business.id, fromCookie), eq(business.userId, userId)))
    if (owned) return owned.id
  }

  const rows = await db
    .select({ id: business.id, onboardingCompleted: business.onboardingCompleted })
    .from(business)
    .where(eq(business.userId, userId))

  const completed = rows.find((b) => b.onboardingCompleted)
  return (completed ?? rows[0])?.id ?? null
}

/**
 * Same as getActiveBusinessIdForUser but returns the full row for callers
 * that need more than just the ID.
 */
export async function getActiveBusinessForUser(userId: string) {
  const id = await getActiveBusinessIdForUser(userId)
  if (!id) return null
  const [row] = await db
    .select()
    .from(business)
    .where(and(eq(business.id, id), eq(business.userId, userId)))
  return row ?? null
}
