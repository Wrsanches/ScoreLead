import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { requireAuth } from "@/lib/auth-guard"
import { AdminShell } from "@/components/admin-shell"
import { getBusinessAccess, isPlatformAdmin } from "@/lib/business-access"
import { getActiveViewableBusinessIdForUser } from "@/lib/active-business"
import { BusinessProvider } from "@/components/admin/business-context"
import { AdminViewBanner } from "@/components/admin/admin-view-banner"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await requireAuth(locale)
  const platformAdmin = await isPlatformAdmin(session.user.id)
  const businessId = await getActiveViewableBusinessIdForUser(session.user.id)
  const access = businessId
    ? await getBusinessAccess(session.user.id, businessId)
    : null
  const [selectedBusiness] = businessId
    ? await db
        .select({ name: business.name })
        .from(business)
        .where(eq(business.id, businessId))
        .limit(1)
    : []

  // The sidebar/chrome is rendered ONCE here so it persists across every admin
  // route (dashboard, business sections, settings, support), and this provider
  // gives every clean route the same server-validated business selection.
  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <BusinessProvider
        businessId={access?.businessId ?? null}
        readOnly={access?.readOnly ?? false}
        ownerName={access?.ownerName ?? null}
        ownerEmail={access?.ownerEmail ?? null}
      >
        <AdminShell
          userEmail={session.user.email}
          isPlatformAdmin={platformAdmin}
        >
          {access?.readOnly && (
            <AdminViewBanner
              businessName={selectedBusiness?.name ?? null}
              ownerName={access.ownerName}
              ownerEmail={access.ownerEmail}
            />
          )}
          {children}
        </AdminShell>
      </BusinessProvider>
    </div>
  )
}
