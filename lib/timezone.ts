/**
 * Time zone helpers shared by the browser and the server.
 *
 * The user's zone lives on the user row (`user.timezone`). It is filled from
 * the browser the first time they open the app, can be changed in Settings,
 * and is the default wherever something is scheduled or a time is shown.
 */

export const DEFAULT_TIME_ZONE = "UTC"

/** True when the runtime's Intl implementation knows the zone. */
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}

/** The zone the current device reports, or UTC when unavailable. */
export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

/** Every IANA zone the runtime supports, for pickers. */
export function getSupportedTimeZones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  if (typeof intl.supportedValuesOf === "function") {
    try {
      return intl.supportedValuesOf("timeZone")
    } catch {
      // fall through to the minimal list
    }
  }
  return [DEFAULT_TIME_ZONE, getDeviceTimeZone()].filter((v, i, a) => a.indexOf(v) === i)
}

/** "America/Sao_Paulo" -> "Sao Paulo (GMT-3)" for display. */
export function formatTimeZoneLabel(zone: string, locale = "en"): string {
  const city = zone.split("/").pop()?.replace(/_/g, " ") ?? zone
  try {
    const offset = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value
    return offset ? `${city} (${offset})` : city
  } catch {
    return city
  }
}
