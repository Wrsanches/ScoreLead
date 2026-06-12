import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { requireAuth } from "@/lib/auth-guard"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireAuth(locale)

  // The sidebar/chrome (AdminShell) is rendered by the business and settings
  // layouts below - NOT here - so the bare `/admin` index can redirect to the
  // active business without first painting the shell (which caused a visible
  // flash + client-side reload).
  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {children}
    </div>
  )
}
