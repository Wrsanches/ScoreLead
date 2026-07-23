import { cookies } from "next/headers"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { getBusinessAccess, isPlatformAdmin } from "@/lib/business-access"

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
 * `?businessId=`). Validates ownership. An explicit id that is not owned never
 * falls back to another business; only callers that omit the id use the active
 * business fallback.
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
    return owned?.id ?? null
  }
  return getActiveBusinessIdForUser(userId)
}

/**
 * Admin-aware active business resolver used only by read/navigation paths.
 * Mutation paths must continue using resolveBusinessId so platform admins
 * cannot act as another organization.
 */
export async function getActiveViewableBusinessIdForUser(
  userId: string,
): Promise<string | null> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value ?? null

  if (fromCookie && (await getBusinessAccess(userId, fromCookie))) {
    return fromCookie
  }

  if (!(await isPlatformAdmin(userId))) {
    return getActiveBusinessIdForUser(userId)
  }

  const [first] = await db
    .select({ id: business.id })
    .from(business)
    .orderBy(business.createdAt)
    .limit(1)

  return first?.id ?? null
}

/**
 * Resolves an explicitly requested business for a read path. Unlike the legacy
 * owner-only resolver, an inaccessible explicit id never falls back to another
 * business, which prevents a misleading cross-tenant response.
 */
export async function resolveViewableBusiness(
  userId: string,
  requestedId: string | null | undefined,
) {
  if (requestedId) {
    return getBusinessAccess(userId, requestedId)
  }

  const activeId = await getActiveViewableBusinessIdForUser(userId)
  return activeId ? getBusinessAccess(userId, activeId) : null
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
