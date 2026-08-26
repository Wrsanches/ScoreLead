import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAuthOnly } from "@/lib/auth-guard"
import { BusinessProvider } from "@/components/admin/business-context"
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
  params: Promise<{ businessId: string; locale: string }>
}) {
  const { businessId, locale } = await params
  const session = await requireAuthOnly(locale)

  const access = await getBusinessAccess(session.user.id, businessId)
  if (!access) notFound()

  // Keep old bookmarks valid long enough for BusinessProvider to persist this
  // validated selection and replace the legacy UUID path with its clean route.
  return (
    <BusinessProvider
      businessId={businessId}
      readOnly={access.readOnly}
      ownerName={access.ownerName}
      ownerEmail={access.ownerEmail}
    >
      {children}
    </BusinessProvider>
  )
}
