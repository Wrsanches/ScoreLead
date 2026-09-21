import { describe, expect, test } from "bun:test"
import { applyEmailEvent, type MessageState } from "./webhooks"

const base = (over: Partial<MessageState> = {}): MessageState => ({
  status: "accepted",
  openCount: 0,
  clickCount: 0,
  sentAt: null,
  deliveredAt: null,
  delayedAt: null,
  openedAt: null,
  clickedAt: null,
  bouncedAt: null,
  complainedAt: null,
  failedAt: null,
  ...over,
})
const at = "2026-09-21T10:00:00.000Z"
const ev = (type: string, data: Record<string, unknown> = {}) => ({ type, created_at: at, data: { email_id: "e1", ...data } })

describe("applyEmailEvent", () => {
  test("progress moves forward and stamps once", () => {
    const sent = applyEmailEvent(base(), ev("email.sent"))
    expect(sent).toEqual({ status: "sent", sentAt: new Date(at) })
    const delivered = applyEmailEvent(base({ status: "sent", sentAt: new Date(at) }), ev("email.delivered"))
    expect(delivered?.status).toBe("delivered")
    // late "sent" after delivered only stamps, never regresses
    const late = applyEmailEvent(base({ status: "delivered" }), ev("email.sent"))
    expect(late).toEqual({ sentAt: new Date(at) })
    expect(applyEmailEvent(base({ status: "delivered", sentAt: new Date(at) }), ev("email.sent"))).toBeNull()
  })

  test("opens and clicks count every time but only advance once", () => {
    const first = applyEmailEvent(base({ status: "delivered" }), ev("email.opened"))
    expect(first).toMatchObject({ status: "opened", openCount: 1 })
    const second = applyEmailEvent(base({ status: "opened", openCount: 1, openedAt: new Date(at) }), ev("email.opened"))
    expect(second).toEqual({ openCount: 2 })
    const click = applyEmailEvent(base({ status: "opened" }), ev("email.clicked", { click: { link: "https://x.io" } }))
    expect(click).toMatchObject({ status: "clicked", clickCount: 1, lastClickedUrl: "https://x.io" })
    // a late delivered after opened keeps the richer status
    expect(applyEmailEvent(base({ status: "opened" }), ev("email.delivered"))).toEqual({ deliveredAt: new Date(at) })
  })

  test("delay is only a status before delivery", () => {
    expect(applyEmailEvent(base({ status: "sent" }), ev("email.delivery_delayed"))).toMatchObject({ status: "delivery_delayed" })
    expect(applyEmailEvent(base({ status: "delivered" }), ev("email.delivery_delayed"))).toEqual({ delayedAt: new Date(at) })
  })

  test("terminal events override progress, but the first terminal state sticks", () => {
    const bounced = applyEmailEvent(
      base({ status: "opened" }),
      ev("email.bounced", { bounce: { type: "Permanent", subType: "Suppressed", message: "Known bad" } }),
    )
    expect(bounced).toMatchObject({ status: "bounced", errorCode: "Permanent/Suppressed", errorMessage: "Known bad" })
    const laterComplaint = applyEmailEvent(base({ status: "bounced", bouncedAt: new Date(at) }), ev("email.complained"))
    expect(laterComplaint).toEqual({ complainedAt: new Date(at) })
    const openAfterBounce = applyEmailEvent(base({ status: "bounced" }), ev("email.opened"))
    expect(openAfterBounce).toEqual({ openedAt: new Date(at), openCount: 1 })
    const failed = applyEmailEvent(base(), ev("email.failed", { failed: { reason: "Bad address" } }))
    expect(failed).toMatchObject({ status: "failed", errorCode: "failed", errorMessage: "Bad address" })
  })

  test("unknown events are ignored", () => {
    expect(applyEmailEvent(base(), ev("contact.created"))).toBeNull()
  })
})
