import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { requireAuth } from "@/lib/auth-guard"
import { AdminShell } from "@/components/admin-shell"
import {
  getBusinessAccess,
  isPlatformAdmin,
  listViewableBusinesses,
} from "@/lib/business-access"
import { getActiveViewableBusinessIdForUser } from "@/lib/active-business"
import { BusinessProvider } from "@/components/admin/business-context"
import { AdminViewBanner } from "@/components/admin/admin-view-banner"
import { getPlanStatus, serializePlanStatus } from "@/lib/plan"

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
  const [platformAdmin, businessId, businesses] = await Promise.all([
    isPlatformAdmin(session.user.id),
    getActiveViewableBusinessIdForUser(session.user.id),
    listViewableBusinesses(session.user.id),
  ])
  const access = businessId
    ? await getBusinessAccess(session.user.id, businessId)
    : null
  const rawPlanStatus = await getPlanStatus(
    access?.ownerUserId ?? session.user.id,
  )
  // The businesses API retains its richer response shape, but the persistent
  // client shell only needs navigation fields. Keep the RSC payload lean.
  const sidebarBusinesses = businesses.map((item) => ({
    id: item.id,
    name: item.name,
    logo: item.logo,
    field: item.field,
    website: item.website,
    ownerUserId: item.ownerUserId,
    ownerName: item.ownerName,
    ownerEmail: item.ownerEmail,
    readOnly: item.readOnly,
  }))

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
          businesses={sidebarBusinesses}
          planStatus={serializePlanStatus(rawPlanStatus)}
          userName={session.user.name}
          userEmail={session.user.email}
          userImage={session.user.image}
          isPlatformAdmin={platformAdmin}
        >
          {access?.isPlatformAdmin && !access.isOwner && (
            <AdminViewBanner
              businessName={access.businessName}
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
