"use client"

const INTERNAL_SESSION_KEY = "scorelead:internal-analytics-session"

// Only explicitly labelled QA visits are excluded. Ordinary referrals from
// Search Console remain visible as referrals, not assumed to be internal.
export function isInternalAnalyticsSession() {
  if (typeof window === "undefined") return false
  const explicitTest = new URLSearchParams(window.location.search).get("utm_medium")?.toLowerCase() === "internal_test"
  try {
    if (explicitTest) window.sessionStorage.setItem(INTERNAL_SESSION_KEY, "true")
    return explicitTest || window.sessionStorage.getItem(INTERNAL_SESSION_KEY) === "true"
  } catch {
    return explicitTest
  }
}
