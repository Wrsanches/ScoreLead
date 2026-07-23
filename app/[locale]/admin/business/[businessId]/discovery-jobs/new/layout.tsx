import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getBusinessAccess } from "@/lib/business-access"

export default async function NewDiscoveryJobLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ businessId: string }>
}) {
  const { businessId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const access = session
    ? await getBusinessAccess(session.user.id, businessId)
    : null

  if (!access || access.readOnly) notFound()

  return children
}
