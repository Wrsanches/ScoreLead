type LocalDate = { year: number; month: number; day: number }

export function partsInTimezone(date: Date, timezone: string): LocalDate & { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
  }
}

function addDays(date: LocalDate, days: number): LocalDate {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() }
}

function weekday(date: LocalDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
}

/** Convert a future local business time to UTC without relying on server timezone. */
export function zonedLocalToUtc(date: LocalDate, time: string, timezone: string): Date {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) throw new Error("Invalid local send time")
  const hour = Number(match[1])
  const minute = Number(match[2])
  let guess = new Date(Date.UTC(date.year, date.month - 1, date.day, hour, minute))
  const desired = Date.UTC(date.year, date.month - 1, date.day, hour, minute)

  for (let i = 0; i < 3; i += 1) {
    const current = partsInTimezone(guess, timezone)
    const observed = Date.UTC(current.year, current.month - 1, current.day, current.hour, current.minute)
    guess = new Date(guess.getTime() + desired - observed)
  }
  return guess
}

export function buildScheduledAt(input: {
  now?: Date
  offsetDays: number
  localSendTime: string
  timezone: string
  allowedWeekdays: number[]
}): Date {
  const now = input.now ?? new Date()
  const localNow = partsInTimezone(now, input.timezone)
  let target = addDays(localNow, input.offsetDays)
  while (!input.allowedWeekdays.includes(weekday(target))) target = addDays(target, 1)
  let scheduled = zonedLocalToUtc(target, input.localSendTime, input.timezone)

  // A Day 0 time already passed: move to the next permitted day rather than send immediately.
  if (scheduled <= now) {
    target = addDays(target, 1)
    while (!input.allowedWeekdays.includes(weekday(target))) target = addDays(target, 1)
    scheduled = zonedLocalToUtc(target, input.localSendTime, input.timezone)
  }
  return scheduled
}

export function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export function isValidTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  return !!match && Number(match[1]) <= 23 && Number(match[2]) <= 59
}

export function isWithinSendWindow(input: {
  now?: Date
  timezone: string
  allowedWeekdays: number[]
  start: string
  end: string
}): boolean {
  const parts = partsInTimezone(input.now ?? new Date(), input.timezone)
  const weekdayNumber = weekday(parts)
  const time = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`
  return input.allowedWeekdays.includes(weekdayNumber) && time >= input.start && time < input.end
}

export function businessDayBounds(now: Date, timezone: string): { start: Date; end: Date } {
  const local = partsInTimezone(now, timezone)
  const start = zonedLocalToUtc(local, "00:00", timezone)
  const end = zonedLocalToUtc(addDays(local, 1), "00:00", timezone)
  return { start, end }
}
