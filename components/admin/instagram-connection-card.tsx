"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, Unplug } from "lucide-react"
import { SocialIcon } from "@/components/admin/social-icon"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { usePathname } from "@/i18n/routing"
import { parseLegacyBusinessPath } from "@/lib/admin-routes"

type ConnectionState = {
  enabled: boolean
  connection: {
    username: string
    status: string
    tokenExpiresAt: string
  } | null
}
export function InstagramConnectionCard({
  businessId,
  readOnly = false,
}: {
  businessId: string
  readOnly?: boolean
}) {
  const t = useTranslations("instagram")
  const locale = useLocale()
  const pathname = usePathname()
  const [data, setData] = useState<ConnectionState | null>(null)
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
  async function connect() {
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
  }
  async function disconnect() {
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
  }
  const connected =
    data?.connection?.status === "connected" &&
    new Date(data.connection.tokenExpiresAt) > new Date()
  return (
    <section
      aria-labelledby="instagram-heading"
      className="mb-8 border-y border-zinc-200 py-6 dark:border-zinc-800"
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-xl">
          <h2
            id="instagram-heading"
            className="flex items-center gap-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50"
          >
            <SocialIcon platform="instagram" className="size-5" />
            Instagram
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t("description")}
          </p>
          <p className="mt-2 text-xs text-zinc-500">{t("professionalOnly")}</p>
          {data?.connection && (
            <p className="mt-3 text-sm font-medium">
              @{data.connection.username} ·{" "}
              {connected ? t("connected") : t("reconnectRequired")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {loadError ? (
            <Button
              variant="outline"
              onClick={() => setRevision((value) => value + 1)}
            >
              {t("retry")}
            </Button>
          ) : !data ? (
            <Loader2
              className="size-4 animate-spin"
              aria-label={t("loading")}
            />
          ) : (
            !readOnly && (
              <>
                {(!connected || !data.connection) && (
                  <Button onClick={connect} disabled={busy || !data.enabled}>
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    {data.connection ? t("reconnect") : t("connect")}
                  </Button>
                )}
                {data.connection && (
                  <Button
                    variant="outline"
                    onClick={disconnect}
                    disabled={busy}
                  >
                    <Unplug className="size-4" />
                    {t("disconnect")}
                  </Button>
                )}
              </>
            )
          )}
        </div>
      </div>
      {data && !data.enabled && (
        <p className="mt-4 text-xs text-zinc-500">{t("unavailable")}</p>
      )}
      {loadError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {t("errors.LOAD_FAILED")}
        </p>
      )}
      {oauthResult && oauthResult !== "connected" && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {t.has(`errors.${oauthResult}`)
            ? t(`errors.${oauthResult}`)
            : t("errors.AUTH_FAILED")}
        </p>
      )}
    </section>
  )
}
