import { redirectIfAuthenticated } from "@/lib/auth-guard"

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
