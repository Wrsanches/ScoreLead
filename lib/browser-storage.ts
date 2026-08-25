"use client"

export type AnalyticsConsent = "accepted" | "declined"

const CONSENT_KEY = "cookie-consent"
const CONSENT_EVENT = "scorelead:consent-change"
const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180

function isScoreLeadHostname(hostname: string) {
  return hostname === "scorelead.io" || hostname.endsWith(".scorelead.io")
}

function cookieDomainAttribute() {
  if (typeof window === "undefined" || !isScoreLeadHostname(window.location.hostname)) {
    return ""
  }
  return "; Domain=.scorelead.io; Secure"
}

export function readSharedCookie(name: string) {
  if (typeof document === "undefined") return null

  const prefix = `${encodeURIComponent(name)}=`
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix))

  if (!cookie) return null

  try {
    return decodeURIComponent(cookie.slice(prefix.length))
  } catch {
    return null
  }
}

export function writeSharedCookie(
  name: string,
  value: string,
  maxAge = SIX_MONTHS_SECONDS,
) {
  if (typeof document === "undefined") return

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${cookieDomainAttribute()}`
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  const shared = readSharedCookie(CONSENT_KEY)
  if (shared === "accepted" || shared === "declined") return shared

  // Migrate the pre-subdomain localStorage preference on the visitor's next
  // visit, so existing consent is honored on both scorelead.io hosts.
  if (typeof window !== "undefined") {
    const legacy = window.localStorage.getItem(CONSENT_KEY)
    if (legacy === "accepted" || legacy === "declined") {
      writeSharedCookie(CONSENT_KEY, legacy)
      return legacy
    }
  }

  return null
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  writeSharedCookie(CONSENT_KEY, consent)
  // Keep the legacy value during the migration window and notify listeners in
  // the current tab; cookie writes do not emit the browser storage event.
  window.localStorage.setItem(CONSENT_KEY, consent)
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }))
}

export function subscribeToAnalyticsConsent(
  callback: (consent: AnalyticsConsent | null) => void,
) {
  const handleConsent = () => callback(getAnalyticsConsent())
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY) handleConsent()
  }

  window.addEventListener(CONSENT_EVENT, handleConsent)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(CONSENT_EVENT, handleConsent)
    window.removeEventListener("storage", handleStorage)
  }
}
