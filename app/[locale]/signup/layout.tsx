import type { Metadata } from "next"
import { redirectIfAuthenticated } from "@/lib/auth-guard"
import { generatePageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "signup")
}

export default async function SignUpLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await redirectIfAuthenticated(locale)

  return <>{children}</>
}
