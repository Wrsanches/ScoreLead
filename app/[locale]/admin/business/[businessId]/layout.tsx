import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { BusinessProvider } from "@/components/admin/business-context"
import { AdminShell } from "@/components/admin-shell"

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ businessId: string }>
}) {
  const { businessId } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  // The admin layout already enforced auth; this guards that the business in
  // the URL actually belongs to the signed-in user.
  const [owned] = session
    ? await db
        .select({ id: business.id })
        .from(business)
        .where(
          and(eq(business.id, businessId), eq(business.userId, session.user.id)),
        )
    : []

  if (!owned) notFound()

  return (
    <BusinessProvider businessId={businessId}>
      <AdminShell>{children}</AdminShell>
    </BusinessProvider>
  )
}
