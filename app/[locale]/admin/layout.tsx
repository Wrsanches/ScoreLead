import { setRequestLocale } from "next-intl/server"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950">
      {children}
    </div>
  )
}
