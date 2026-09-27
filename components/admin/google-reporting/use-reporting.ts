"use client"
import { useCallback, useEffect, useState } from "react"
export type ReportingConnection = {
  id: string
  provider: "ga4" | "search_console"
  email: string
  status: "connected" | "reconnect"
  lastError: string | null
  lastCheckedAt: string | null
  updatedAt: string
  resources: { id: string; externalId: string; name: string }[]
}
export type ReportingSummary = {
  enabled: boolean
  mcpUrl: string
  connections: ReportingConnection[]
  grants: {
    id: string
    name: string
    resourceIds: string[]
    createdAt: string
    expiresAt: string
    lastUsedAt: string | null
  }[]
}
export async function reportingFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || "REPORTING_UNAVAILABLE")
  return body as T
}
export function useReporting(businessId: string) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{
    businessId: string
    data?: ReportingSummary
    error?: string
    revision: number
  }>({ businessId, revision: -1 })
  useEffect(() => {
    const controller = new AbortController()
    reportingFetch<ReportingSummary>(
      `/api/businesses/${businessId}/google-reporting`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (!controller.signal.aborted) setState({ businessId, data, revision })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            businessId,
            error: error.message || "REPORTING_UNAVAILABLE",
            revision,
          })
      })
    return () => controller.abort()
  }, [businessId, revision])
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  return {
    data: state.businessId === businessId ? state.data : undefined,
    error: state.businessId === businessId ? state.error : undefined,
    loading: state.businessId !== businessId || state.revision !== revision,
    reload,
  }
}
