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
 * Resolves a business id for a request that carries one explicitly (now the
 * primary path: the id lives in the URL and is passed to scoped APIs as
 * `?businessId=`). Validates ownership; if the requested id is missing or not
 * owned by the user, falls back to `getActiveBusinessIdForUser` (cookie/first
 * business) so older callers keep working.
 */
export async function resolveBusinessId(
  userId: string,
  requestedId: string | null | undefined,
): Promise<string | null> {
  if (requestedId) {
    const [owned] = await db
      .select({ id: business.id })
      .from(business)
      .where(and(eq(business.id, requestedId), eq(business.userId, userId)))
    if (owned) return owned.id
  }
  return getActiveBusinessIdForUser(userId)
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
