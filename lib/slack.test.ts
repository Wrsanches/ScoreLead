import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import {
  notifySlackAccountCreated,
  notifySlackSubscriptionCreated,
} from "./slack"

const originalFetch = globalThis.fetch
const originalWebhookUrl = process.env.SLACK_WEBHOOK_URL

beforeEach(() => {
  delete process.env.SLACK_WEBHOOK_URL
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalWebhookUrl === undefined) {
    delete process.env.SLACK_WEBHOOK_URL
  } else {
    process.env.SLACK_WEBHOOK_URL = originalWebhookUrl
  }
})

describe("Slack notifications", () => {
  test("does nothing when the webhook is not configured", async () => {
    const fetchMock = mock(async () => new Response("ok"))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const delivered = await notifySlackAccountCreated({
      name: "Ada Lovelace",
      email: "ada@example.com",
    })

    expect(delivered).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("posts a structured new-account alert and escapes Slack markup", async () => {
    process.env.SLACK_WEBHOOK_URL =
      "https://hooks.slack.com/services/T00000000/B00000000/test-token"
    const fetchMock = mock(async () => new Response("ok", { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const delivered = await notifySlackAccountCreated({
      name: "<@U123> & Ada",
      email: "ada@example.com",
      createdAt: new Date("2026-07-22T12:00:00.000Z"),
    })

    expect(delivered).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, request] = fetchMock.mock.calls[0]
    const body = JSON.parse(String(request?.body))
    const serialized = JSON.stringify(body)
    expect(body.text).toBe("New ScoreLead account created")
    expect(serialized).toContain("&lt;@U123&gt; &amp; Ada")
    expect(serialized).toContain("ada@example.com")
    expect(serialized).toContain("2026-07-22T12:00:00.000Z")
  })

  test("posts plan and billing details for a new subscription", async () => {
    process.env.SLACK_WEBHOOK_URL =
      "https://hooks.slack.com/services/T00000000/B00000000/test-token"
    const fetchMock = mock(async () => new Response("ok", { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const delivered = await notifySlackSubscriptionCreated({
      accountId: "user-123",
      name: "Grace Hopper",
      email: "grace@example.com",
      plan: "pro",
      billingInterval: "year",
      status: "active",
      subscribedAt: new Date("2026-07-22T13:00:00.000Z"),
    })

    expect(delivered).toBe(true)
    const [, request] = fetchMock.mock.calls[0]
    const serialized = JSON.stringify(JSON.parse(String(request?.body)))
    expect(serialized).toContain("Grace Hopper")
    expect(serialized).toContain("grace@example.com")
    expect(serialized).toContain("pro")
    expect(serialized).toContain("Annual")
    expect(serialized).toContain("active")
  })

  test("does not throw when Slack rejects a notification", async () => {
    process.env.SLACK_WEBHOOK_URL =
      "https://hooks.slack.com/services/T00000000/B00000000/test-token"
    const fetchMock = mock(async () => new Response("invalid_payload", { status: 400 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const delivered = await notifySlackAccountCreated({
      name: null,
      email: "test@example.com",
    })

    expect(delivered).toBe(false)
  })
})
