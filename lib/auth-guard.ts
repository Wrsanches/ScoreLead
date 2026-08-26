import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import {
  getActiveViewableBusinessIdForUser,
} from "@/lib/active-business"
import { isPlatformAdmin } from "@/lib/business-access"

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

const hasCompletedBusiness = cache(async (userId: string) => {
  const rows = await db
    .select({ onboardingCompleted: business.onboardingCompleted })
    .from(business)
    .where(eq(business.userId, userId))
  return rows.some(r => r.onboardingCompleted)
})

/** Auth only - no onboarding check. Used by onboarding layout. */
export const requireAuthOnly = cache(async function requireAuthOnly(locale: string) {
  const session = await getSession()

  if (!session) {
    const prefix = locale === "en" ? "" : `/${locale}`
    redirect(`${prefix}/login`)
  }

  return session
})

/** Full guard - requires auth + completed onboarding. Used by admin layout. */
export const requireAuth = cache(async function requireAuth(locale: string) {
  const session = await requireAuthOnly(locale)
  const prefix = locale === "en" ? "" : `/${locale}`

  if (await isPlatformAdmin(session.user.id)) {
    return session
  }

  const completed = await hasCompletedBusiness(session.user.id)

  if (!completed) {
    redirect(`${prefix}/onboarding`)
  }

  return session
})

/** Redirect authenticated users away from auth pages (login/signup). */
export async function redirectIfAuthenticated(locale: string) {
  const session = await getSession()
  if (!session) return

  const prefix = locale === "en" ? "" : `/${locale}`
  const admin = await isPlatformAdmin(session.user.id)
  const completed = await hasCompletedBusiness(session.user.id)

  if (!admin && !completed) {
    redirect(`${prefix}/onboarding`)
  }

  const businessId = await getActiveViewableBusinessIdForUser(session.user.id)
  redirect(businessId ? `${prefix}/admin` : `${prefix}/onboarding`)
}
