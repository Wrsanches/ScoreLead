"use client"

import { useState, createContext, useContext } from "react"
import { Menu } from "lucide-react"
import { AdminSidebar } from "./admin-sidebar"
import { SearchProvider } from "./search-overlay"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <SearchProvider>
      <div className="flex h-full w-full overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#09090B" }}>
          <MobileMenuContext.Provider value={() => setSidebarOpen(true)}>
            {children}
          </MobileMenuContext.Provider>
        </div>
      </div>
    </SearchProvider>
  )
}

const MobileMenuContext = createContext<() => void>(() => {})

export function useMobileMenu() {
  return useContext(MobileMenuContext)
}

export function MobileMenuButton() {
  const openMenu = useMobileMenu()
  return (
    <button onClick={openMenu} className="lg:hidden p-1 text-zinc-400 hover:text-white">
      <Menu className="w-4 h-4" />
    </button>
  )
}
