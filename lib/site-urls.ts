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

export function getLocalizedAppUrl(pathname: string, locale = "en") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  const localePrefix = locale === "en" ? "" : `/${locale}`
  return `${appSiteUrl}${localePrefix}${normalizedPath}`
}

export function getLocalizedPublicUrl(pathname: string, locale = "en") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  const localePrefix = locale === "en" ? "" : `/${locale}`
  const path = normalizedPath === "/" ? "" : normalizedPath
  return `${publicSiteUrl}${localePrefix}${path}`
}
