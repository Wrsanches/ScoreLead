import { notFound } from "next/navigation"
import { requireAuthOnly } from "@/lib/auth-guard"
import { getBusinessAccess } from "@/lib/business-access"

export default async function NewDiscoveryJobLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ businessId: string; locale: string }>
}) {
  const { businessId, locale } = await params
  const session = await requireAuthOnly(locale)
  const access = await getBusinessAccess(session.user.id, businessId)

  if (!access || access.readOnly) notFound()

  return children
}
