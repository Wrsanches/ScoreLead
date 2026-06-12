import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { requireAuthOnly } from "@/lib/auth-guard"
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

  await requireAuthOnly(locale)

  return (
    <div className="min-h-screen bg-zinc-950">
      {children}
    </div>
  )
}
