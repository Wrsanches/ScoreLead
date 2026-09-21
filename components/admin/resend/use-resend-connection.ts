"use client"

import { useCallback, useEffect, useState } from "react"
import type { PublicResendConnection } from "@/lib/resend/data"

export type ResendConnectionState = {
  enabled: boolean
  plan: string
  canUseEmail: boolean
  connection: PublicResendConnection | null
}

/** Loads the Resend connection summary for a business; secrets never leave the server. */
export function useResendConnection(businessId: string, enabled = true) {
  const [data, setData] = useState<ResendConnectionState | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/businesses/${businessId}/resend/connection`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error()
        return response.json() as Promise<ResendConnectionState>
      })
      .then((body) => {
        setData(body)
        setError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [businessId, enabled, revision])

  const refresh = useCallback(() => setRevision((r) => r + 1), [])
  const setConnection = useCallback((connection: PublicResendConnection | null) => {
    setData((prev) => (prev ? { ...prev, connection } : prev))
  }, [])

  return { data, loading, error, refresh, setConnection }
}
