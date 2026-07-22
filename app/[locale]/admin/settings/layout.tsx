import type { Metadata } from "next"
import { headers } from "next/headers"
import { AdminShell } from "@/components/admin-shell"
import { auth } from "@/lib/auth"
import { generatePageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "settings")
}

// Settings is user-scoped (no businessId in the URL) but still needs the admin
// chrome, so it renders its own AdminShell.
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  return <AdminShell userEmail={session?.user.email}>{children}</AdminShell>
}
