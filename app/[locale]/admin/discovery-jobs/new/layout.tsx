import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth-guard"
import { getActiveViewableBusinessIdForUser } from "@/lib/active-business"
import { getBusinessAccess } from "@/lib/business-access"

export default async function NewDiscoveryJobLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await requireAuth(locale)
  const businessId = await getActiveViewableBusinessIdForUser(session.user.id)
  const access = businessId
    ? await getBusinessAccess(session.user.id, businessId)
    : null

  if (!access || access.readOnly) notFound()

  return children
}
