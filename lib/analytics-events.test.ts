import { beforeEach, describe, expect, it } from "bun:test"
import {
  flushQueuedMarketingEvents,
  getStoredAttributionParams,
  persistAcquisitionTouch,
  trackMarketingEvent,
} from "./analytics-events"

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

type SentEvent = {
  command: string
  eventName: string
  params?: Record<string, string | number | boolean | undefined>
}

const localStorage = new MemoryStorage()
const sessionStorage = new MemoryStorage()
const sentEvents: SentEvent[] = []
const mockWindow = {
  localStorage,
  sessionStorage,
  location: { pathname: "/features/ai-lead-discovery" },
  gtag: (
    command: string,
    eventName: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) => {
    sentEvents.push({ command, eventName, params })
  },
} as unknown as Window & typeof globalThis

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: mockWindow,
})

describe("marketing attribution", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    sentEvents.length = 0
    mockWindow.gtag = (
      command: string,
      eventName: string,
      params?: Record<string, string | number | boolean | undefined>,
    ) => {
      sentEvents.push({ command, eventName, params })
    }
  })

  it("preserves first touch and the latest non-direct touch", () => {
    persistAcquisitionTouch({
      channel: "ai",
      source: "chatgpt",
      landingPath: "/blog/ai-lead-generation-guide",
      capturedAt: "2026-07-24T10:00:00.000Z",
    })
    persistAcquisitionTouch({
      channel: "direct",
      source: "direct",
      landingPath: "/pricing",
      capturedAt: "2026-07-25T10:00:00.000Z",
    })

    let params = getStoredAttributionParams()
    expect(params.first_touch_source).toBe("chatgpt")
    expect(params.last_touch_source).toBe("chatgpt")

    persistAcquisitionTouch({
      channel: "organic",
      source: "google",
      landingPath: "/pricing",
      capturedAt: "2026-07-26T10:00:00.000Z",
    })

    params = getStoredAttributionParams()
    expect(params.first_touch_source).toBe("chatgpt")
    expect(params.last_touch_source).toBe("google")
  })

  it("adds first and last touch to conversion events", () => {
    localStorage.setItem("cookie-consent", "accepted")
    persistAcquisitionTouch({
      channel: "ai",
      source: "perplexity",
      landingPath: "/features/lead-scoring",
      capturedAt: "2026-07-24T10:00:00.000Z",
    })

    expect(
      trackMarketingEvent("qualified_account", {
        pipeline_status: "interested",
      }),
    ).toBe(true)

    expect(sentEvents).toHaveLength(1)
    expect(sentEvents[0].params).toMatchObject({
      first_touch_source: "perplexity",
      last_touch_source: "perplexity",
      pipeline_status: "interested",
      page_path: "/features/ai-lead-discovery",
    })
  })

  it("queues consented events until Google Analytics is ready", () => {
    localStorage.setItem("cookie-consent", "accepted")
    mockWindow.gtag = undefined

    expect(
      trackMarketingEvent("signup_completed", {
        signup_method: "google",
      }),
    ).toBe(true)

    mockWindow.gtag = (
      command: string,
      eventName: string,
      params?: Record<string, string | number | boolean | undefined>,
    ) => {
      sentEvents.push({ command, eventName, params })
    }

    expect(flushQueuedMarketingEvents()).toBe(1)
    expect(sentEvents[0]).toMatchObject({
      command: "event",
      eventName: "signup_completed",
    })
  })
})
