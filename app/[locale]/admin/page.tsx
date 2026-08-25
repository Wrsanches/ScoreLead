import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getActiveViewableBusinessIdForUser } from "@/lib/active-business"
import DashboardPage from "./business/[businessId]/page"
import { generatePageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "dashboard")
}

/**
 * The dashboard keeps its clean `/admin` URL. The parent layout resolves and
 * validates the active business from the selection cookie.
 */
export default async function AdminIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const prefix = locale === "en" ? "" : `/${locale}`

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`${prefix}/login`)

  const activeBusinessId = await getActiveViewableBusinessIdForUser(session.user.id)
  if (!activeBusinessId) redirect(`${prefix}/onboarding`)

  return <DashboardPage />
}
