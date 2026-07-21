import { describe, expect, test } from "bun:test"
import {
  buildScheduledAt,
  businessDayBounds,
  isWithinSendWindow,
  zonedLocalToUtc,
} from "./schedule"

describe("WhatsApp scheduling", () => {
  test("converts a São Paulo local time to UTC", () => {
    expect(
      zonedLocalToUtc({ year: 2026, month: 7, day: 15 }, "10:00", "America/Sao_Paulo").toISOString(),
    ).toBe("2026-07-15T13:00:00.000Z")
  })

  test("moves a passed Day 0 time to the next allowed day", () => {
    const scheduled = buildScheduledAt({
      now: new Date("2026-07-14T16:00:00.000Z"),
      offsetDays: 0,
      localSendTime: "10:00",
      timezone: "America/Sao_Paulo",
      allowedWeekdays: [1, 2, 3, 4, 5],
    })
    expect(scheduled.toISOString()).toBe("2026-07-15T13:00:00.000Z")
  })

  test("rolls a weekend target to Monday", () => {
    const scheduled = buildScheduledAt({
      now: new Date("2026-07-17T12:00:00.000Z"),
      offsetDays: 1,
      localSendTime: "10:00",
      timezone: "America/Sao_Paulo",
      allowedWeekdays: [1, 2, 3, 4, 5],
    })
    expect(scheduled.toISOString()).toBe("2026-07-20T13:00:00.000Z")
  })

  test("checks local guardrails and day boundaries", () => {
    expect(isWithinSendWindow({
      now: new Date("2026-07-14T16:00:00.000Z"),
      timezone: "America/Sao_Paulo",
      allowedWeekdays: [2],
      start: "09:00",
      end: "17:00",
    })).toBe(true)
    const bounds = businessDayBounds(new Date("2026-07-14T16:00:00.000Z"), "America/Sao_Paulo")
    expect(bounds.start.toISOString()).toBe("2026-07-14T03:00:00.000Z")
    expect(bounds.end.toISOString()).toBe("2026-07-15T03:00:00.000Z")
  })
})
