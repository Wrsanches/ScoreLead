"use client"

export type MarketingEventName =
  | "acquisition_landing"
  | "article_cta_click"
  | "commercial_cta_click"
  | "signup_start"
  | "signup_submitted"
  | "signup_completed"
  | "lead_capture_completed"
  | "qualified_account"
  | "customer_conversion"
  | "tool_started"
  | "tool_completed"

type EventParams = Record<string, string | number | boolean | undefined>

export type AcquisitionChannel =
  | "ai"
  | "organic"
  | "campaign"
  | "referral"
  | "direct"

export type AcquisitionTouch = {
  channel: AcquisitionChannel
  source: string
  landingPath: string
  capturedAt: string
}

const FIRST_TOUCH_KEY = "scorelead:first-touch"
const LAST_TOUCH_KEY = "scorelead:last-touch"
const EVENT_QUEUE_KEY = "scorelead:analytics-event-queue"

type QueuedMarketingEvent = {
  eventName: MarketingEventName
  params: EventParams
}

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

function readAcquisitionTouch(key: string) {
  if (typeof window === "undefined") return null

  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "null")
    if (
      value &&
      typeof value.channel === "string" &&
      typeof value.source === "string" &&
      typeof value.landingPath === "string" &&
      typeof value.capturedAt === "string"
    ) {
      return value as AcquisitionTouch
    }
  } catch {
    // Ignore malformed legacy values and replace them on the next capture.
  }

  return null
}

export function persistAcquisitionTouch(touch: AcquisitionTouch) {
  const firstTouch = readAcquisitionTouch(FIRST_TOUCH_KEY)
  if (!firstTouch) {
    window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch))
  }

  const lastTouch = readAcquisitionTouch(LAST_TOUCH_KEY)
  if (touch.channel !== "direct" || !lastTouch) {
    window.localStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(touch))
  }

  return {
    firstTouch: firstTouch ?? touch,
    lastTouch:
      touch.channel !== "direct" || !lastTouch ? touch : lastTouch,
  }
}

export function getStoredAttributionParams(): EventParams {
  const firstTouch = readAcquisitionTouch(FIRST_TOUCH_KEY)
  const lastTouch = readAcquisitionTouch(LAST_TOUCH_KEY)

  return {
    first_touch_channel: firstTouch?.channel,
    first_touch_source: firstTouch?.source,
    first_touch_landing: firstTouch?.landingPath,
    first_touch_at: firstTouch?.capturedAt,
    last_touch_channel: lastTouch?.channel,
    last_touch_source: lastTouch?.source,
    last_touch_landing: lastTouch?.landingPath,
    last_touch_at: lastTouch?.capturedAt,
  }
}

export function getStoredAttributionUserProperties(): EventParams {
  const params = getStoredAttributionParams()
  return {
    first_touch_channel: params.first_touch_channel,
    first_touch_source: params.first_touch_source,
    first_touch_landing: params.first_touch_landing,
    last_touch_channel: params.last_touch_channel,
    last_touch_source: params.last_touch_source,
    last_touch_landing: params.last_touch_landing,
  }
}

function queueMarketingEvent(event: QueuedMarketingEvent) {
  try {
    const existing = JSON.parse(
      window.sessionStorage.getItem(EVENT_QUEUE_KEY) ?? "[]",
    )
    const queue = Array.isArray(existing) ? existing : []
    window.sessionStorage.setItem(
      EVENT_QUEUE_KEY,
      JSON.stringify([...queue, event].slice(-50)),
    )
  } catch {
    // Analytics must never interrupt the user journey.
  }
}

export function flushQueuedMarketingEvents() {
  if (typeof window === "undefined" || !window.gtag) return 0

  try {
    const existing = JSON.parse(
      window.sessionStorage.getItem(EVENT_QUEUE_KEY) ?? "[]",
    )
    if (!Array.isArray(existing) || !existing.length) return 0

    const queue = existing as QueuedMarketingEvent[]
    window.sessionStorage.removeItem(EVENT_QUEUE_KEY)
    queue.forEach((event) => {
      window.gtag?.("event", event.eventName, event.params)
    })
    return queue.length
  } catch {
    window.sessionStorage.removeItem(EVENT_QUEUE_KEY)
    return 0
  }
}

export function trackMarketingEvent(
  eventName: MarketingEventName,
  params: EventParams = {},
) {
  if (!hasAnalyticsConsent()) return false

  const eventParams = {
    ...getStoredAttributionParams(),
    ...params,
    page_path: window.location.pathname,
  }

  if (!window.gtag) {
    queueMarketingEvent({ eventName, params: eventParams })
    return true
  }

  window.gtag("event", eventName, eventParams)
  return true
}
