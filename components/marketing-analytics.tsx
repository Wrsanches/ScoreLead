"use client"

import { useEffect } from "react"
import { useReportWebVitals } from "next/web-vitals"
import {
  flushQueuedMarketingEvents,
  getStoredAttributionUserProperties,
  persistAcquisitionTouch,
  trackMarketingEvent,
  type AcquisitionChannel,
} from "@/lib/analytics-events"

const aiHosts: Record<string, string> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "claude.ai": "claude",
  "copilot.microsoft.com": "copilot",
  "gemini.google.com": "gemini",
  "meta.ai": "meta_ai",
  "you.com": "you",
}

const searchHosts: Record<string, string> = {
  "google.com": "google",
  "google.com.br": "google",
  "bing.com": "bing",
  "duckduckgo.com": "duckduckgo",
  "search.yahoo.com": "yahoo",
}

function matchKnownHost(hostname: string, hosts: Record<string, string>) {
  const key = Object.keys(hosts).find(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  )
  return key ? hosts[key] : undefined
}

function getReferrerHost() {
  if (!document.referrer) return ""

  try {
    return new URL(document.referrer).hostname.toLowerCase()
  } catch {
    return ""
  }
}

function classifyAcquisition(): {
  channel: AcquisitionChannel
  source: string
} {
  const url = new URL(window.location.href)
  const utmSource = url.searchParams.get("utm_source")?.toLowerCase()
  const referrerHost = getReferrerHost()

  const aiSource =
    (utmSource && matchKnownHost(utmSource, aiHosts)) ||
    matchKnownHost(referrerHost, aiHosts)
  if (aiSource) return { channel: "ai", source: aiSource }

  const organicSource = matchKnownHost(referrerHost, searchHosts)
  if (organicSource) return { channel: "organic", source: organicSource }

  if (utmSource) return { channel: "campaign", source: utmSource }
  if (referrerHost && referrerHost !== window.location.hostname) {
    return { channel: "referral", source: referrerHost }
  }

  return { channel: "direct", source: "direct" }
}

export function AcquisitionTracker() {
  useEffect(() => {
    const sessionKey = "scorelead:acquisition-tracked"
    if (sessionStorage.getItem(sessionKey)) return

    const acquisition = classifyAcquisition()
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
