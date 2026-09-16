"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getDeviceTimeZone } from "@/lib/timezone"

interface UserTimeZoneValue {
  /** The saved zone, or the device zone while nothing is saved yet. */
  timeZone: string
  /** Whether `timeZone` comes from the user's saved preference. */
  saved: boolean
  /** Persists a new zone and updates every consumer. */
  setTimeZone: (zone: string) => Promise<boolean>
}

const UserTimeZoneContext = createContext<UserTimeZoneValue | null>(null)

async function persist(zone: string): Promise<boolean> {
  try {
    const res = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: zone }),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Holds the user's time zone for the admin. On the first visit with nothing
 * saved, the device zone is written to the user row so server-side code and
 * other devices see the same default.
 */
export function UserTimeZoneProvider({
  initialTimeZone,
  children,
}: {
  initialTimeZone: string | null
  children: React.ReactNode
}) {
  const [savedZone, setSavedZone] = useState<string | null>(initialTimeZone)
  const [deviceZone] = useState(() => getDeviceTimeZone())

  useEffect(() => {
    if (savedZone) return
    let cancelled = false
    persist(deviceZone).then((ok) => {
      if (ok && !cancelled) setSavedZone(deviceZone)
    })
    return () => {
      cancelled = true
    }
  }, [savedZone, deviceZone])

  const value = useMemo<UserTimeZoneValue>(
    () => ({
      timeZone: savedZone ?? deviceZone,
      saved: savedZone !== null,
      setTimeZone: async (zone) => {
        const ok = await persist(zone)
        if (ok) setSavedZone(zone)
        return ok
      },
    }),
    [savedZone, deviceZone],
  )

  return (
    <UserTimeZoneContext.Provider value={value}>{children}</UserTimeZoneContext.Provider>
  )
}

/** The user's zone; outside the provider it degrades to the device zone. */
export function useUserTimeZone(): UserTimeZoneValue {
  const ctx = useContext(UserTimeZoneContext)
  const [deviceZone] = useState(() => getDeviceTimeZone())
  return (
    ctx ?? {
      timeZone: deviceZone,
      saved: false,
      setTimeZone: async () => false,
    }
  )
}
