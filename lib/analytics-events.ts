"use client"

export type MarketingEventName =
  | "acquisition_landing"
  | "article_cta_click"
  | "commercial_cta_click"
  | "signup_start"
  | "signup_completed"
  | "lead_capture_completed"
  | "qualified_account"
  | "customer_conversion"
  | "tool_started"
  | "tool_completed"

type EventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (
      command: "event" | "set",
      eventName: string,
      params?: EventParams,
    ) => void
  }
}

function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem("cookie-consent") === "accepted"
}

export function trackMarketingEvent(
  eventName: MarketingEventName,
  params: EventParams = {},
) {
  if (!hasAnalyticsConsent()) return

  window.gtag?.("event", eventName, {
    ...params,
    page_path: window.location.pathname,
  })
}
