const DEFAULT_PUBLIC_SITE_URL = "https://scorelead.io"
const DEFAULT_APP_SITE_URL = "https://app.scorelead.io"

function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

export const publicSiteUrl = withoutTrailingSlash(
  process.env.NEXT_PUBLIC_SCORELEAD_PUBLIC_URL ?? DEFAULT_PUBLIC_SITE_URL,
)

export const appSiteUrl = withoutTrailingSlash(
  process.env.NEXT_PUBLIC_SCORELEAD_APP_URL ?? DEFAULT_APP_SITE_URL,
)

function getUrlHostname(value: string) {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return ""
  }
}

export function isProductionAnalyticsHostname(hostname: string) {
  const normalizedHostname = hostname.trim().toLowerCase()
  return [publicSiteUrl, appSiteUrl].some(
    (siteUrl) => getUrlHostname(siteUrl) === normalizedHostname,
  )
}

export function getAuthClientBaseUrl(currentOrigin: string) {
  const currentUrl = new URL(currentOrigin)
  const hostname = currentUrl.hostname.toLowerCase()
  const isLocalhost =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1"

  if (isLocalhost) return currentUrl.origin

  return hostname === getUrlHostname(publicSiteUrl)
    ? appSiteUrl
    : currentUrl.origin
}

export function getLocalizedAppUrl(pathname: string, locale = "en") {
  return `${appSiteUrl}${getLocalizedAppPath(pathname, locale)}`
}

export function getLocalizedAppPath(pathname: string, locale = "en") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  const localePrefix = locale === "en" ? "" : `/${locale}`
  return `${localePrefix}${normalizedPath}`
}

export function getLocalizedPublicUrl(pathname: string, locale = "en") {
  const localizedPath = getLocalizedPublicPath(pathname, locale)
  return `${publicSiteUrl}${localizedPath === "/" ? "" : localizedPath}`
}

export function getLocalizedPublicPath(pathname: string, locale = "en") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  const localePrefix = locale === "en" ? "" : `/${locale}`
  const path = normalizedPath === "/" ? "" : normalizedPath
  return `${localePrefix}${path}` || "/"
}

export function getPublicSiteLinkHref(
  pathname: string,
  locale: string,
  currentOrigin?: string,
) {
  if (!currentOrigin) return getLocalizedPublicUrl(pathname, locale)

  const currentHostname = getUrlHostname(currentOrigin)
  const isProductionSite = [publicSiteUrl, appSiteUrl].some(
    (siteUrl) => getUrlHostname(siteUrl) === currentHostname,
  )

  return isProductionSite
    ? getLocalizedPublicUrl(pathname, locale)
    : getLocalizedPublicPath(pathname, locale)
}
