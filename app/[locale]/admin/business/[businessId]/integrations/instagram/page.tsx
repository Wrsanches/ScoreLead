"use client"

import { useLocale, useTranslations } from "next-intl"
import { CalendarClock, Link2, Loader2, Unplug } from "lucide-react"
import { ContentWrapper, PageHeader, SectionCard } from "@/components/admin"
import { BrandLogo } from "@/components/admin/brand-logo"
import { useInstagramConnection } from "@/components/admin/instagram-connection-card"
import { useBusinessAccess } from "@/components/admin/business-context"
import { Button } from "@/components/ui/button"

export default function InstagramIntegrationPage() {
  const t = useTranslations("integrations")
  const ti = useTranslations("instagram")
  const td = useTranslations("dashboard")
  const locale = useLocale()
  const { businessId, readOnly } = useBusinessAccess()
  const { data, busy, loadError, oauthResult, connected, connect, disconnect, retry } =
    useInstagramConnection(businessId)

  const connection = data?.connection ?? null
  const expiresAt = connection
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(connection.tokenExpiresAt),
      )
    : null

  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={t("instagramSetupTitle")}
          description={t("instagramSetupDescription")}
          breadcrumbs={[
            { label: td("businessPage"), href: "/admin/profile" },
            { label: t("title"), href: "/admin/integrations" },
            { label: t("instagramSetupTitle") },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <SectionCard title={t("accountSection")}>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex min-w-0 items-start gap-4">
                <BrandLogo platform="instagram" className="size-12 shrink-0" />
                <div className="min-w-0">
                  {!data && !loadError ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Loader2 className="size-4 animate-spin" aria-label={ti("loading")} />
                      {ti("loading")}
                    </div>
                  ) : connection ? (
                    <>
                      <p className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        @{connection.username}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                            connected
                              ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
                              : "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300"
                          }`}
                        >
                          {connected ? ti("connected") : ti("reconnectRequired")}
                        </span>
                      </p>
                      {expiresAt && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                          <CalendarClock className="size-3.5" aria-hidden="true" />
                          {t("accessRenewsBy", { date: expiresAt })}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        {t("notConnectedYet")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {ti("description")}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">{ti("professionalOnly")}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {loadError ? (
                  <Button variant="outline" onClick={retry}>
                    {ti("retry")}
                  </Button>
                ) : data && !readOnly ? (
                  <>
                    {(!connected || !connection) && (
                      <Button onClick={connect} disabled={busy || !data.enabled}>
                        {busy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Link2 className="size-4" />
                        )}
                        {connection ? ti("reconnect") : ti("connect")}
                      </Button>
                    )}
                    {connection && (
                      <Button variant="outline" onClick={disconnect} disabled={busy}>
                        <Unplug className="size-4" />
                        {ti("disconnect")}
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            </div>

            {data && !data.enabled && (
              <p className="mt-4 text-xs text-zinc-500">{ti("unavailable")}</p>
            )}
            {loadError && (
              <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
                {ti("errors.LOAD_FAILED")}
              </p>
            )}
            {oauthResult && oauthResult !== "connected" && (
              <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
                {ti.has(`errors.${oauthResult}`)
                  ? ti(`errors.${oauthResult}`)
                  : ti("errors.AUTH_FAILED")}
              </p>
            )}
          </SectionCard>

          <SectionCard title={t("howItWorks")}>
            <ol className="space-y-4">
              {[t("instagramStep1"), t("instagramStep2"), t("instagramStep3")].map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.07] dark:text-zinc-300 dark:ring-white/[0.12]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{step}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-zinc-200/80 pt-4 text-xs leading-5 text-zinc-500 dark:border-white/[0.08]">
              {ti("imagePreparation")}
            </p>
          </SectionCard>
        </div>
      </ContentWrapper>
    </div>
  )
}
