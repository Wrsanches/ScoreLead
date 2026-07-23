import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { redirect } from "next/navigation"
import { requireAuthOnly } from "@/lib/auth-guard"
import { getActiveViewableBusinessIdForUser } from "@/lib/active-business"
import { isPlatformAdmin } from "@/lib/business-access"
import { generatePageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "onboarding")
}

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

  if (await isPlatformAdmin(session.user.id)) {
    const businessId = await getActiveViewableBusinessIdForUser(session.user.id)
    if (businessId) {
      const prefix = locale === "en" ? "" : `/${locale}`
      redirect(`${prefix}/admin/business/${businessId}`)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {children}
    </div>
  )
}
