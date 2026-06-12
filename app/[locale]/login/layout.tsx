import type { Metadata } from "next"
import { redirectIfAuthenticated } from "@/lib/auth-guard"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LoginLayout({
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
