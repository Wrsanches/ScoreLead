import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getActiveViewableBusinessIdForUser } from "@/lib/active-business"

/**
 * Bare `/admin` has no business in the URL. Resolve the user's active business
 * (validated cookie, else their first business) and redirect into the
 * business-scoped dashboard. The admin layout's requireAuth has already
 * guaranteed a completed business exists.
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

  const businessId = await getActiveViewableBusinessIdForUser(session.user.id)
  if (!businessId) redirect(`${prefix}/onboarding`)

  redirect(`${prefix}/admin/business/${businessId}`)
}
