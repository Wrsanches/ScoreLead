import { setRequestLocale } from "next-intl/server"
import { requireAuthOnly } from "@/lib/auth-guard"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await requireAuthOnly(locale)

  // If already completed onboarding, redirect to admin
  const result = await db
    .select()
    .from(business)
    .where(eq(business.userId, session.user.id))
    .limit(1)

  if (result[0]?.onboardingCompleted) {
    const prefix = locale === "en" ? "" : `/${locale}`
    redirect(`${prefix}/admin`)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {children}
    </div>
  )
}
