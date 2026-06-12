import type { Metadata } from "next"
import { AdminShell } from "@/components/admin-shell"
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
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
