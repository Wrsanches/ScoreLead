const BUSINESS_SECTION_PREFIXES = [
  "/admin/leads",
  "/admin/content-calendar",
  "/admin/profile",
  "/admin/integrations",
  "/admin/discovery-jobs",
  "/admin/saved-searches",
] as const

export function getBusinessSwitchDestination(pathname: string): string {
  if (pathname.startsWith("/admin/integrations/")) {
    return "/admin/integrations"
  }
  if (pathname.startsWith("/admin/discovery-jobs/")) {
    return "/admin/discovery-jobs"
  }

  const isBusinessRoute =
    pathname === "/admin" ||
    BUSINESS_SECTION_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )

  return isBusinessRoute ? pathname : "/admin"
}

export function parseLegacyBusinessPath(pathname: string): {
  businessId: string
  cleanPath: string
} | null {
  const match = pathname.match(/^\/admin\/business\/([^/]+)(\/.*)?$/)
  if (!match) return null

  try {
    return {
      businessId: decodeURIComponent(match[1]),
      cleanPath: `/admin${match[2] ?? ""}`,
    }
  } catch {
    return null
  }
}

export function isAccountAdminPath(pathname: string): boolean {
  return ["/admin/settings", "/admin/support"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
