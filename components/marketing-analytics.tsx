"use client"

import { useEffect, useRef } from "react"
import { getAnalyticsConsent } from "@/lib/browser-storage"
import { isInternalAnalyticsSession } from "@/lib/analytics-session"
import { useReportWebVitals } from "next/web-vitals"
import {
  flushQueuedMarketingEvents,
  getStoredAttributionUserProperties,
  persistAcquisitionTouch,
  trackMarketingEvent,
} from "@/lib/analytics-events"
import { classifyAcquisition } from "@/lib/acquisition"

export function AcquisitionTracker() {
  const captured = useRef(false)
  useEffect(() => {
    if (captured.current) return
    const sessionKey = "scorelead:acquisition-tracked"
    try { if (sessionStorage.getItem(sessionKey)) return } catch { /* Continue without persistence. */ }
    captured.current = true

    const acquisition = classifyAcquisition({
      currentUrl: window.location.href,
      currentHostname: window.location.hostname,
      referrer: document.referrer,
    })
    persistAcquisitionTouch({
      ...acquisition,
      landingPath: window.location.pathname,
      capturedAt: new Date().toISOString(),
    })
    try { sessionStorage.setItem(sessionKey, "true") } catch { /* Continue without persistence. */ }

    window.gtag?.("set", "user_properties", {
      ...getStoredAttributionUserProperties(),
    })
    trackMarketingEvent("acquisition_landing", {
      acquisition_channel: acquisition.channel,
      acquisition_source: acquisition.source,
    })

  }, [])

  useReportWebVitals((metric) => {
    if (getAnalyticsConsent() !== "accepted" || isInternalAnalyticsSession()) return
    window.gtag?.("event", metric.name, {
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      event_category: "Web Vitals",
      event_label: metric.id,
      non_interaction: true,
    })
  })

  return null
}

// Mounted on both hosts. Signup/onboarding events can precede the GA script
// on the app host, where AcquisitionTracker deliberately does not mount.
export function AnalyticsEventQueue() {
  useEffect(() => {
    let attempts = 0
    const flushTimer = window.setInterval(() => {
      attempts += 1
      if (window.gtag) {
        if (getAnalyticsConsent() !== "accepted" || isInternalAnalyticsSession()) {
          window.clearInterval(flushTimer)
          return
        }
        window.gtag("set", "user_properties", {
          ...getStoredAttributionUserProperties(),
        })
        flushQueuedMarketingEvents()
        window.clearInterval(flushTimer)
      } else if (attempts >= 40) {
        window.clearInterval(flushTimer)
      }
    }, 250)

    return () => window.clearInterval(flushTimer)
  }, [])

  return null
}
