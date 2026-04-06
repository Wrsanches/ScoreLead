import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

async function getUserBusiness(userId: string) {
  const result = await db
    .select()
    .from(business)
    .where(eq(business.userId, userId))
    .limit(1)
  return result[0] || null
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

  const biz = await getUserBusiness(session.user.id)

  if (!biz || !biz.onboardingCompleted) {
    redirect(`${prefix}/onboarding`)
  }

  return session
}

/** Redirect authenticated users away from auth pages (login/signup). */
export async function redirectIfAuthenticated(locale: string) {
  const session = await getSession()
  if (!session) return

  const prefix = locale === "en" ? "" : `/${locale}`
  const biz = await getUserBusiness(session.user.id)

  if (biz?.onboardingCompleted) {
    redirect(`${prefix}/admin`)
  } else {
    redirect(`${prefix}/onboarding`)
  }
}
