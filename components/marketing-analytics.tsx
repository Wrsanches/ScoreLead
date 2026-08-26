"use client"

import { useEffect } from "react"
import { useReportWebVitals } from "next/web-vitals"
import {
  flushQueuedMarketingEvents,
  getStoredAttributionUserProperties,
  persistAcquisitionTouch,
  trackMarketingEvent,
} from "@/lib/analytics-events"
import { classifyAcquisition } from "@/lib/acquisition"

export function AcquisitionTracker() {
  useEffect(() => {
    const sessionKey = "scorelead:acquisition-tracked"
    if (sessionStorage.getItem(sessionKey)) return

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
    sessionStorage.setItem(sessionKey, "true")

    window.gtag?.("set", "user_properties", {
      ...getStoredAttributionUserProperties(),
    })
    trackMarketingEvent("acquisition_landing", {
      acquisition_channel: acquisition.channel,
      acquisition_source: acquisition.source,
    })

    let attempts = 0
    const flushTimer = window.setInterval(() => {
      attempts += 1
      if (window.gtag) {
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

  useReportWebVitals((metric) => {
    window.gtag?.("event", metric.name, {
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value,
      ),
      event_category: "Web Vitals",
      event_label: metric.id,
      non_interaction: true,
    })
  })

  return null
}
