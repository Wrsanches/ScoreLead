import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { requireAuth } from "@/lib/auth-guard"
import { AdminShell } from "@/components/admin-shell"
import { isPlatformAdmin } from "@/lib/business-access"

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
  const session = await requireAuth(locale)
  const platformAdmin = await isPlatformAdmin(session.user.id)

  // The sidebar/chrome is rendered ONCE here so it persists across every admin
  // route (business, settings, support) - navigating between them no longer
  // remounts the sidebar. The bare `/admin` page does a server-side redirect,
  // so it returns before this shell ever paints (no flash on the redirect).
  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <AdminShell
        userEmail={session.user.email}
        isPlatformAdmin={platformAdmin}
      >
        {children}
      </AdminShell>
    </div>
  )
}
