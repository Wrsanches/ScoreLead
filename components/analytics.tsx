"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import { GoogleAnalytics } from "@next/third-parties/google"

export function ConsentGatedAnalytics({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("cookie-consent")
    if (stored === "accepted") {
      setConsent(true)
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cookie-consent") {
        setConsent(e.newValue === "accepted")
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const stored = localStorage.getItem("cookie-consent")
      setConsent(stored === "accepted")
    })
    observer.observe(document.documentElement, { subtree: true, childList: true })
    return () => observer.disconnect()
  }, [])

  if (!consent) return null

  return (
    <>
      <Analytics />
      <GoogleAnalytics gaId={gaId} />
    </>
  )
}
