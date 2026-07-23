"use client"

import { createContext, useContext, useEffect } from "react"

/**
 * The active business now lives in the URL (`/admin/business/[businessId]/...`).
 * This provider just exposes the id resolved from the route to client
 * components, and persists it as a "last-viewed" cookie so the bare `/admin`
 * route can redirect somewhere sensible. The cookie is advisory only - the
 * server validates ownership on every request.
 */

export const ACTIVE_BUSINESS_COOKIE = "active_business_id"

function writeLastViewedCookie(id: string) {
  if (typeof document === "undefined") return
  // ~1 year
  document.cookie = `${ACTIVE_BUSINESS_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax`
}

type BusinessContextValue = {
  businessId: string
  readOnly: boolean
  ownerName: string | null
  ownerEmail: string | null
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({
  businessId,
  readOnly = false,
  ownerName = null,
  ownerEmail = null,
  children,
}: {
  businessId: string
  readOnly?: boolean
  ownerName?: string | null
  ownerEmail?: string | null
  children: React.ReactNode
}) {
  // Remember the most recently viewed business for the `/admin` redirect.
  useEffect(() => {
    writeLastViewedCookie(businessId)
  }, [businessId])

  return (
    <BusinessContext.Provider
      value={{ businessId, readOnly, ownerName, ownerEmail }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

/** The active business id from the URL. Guaranteed non-null inside the
 * `/admin/business/[businessId]` segment (the layout validates it). */
export function useBusinessId(): string {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error("useBusinessId must be used within a BusinessProvider")
  }
  return context.businessId
}

export function useBusinessAccess(): BusinessContextValue {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error("useBusinessAccess must be used within a BusinessProvider")
  }
  return context
}
