import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getActiveViewableBusinessIdForUser } from "@/lib/active-business"
import { getBusinessAccess } from "@/lib/business-access"

export default async function NewDiscoveryJobLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  const businessId = session
    ? await getActiveViewableBusinessIdForUser(session.user.id)
    : null
  const access = session && businessId
    ? await getBusinessAccess(session.user.id, businessId)
    : null

  if (!access || access.readOnly) notFound()

  return children
}
