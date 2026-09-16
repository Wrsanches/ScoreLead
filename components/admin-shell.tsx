"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { Menu } from "lucide-react"
import { AdminSidebar } from "./admin-sidebar"
import { SearchProvider } from "./search-overlay"
import { PlanProvider } from "@/components/admin/plan-context"
import type { ViewableBusiness } from "@/lib/business-access"
import type { SerializedPlanStatus } from "@/lib/plan"

type SidebarBusiness = Pick<
  ViewableBusiness,
  | "id"
  | "name"
  | "logo"
  | "field"
  | "website"
  | "ownerUserId"
  | "ownerName"
  | "ownerEmail"
  | "readOnly"
>

export function AdminShell({
  children,
  businesses,
  planStatus,
  userName,
  userEmail,
  userImage,
  isPlatformAdmin = false,
}: {
  children: React.ReactNode
  businesses: SidebarBusiness[]
  planStatus: SerializedPlanStatus
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  isPlatformAdmin?: boolean
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarPreferenceLoaded, setSidebarPreferenceLoaded] = useState(false)
  const [sidebarTransitionsReady, setSidebarTransitionsReady] = useState(false)

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem("scorelead:admin-sidebar-collapsed") === "true")
    setSidebarPreferenceLoaded(true)

    const frame = requestAnimationFrame(() => setSidebarTransitionsReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!sidebarPreferenceLoaded) return
    localStorage.setItem("scorelead:admin-sidebar-collapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed, sidebarPreferenceLoaded])

  return (
    <PlanProvider initialStatus={planStatus}>
    <SearchProvider>
      {/* The ambient canvas is painted once by the admin layout root. */}
      <div className="relative flex h-full w-full overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          animateLayout={sidebarTransitionsReady}
          businesses={businesses}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          isPlatformAdmin={isPlatformAdmin}
        />

        {/* Content sits directly on the canvas; only the sidebar floats. */}
        <div className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          <MobileMenuContext.Provider value={() => setSidebarOpen(true)}>
            {children}
          </MobileMenuContext.Provider>
        </div>
      </div>
    </SearchProvider>
    </PlanProvider>
  )
}

const MobileMenuContext = createContext<() => void>(() => {})

export function useMobileMenu() {
  return useContext(MobileMenuContext)
}

export function MobileMenuButton() {
  const openMenu = useMobileMenu()
  return (
    <button onClick={openMenu} className="lg:hidden p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
      <Menu className="w-4 h-4" />
    </button>
  )
}
