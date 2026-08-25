"use client"

import { createContext, useContext, useEffect, useRef } from "react"
import { useLocale } from "next-intl"
import { getPathname, usePathname, useRouter } from "@/i18n/routing"
import { isAccountAdminPath, parseLegacyBusinessPath } from "@/lib/admin-routes"

/**
 * The active business lives in a cookie so browser URLs can stay tenant-free.
 * The cookie is only a selection hint: every server request validates that the
 * signed-in user may view the selected business before exposing its id here.
 */

export const ACTIVE_BUSINESS_COOKIE = "active_business_id"
const ACTIVE_BUSINESS_EVENT = "scorelead:active-business-changed"

function writeActiveBusinessCookie(id: string) {
  if (typeof document === "undefined") return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${ACTIVE_BUSINESS_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
}

/** Selects a business for this browser and notifies other open admin tabs. */
export function selectActiveBusiness(id: string) {
  writeActiveBusinessCookie(id)
  try {
    localStorage.setItem(
      ACTIVE_BUSINESS_EVENT,
      JSON.stringify({ id, changedAt: Date.now() }),
    )
  } catch {
    // Cookie selection still works when storage is unavailable.
  }
}

type BusinessContextValue = {
  businessId: string | null
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
  businessId: string | null
  readOnly?: boolean
  ownerName?: string | null
  ownerEmail?: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const handledBusinessId = useRef<string | null>(null)
  const requiresBusiness = !isAccountAdminPath(pathname)

  useEffect(() => {
    if (!businessId && requiresBusiness) router.replace("/onboarding")
  }, [businessId, requiresBusiness, router])

  // Persist server-resolved fallbacks and migrate legacy UUID routes after
  // their dynamic layout has validated the requested business.
  useEffect(() => {
    if (!businessId || handledBusinessId.current === businessId) return
    handledBusinessId.current = businessId

    const legacy = parseLegacyBusinessPath(pathname)
    if (legacy) {
      if (legacy.businessId !== businessId) return
      selectActiveBusiness(businessId)
      const cleanPath = getPathname({
        locale,
        href: legacy.cleanPath,
      })
      window.location.replace(
        `${cleanPath}${window.location.search}${window.location.hash}`,
      )
      return
    }

    // Server-rendered fallbacks should become the browser's next selection,
    // but are not explicit user switches and should not disturb other tabs.
    writeActiveBusinessCookie(businessId)
  }, [businessId, locale, pathname])

  useEffect(() => {
    function syncOtherTab(event: StorageEvent) {
      if (event.key !== ACTIVE_BUSINESS_EVENT || !event.newValue) return
      try {
        const { id } = JSON.parse(event.newValue) as { id?: string }
        if (!id || id === businessId) return
        window.location.assign(getPathname({ locale, href: "/admin" }))
      } catch {
        // Ignore malformed or unrelated storage events.
      }
    }

    window.addEventListener("storage", syncOtherTab)
    return () => window.removeEventListener("storage", syncOtherTab)
  }, [businessId, locale])

  // Account settings and support remain available without a business. Keep
  // business-scoped children unmounted while redirecting so their required
  // context hooks cannot render against a null selection.
  if (!businessId && requiresBusiness) return null

  return (
    <BusinessContext.Provider
      value={{ businessId, readOnly, ownerName, ownerEmail }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

/** The server-validated active business id. */
export function useBusinessId(): string {
  const context = useContext(BusinessContext)
  if (!context?.businessId) {
    throw new Error("useBusinessId must be used within a BusinessProvider")
  }
  return context.businessId
}

export function useOptionalBusinessId(): string | null {
  return useContext(BusinessContext)?.businessId ?? null
}

export function useBusinessAccess(): BusinessContextValue & { businessId: string } {
  const context = useContext(BusinessContext)
  if (!context?.businessId) {
    throw new Error("useBusinessAccess must be used within a BusinessProvider")
  }
  return { ...context, businessId: context.businessId }
}
