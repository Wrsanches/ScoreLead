"use client"

import { useEffect, useState } from "react"

/**
 * The browser origin, available after hydration. Server render and first client
 * render both see `undefined`, so markup matches; links can then switch to the
 * host-aware form without a hydration mismatch.
 */
export function useCurrentOrigin(): string | undefined {
  const [origin, setOrigin] = useState<string | undefined>(undefined)
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])
  return origin
}
