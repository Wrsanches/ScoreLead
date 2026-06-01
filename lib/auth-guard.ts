import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getActiveBusinessIdForUser } from "@/lib/active-business"

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

async function hasCompletedBusiness(userId: string) {
  const rows = await db
    .select({ onboardingCompleted: business.onboardingCompleted })
    .from(business)
    .where(eq(business.userId, userId))
  return rows.some(r => r.onboardingCompleted)
}

/** Auth only - no onboarding check. Used by onboarding layout. */
export async function requireAuthOnly(locale: string) {
  const session = await getSession()

  if (!session) {
    const prefix = locale === "en" ? "" : `/${locale}`
    redirect(`${prefix}/login`)
  }

  return session
}

/** Full guard - requires auth + completed onboarding. Used by admin layout. */
export async function requireAuth(locale: string) {
  const session = await requireAuthOnly(locale)
  const prefix = locale === "en" ? "" : `/${locale}`

  const completed = await hasCompletedBusiness(session.user.id)

  if (!completed) {
    redirect(`${prefix}/onboarding`)
  }

  return session
}

/** Redirect authenticated users away from auth pages (login/signup). */
export async function redirectIfAuthenticated(locale: string) {
  const session = await getSession()
  if (!session) return

  const prefix = locale === "en" ? "" : `/${locale}`
  const completed = await hasCompletedBusiness(session.user.id)

  if (!completed) {
    redirect(`${prefix}/onboarding`)
  }

  // Land directly on the active business so we skip the bare `/admin` resolver
  // (which would meta-refresh redirect and flash an interstitial).
  const businessId = await getActiveBusinessIdForUser(session.user.id)
  redirect(businessId ? `${prefix}/admin/business/${businessId}` : `${prefix}/admin`)
}
