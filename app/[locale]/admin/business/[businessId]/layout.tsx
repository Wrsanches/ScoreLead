import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { BusinessProvider } from "@/components/admin/business-context"
import { AdminViewBanner } from "@/components/admin/admin-view-banner"
import { generatePageMetadata } from "@/lib/seo"
import { getBusinessAccess } from "@/lib/business-access"

// Title for the business home (dashboard) and a fallback for any nested route
// that doesn't set its own; the section layouts below override it.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, "dashboard")
}

export default async function BusinessLayout({
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
  if (!access) notFound()

  const [selectedBusiness] = await db
    .select({ name: business.name })
    .from(business)
    .where(eq(business.id, businessId))
    .limit(1)

  // AdminShell (sidebar/chrome) is rendered once by the parent admin layout, so
  // it persists across navigation; this layout only scopes the active business.
  return (
    <BusinessProvider
      businessId={businessId}
      readOnly={access.readOnly}
      ownerName={access.ownerName}
      ownerEmail={access.ownerEmail}
    >
      {access.readOnly && (
        <AdminViewBanner
          businessName={selectedBusiness?.name ?? null}
          ownerName={access.ownerName}
          ownerEmail={access.ownerEmail}
        />
      )}
      {children}
    </BusinessProvider>
  )
}
