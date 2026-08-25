export const APP_ROUTE_ROOTS = new Set([
  "admin",
  "forgot-password",
  "login",
  "onboarding",
  "reset-password",
  "signup",
])

const SUPPORTED_LOCALES = new Set(["en", "pt", "es"])

export function getRouteRoot(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments[0] && SUPPORTED_LOCALES.has(segments[0])) segments.shift()
  return segments[0] ?? ""
}

export function isAppPath(pathname: string) {
  return APP_ROUTE_ROOTS.has(getRouteRoot(pathname))
}

export function getLocaleFromPath(pathname: string) {
  const first = pathname.split("/").filter(Boolean)[0]
  return first && SUPPORTED_LOCALES.has(first) ? first : "en"
}

export function getHostname(value: string | null | undefined) {
  if (!value) return ""
  return value.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "")
}

export function getHostRedirect(input: {
  hostname: string
  pathname: string
  search: string
  publicUrl: string
  appUrl: string
}) {
  const publicHostname = new URL(input.publicUrl).hostname
  const appHostname = new URL(input.appUrl).hostname

  if (input.hostname === publicHostname && isAppPath(input.pathname)) {
    return `${input.appUrl}${input.pathname}${input.search}`
  }

  if (input.hostname !== appHostname) return null

  if (isAppPath(input.pathname)) return null

  const locale = getLocaleFromPath(input.pathname)
  const root = getRouteRoot(input.pathname)
  if (!root) {
    const prefix = locale === "en" ? "" : `/${locale}`
    return `${input.appUrl}${prefix}/admin${input.search}`
  }

  return `${input.publicUrl}${input.pathname}${input.search}`
}
