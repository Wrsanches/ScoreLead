"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"
import { AcquisitionTracker } from "./marketing-analytics"
import {
  getAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "@/lib/browser-storage"
import { isProductionAnalyticsHostname } from "@/lib/site-urls"

export function ConsentGatedAnalytics({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    if (!isProductionAnalyticsHostname(window.location.hostname)) return

    setConsent(getAnalyticsConsent() === "accepted")
    return subscribeToAnalyticsConsent((value) => {
      setConsent(value === "accepted")
    })
  }, [])

  if (!consent) return null

  return (
    <>
      <GoogleAnalytics gaId={gaId} />
      <AcquisitionTracker />
    </>
  )
}
