import { setRequestLocale } from "next-intl/server"
import { requireAuth } from "@/lib/auth-guard"

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950">
      {children}
    </div>
  )
}
