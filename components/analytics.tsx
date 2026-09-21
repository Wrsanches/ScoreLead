"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"
import { AcquisitionTracker, AnalyticsEventQueue } from "./marketing-analytics"
import { clearQueuedMarketingEvents } from "@/lib/analytics-events"
import { isInternalAnalyticsSession } from "@/lib/analytics-session"
import {
  getAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "@/lib/browser-storage"
import {
  getAnalyticsSurface,
  type AnalyticsSurface,
} from "@/lib/site-urls"

export function ConsentGatedAnalytics({
  publicGaId,
  appGaId,
}: {
  publicGaId?: string
  appGaId?: string
}) {
  const [consent, setConsent] = useState(false)
  const [surface, setSurface] = useState<AnalyticsSurface | null>(null)

  useEffect(() => {
    if (isInternalAnalyticsSession()) {
      clearQueuedMarketingEvents()
      return
    }
    const detectedSurface = getAnalyticsSurface(
      window.location.hostname,
      window.location.pathname,
    )
    const gaId = detectedSurface === "public" ? publicGaId : appGaId
    if (!detectedSurface || !gaId) return

    setSurface(detectedSurface)
    setConsent(getAnalyticsConsent() === "accepted")
    return subscribeToAnalyticsConsent((value) => {
      window.gtag?.("consent", "update", { analytics_storage: value === "accepted" ? "granted" : "denied" })
      if (value !== "accepted") clearQueuedMarketingEvents()
      setConsent(value === "accepted")
    })
  }, [appGaId, publicGaId])

  const gaId = surface === "public" ? publicGaId : appGaId
  if (!consent || !surface || !gaId) return null

  return (
    <>
      <GoogleAnalytics gaId={gaId} />
      {surface === "public" ? <AcquisitionTracker /> : null}
      <AnalyticsEventQueue />
    </>
  )
}
