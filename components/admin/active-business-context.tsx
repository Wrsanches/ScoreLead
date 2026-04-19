"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"

export const ACTIVE_BUSINESS_COOKIE = "active_business_id"

interface ActiveBusinessContextValue {
  activeBusinessId: string | null
  setActiveBusinessId: (id: string | null) => void
}

const ActiveBusinessContext = createContext<ActiveBusinessContextValue | null>(
  null,
)

function readCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${ACTIVE_BUSINESS_COOKIE}=`))
  if (!match) return null
  const raw = decodeURIComponent(match.split("=")[1] ?? "")
  return raw || null
}

function writeCookie(id: string | null) {
  if (typeof document === "undefined") return
  const base = `${ACTIVE_BUSINESS_COOKIE}=`
  if (!id) {
    document.cookie = `${base}; Path=/; Max-Age=0; SameSite=Lax`
    return
  }
  // ~1 year
  document.cookie = `${base}${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export function ActiveBusinessProvider({
  children,
  initialId,
}: {
  children: React.ReactNode
  initialId?: string | null
}) {
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(
    initialId ?? null,
  )
  const router = useRouter()

  // Hydrate from cookie on mount (in case server rendered without an initialId).
  useEffect(() => {
    if (activeBusinessId) return
    const fromCookie = readCookie()
    if (fromCookie) setActiveBusinessIdState(fromCookie)
  }, [activeBusinessId])

  const setActiveBusinessId = useCallback(
    (id: string | null) => {
      writeCookie(id)
      setActiveBusinessIdState(id)
      // Invalidate server-rendered data so any route that reads the cookie
      // (dashboards, lists scoped by active business) re-runs on the server.
      // Client-side fetches with `activeBusinessId` in their useEffect deps
      // will also re-run independently.
      router.refresh()
    },
    [router],
  )

  const value = useMemo(
    () => ({ activeBusinessId, setActiveBusinessId }),
    [activeBusinessId, setActiveBusinessId],
  )

  return (
    <ActiveBusinessContext.Provider value={value}>
      {children}
    </ActiveBusinessContext.Provider>
  )
}

export function useActiveBusiness(): ActiveBusinessContextValue {
  const ctx = useContext(ActiveBusinessContext)
  if (!ctx) {
    throw new Error(
      "useActiveBusiness must be used within an ActiveBusinessProvider",
    )
  }
  return ctx
}
