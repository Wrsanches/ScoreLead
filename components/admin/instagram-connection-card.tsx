"use client"

import { useCallback, useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { usePathname } from "@/i18n/routing"
import { parseLegacyBusinessPath } from "@/lib/admin-routes"

export type InstagramConnectionState = {
  enabled: boolean
  connection: {
    username: string
    status: string
    tokenExpiresAt: string
  } | null
}

/**
 * Loads the Instagram connection for a business and exposes connect /
 * disconnect actions. Also consumes the `?instagram=` OAuth result the
 * callback appends when it redirects back to the setup page.
 */
export function useInstagramConnection(businessId: string) {
  const t = useTranslations("instagram")
  const locale = useLocale()
  const pathname = usePathname()
  const [data, setData] = useState<InstagramConnectionState | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [oauthResult, setOauthResult] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/businesses/${businessId}/instagram/connection`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error()
        return response.json()
      })
      .then((body) => {
        setData(body)
        setLoadError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true)
      })
    return () => controller.abort()
  }, [businessId, revision])

  useEffect(() => {
    // BusinessProvider first migrates legacy callback URLs to the clean route.
    // Consuming the result before that reload loses both the query and toast.
    if (parseLegacyBusinessPath(pathname)) return
    const url = new URL(window.location.href)
    const result = url.searchParams.get("instagram")
    if (!result) return
    setOauthResult(result)
    if (result === "connected") toast.success(t("connectedToast"))
    else
      toast.error(
        t.has(`errors.${result}`)
          ? t(`errors.${result}`)
          : t("errors.AUTH_FAILED"),
      )
    url.searchParams.delete("instagram")
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    )
  }, [pathname, t])

  const connect = useCallback(async () => {
    setBusy(true)
    setOauthResult(null)
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/instagram/connect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
        },
      )
      const body = await response.json()
      if (!response.ok || !body.url) throw new Error(body.code || "AUTH_FAILED")
      const url = new URL(body.url)
      if (url.origin !== "https://www.instagram.com")
        throw new Error("AUTH_FAILED")
      window.location.assign(url.toString())
    } catch (error) {
      const code = error instanceof Error ? error.message : "AUTH_FAILED"
      toast.error(
        t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.AUTH_FAILED"),
      )
      setBusy(false)
    }
  }, [businessId, locale, t])

  const disconnect = useCallback(async () => {
    if (!window.confirm(t("disconnectConfirm"))) return
    setBusy(true)
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/instagram/connection`,
        { method: "DELETE" },
      )
      const body = await response.json()
      if (!response.ok) throw new Error(body.code || "INSTAGRAM_REQUEST_FAILED")
      setData((previous) =>
        previous ? { ...previous, connection: null } : previous,
      )
      toast.success(t("disconnectedToast"))
    } catch (error) {
      const code =
        error instanceof Error ? error.message : "INSTAGRAM_REQUEST_FAILED"
      toast.error(
        t.has(`errors.${code}`)
          ? t(`errors.${code}`)
          : t("errors.INSTAGRAM_REQUEST_FAILED"),
      )
    } finally {
      setBusy(false)
    }
  }, [businessId, t])

  const retry = useCallback(() => setRevision((value) => value + 1), [])

  const connected =
    data?.connection?.status === "connected" &&
    new Date(data.connection.tokenExpiresAt) > new Date()

  return { data, busy, loadError, oauthResult, connected, connect, disconnect, retry }
}
