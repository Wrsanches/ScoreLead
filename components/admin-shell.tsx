"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { Menu } from "lucide-react"
import { AdminSidebar } from "./admin-sidebar"
import { SearchProvider } from "./search-overlay"
import { PlanProvider } from "@/components/admin/plan-context"

export function AdminShell({
  children,
  userEmail,
  isPlatformAdmin = false,
}: {
  children: React.ReactNode
  userEmail?: string | null
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
    <PlanProvider>
    <SearchProvider>
      <div className="flex h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          animateLayout={sidebarTransitionsReady}
          userEmail={userEmail}
          isPlatformAdmin={isPlatformAdmin}
        />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden p-2 lg:p-3 lg:pl-0">
          <div className="relative flex-1 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/50 shadow-[0_1px_2px_0_rgba(0,0,0,0.04),0_1px_0_0_rgba(255,255,255,1)_inset] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.45),0_1px_0_0_rgba(255,255,255,0.04)_inset]">
            {/* Ambient emerald glow - dark only; on white it reads as a sickly tint */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 60% 50% at top left, rgba(16,185,129,0.08), transparent 55%),
                  radial-gradient(ellipse 70% 60% at bottom right, rgba(16,185,129,0.045), transparent 60%),
                  radial-gradient(ellipse 40% 30% at 80% 10%, rgba(52,211,153,0.035), transparent 55%)
                `,
              }}
            />
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
              <MobileMenuContext.Provider value={() => setSidebarOpen(true)}>
                {children}
              </MobileMenuContext.Provider>
            </div>
          </div>
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
