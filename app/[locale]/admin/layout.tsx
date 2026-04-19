import { cookies } from "next/headers"
import { setRequestLocale } from "next-intl/server"
import { requireAuth } from "@/lib/auth-guard"
import { AdminShell } from "@/components/admin-shell"
import { ActiveBusinessProvider } from "@/components/admin/active-business-context"
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/active-business"

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

  const cookieStore = await cookies()
  const initialBusinessId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value ?? null

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950">
      <ActiveBusinessProvider initialId={initialBusinessId}>
        <AdminShell>{children}</AdminShell>
      </ActiveBusinessProvider>
    </div>
  )
}
