"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Lock,
  Mail,
  Radio,
  Unplug,
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { ContentWrapper, PageHeader, SectionCard } from "@/components/admin"
import { BrandLogo } from "@/components/admin/brand-logo"
import { useBusinessAccess } from "@/components/admin/business-context"
import { usePlan } from "@/components/admin/plan-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ResendConnectForm } from "@/components/admin/resend/connect-form"
import { useResendConnection } from "@/components/admin/resend/use-resend-connection"
import { readJson, resendErrorMessage } from "@/components/admin/resend/errors"
import { isResendIntegrationEnabled } from "@/lib/resend/feature-access"
import { RESEND_WEBHOOK_EVENTS } from "@/lib/resend/constants"
import type { PublicResendConnection } from "@/lib/resend/data"

const INPUT =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"

function InfoRow({ icon: Icon, title, text }: { icon: typeof Mail; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.1]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{text}</p>
      </div>
    </div>
  )
}

export default function ResendIntegrationPage() {
  const t = useTranslations("integrations")
  const tr = useTranslations("resend")
  const td = useTranslations("dashboard")
  const { businessId, readOnly } = useBusinessAccess()
  const { can: planCan, openUpgrade } = usePlan()
  const enabled = isResendIntegrationEnabled()
  const { data, loading, error, refresh, setConnection } = useResendConnection(businessId, enabled)
  const connection = data?.connection ?? null
  const canUse = readOnly ? !!data?.canUseEmail : planCan("emailOutreach")

  const [fromName, setFromName] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [replyTo, setReplyTo] = useState("")
  const [savingSender, setSavingSender] = useState(false)
  const [secret, setSecret] = useState("")
  const [savingSecret, setSavingSecret] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (!connection) return
    setFromName(connection.fromName)
    setFromEmail(connection.fromEmail)
    setReplyTo(connection.replyTo ?? "")
  }, [connection])

  async function patch(body: Record<string, unknown>) {
    const response = await fetch(`/api/businesses/${businessId}/resend/connection`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await readJson<{ connection?: PublicResendConnection; error?: string; code?: string }>(response)
    if (!response.ok || !json?.connection) throw new Error(resendErrorMessage(tr, json, "saveError"))
    return json.connection
  }

  async function saveSender() {
    setSavingSender(true)
    try {
      const updated = await patch({
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim().toLowerCase(),
        replyTo: replyTo.trim() || "",
      })
      setConnection(updated)
      toast.success(tr("savedToast"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr("saveError"))
    } finally {
      setSavingSender(false)
    }
  }

  async function saveSecret() {
    setSavingSecret(true)
    try {
      const updated = await patch({ webhookSigningSecret: secret.trim() })
      setConnection(updated)
      setSecret("")
      toast.success(tr("secretSavedToast"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr("saveError"))
    } finally {
      setSavingSecret(false)
    }
  }

  async function disconnect() {
    setDisconnecting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/resend/connection`, { method: "DELETE" })
      if (!response.ok) throw new Error()
      setConnection(null)
      setDisconnectOpen(false)
      toast.success(tr("disconnectedToast"))
    } catch {
      toast.error(tr("disconnectError"))
    } finally {
      setDisconnecting(false)
    }
  }

  async function copyEndpoint() {
    if (!connection) return
    try {
      await navigator.clipboard.writeText(connection.webhookEndpoint)
      toast.success(tr("copied"))
    } catch {
      /* clipboard unavailable */
    }
  }

  const senderDirty =
    !!connection &&
    (fromName.trim() !== connection.fromName ||
      fromEmail.trim().toLowerCase() !== connection.fromEmail ||
      (replyTo.trim() || "") !== (connection.replyTo ?? ""))

  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={t("resendSetupTitle")}
          description={t("resendSetupDescription")}
          breadcrumbs={[
            { label: td("businessPage"), href: "/admin/profile" },
            { label: t("title"), href: "/admin/integrations" },
            { label: t("resendSetupTitle") },
          ]}
          actions={
            enabled && data?.enabled && canUse ? (
              <Link
                href="/admin/integrations/email-templates"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <FileText className="size-4" aria-hidden="true" />
                {t("emailTemplatesTitle")}
              </Link>
            ) : undefined
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="space-y-6">
            <SectionCard title={t("accountSection")}>
              {!enabled ? (
                <div className="flex items-start gap-4">
                  <BrandLogo platform="resend" className="size-12 shrink-0" />
                  <div>
                    <span className="rounded-full border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-white/[0.14] dark:bg-white/[0.07] dark:text-zinc-400">
                      {tr("comingSoonBadge")}
                    </span>
                    <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">{tr("comingSoonTitle")}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{tr("comingSoonDescription")}</p>
                  </div>
                </div>
              ) : loading && !data ? (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {tr("loading")}
                </div>
              ) : error || !data ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">{tr("loadError")}</p>
                  <Button variant="outline" onClick={refresh}>{tr("retry")}</Button>
                </div>
              ) : !data.enabled ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{tr("notConfigured")}</p>
              ) : !connection ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <BrandLogo platform="resend" className="size-12 shrink-0" />
                    <div>
                      <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{t("notConnectedYet")}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{tr("connectDescription")}</p>
                    </div>
                  </div>
                  {readOnly ? null : !canUse ? (
                    <Button onClick={() => openUpgrade("emailOutreach")}>{tr("upgradeButton")}</Button>
                  ) : (
                    <ResendConnectForm businessId={businessId} onConnected={setConnection} />
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="flex min-w-0 items-start gap-4">
                      <BrandLogo platform="resend" className="size-12 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {connection.fromName} &lt;{connection.fromEmail}&gt;
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                              connection.status === "connected"
                                ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
                                : "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300"
                            }`}
                          >
                            {connection.status === "connected" ? tr("connected") : tr("needsAction")}
                          </span>
                          <span className="font-mono text-xs text-zinc-500">
                            {tr("keyEnding", { last4: connection.keyLastFour ?? "????" })}
                          </span>
                        </p>
                        {connection.status !== "connected" && (
                          <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-400">{tr("needsActionHelp")}</p>
                        )}
                      </div>
                    </div>
                    {!readOnly && (
                      <Button variant="outline" onClick={() => setDisconnectOpen(true)}>
                        <Unplug className="size-4" />
                        {tr("disconnect")}
                      </Button>
                    )}
                  </div>

                  {connection.status !== "connected" && !readOnly && (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                      <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{tr("reconnectTitle")}</p>
                      <ResendConnectForm businessId={businessId} onConnected={setConnection} />
                    </div>
                  )}

                  <div className="border-t border-zinc-200 pt-5 dark:border-white/[0.08]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{tr("senderSection")}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{tr("senderDescription")}</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-zinc-500">{tr("fromName")}</Label>
                        <Input value={fromName} onChange={(e) => setFromName(e.target.value)} className={INPUT} disabled={readOnly || savingSender} maxLength={120} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-zinc-500">{tr("fromEmail")}</Label>
                        <Input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className={INPUT} disabled={readOnly || savingSender} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs uppercase tracking-wider text-zinc-500">{tr("replyTo")}</Label>
                        <Input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder={tr("optional")} className={INPUT} disabled={readOnly || savingSender} />
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="mt-4">
                        <Button onClick={saveSender} disabled={!senderDirty || savingSender}>
                          {savingSender && <Loader2 className="size-4 animate-spin" />}
                          {tr("saveSender")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>

            {connection && (
              <SectionCard title={tr("trackingSection")}>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{tr("trackingDescription")}</p>
                {connection.webhookStatus === "active" ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {tr("webhookActive")}
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {connection.webhookStatus === "manual" ? (
                      <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        {tr("webhookManualSaved")}
                      </p>
                    ) : (
                      <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {tr("webhookMissing")}
                      </p>
                    )}
                    <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.07] dark:text-zinc-300 dark:ring-white/[0.12]">1</span>
                        <div className="min-w-0 flex-1">
                          <p>{tr("webhookManualStep1")}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-800 dark:bg-white/[0.06] dark:text-zinc-200">
                              {connection.webhookEndpoint}
                            </code>
                            <Button variant="outline" size="sm" onClick={copyEndpoint} aria-label={tr("copyEndpoint")}>
                              <Copy className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.07] dark:text-zinc-300 dark:ring-white/[0.12]">2</span>
                        <div>
                          <p>{tr("webhookManualStep2")}</p>
                          <p className="mt-1 font-mono text-xs text-zinc-500">{RESEND_WEBHOOK_EVENTS.join(", ")}</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.07] dark:text-zinc-300 dark:ring-white/[0.12]">3</span>
                        <div className="min-w-0 flex-1">
                          <p>{tr("webhookManualStep3")}</p>
                          {!readOnly && (
                            <div className="mt-2 flex gap-2">
                              <Input
                                type="password"
                                autoComplete="off"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="whsec_••••••••"
                                className={INPUT}
                                disabled={savingSecret}
                              />
                              <Button onClick={saveSecret} disabled={!/^whsec_/.test(secret.trim()) || savingSecret} className="shrink-0">
                                {savingSecret && <Loader2 className="size-4 animate-spin" />}
                                {tr("saveSecret")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </li>
                    </ol>
                  </div>
                )}
                <p className="mt-5 border-t border-zinc-200/80 pt-4 text-xs leading-5 text-zinc-500 dark:border-white/[0.08]">
                  {tr("trackingNote")}
                </p>
              </SectionCard>
            )}
          </div>

          <div className="space-y-6">
            <SectionCard title={t("howItWorks")}>
              <div className="space-y-5">
                <InfoRow icon={Lock} title={tr("securityTitle")} text={tr("securityDescription")} />
                <InfoRow icon={Mail} title={tr("domainTitle")} text={tr("domainDescription")} />
                <InfoRow icon={Radio} title={tr("trackingTitle")} text={tr("trackingInfoDescription")} />
              </div>
            </SectionCard>
          </div>
        </div>
      </ContentWrapper>

      <AlertDialog open={!readOnly && disconnectOpen} onOpenChange={(open) => !disconnecting && setDisconnectOpen(open)}>
        <AlertDialogContent className="glass-strong rounded-2xl border-transparent">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("disconnectTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{tr("disconnectDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>{tr("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={disconnecting}
              onClick={(e) => {
                e.preventDefault()
                void disconnect()
              }}
              className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
            >
              {disconnecting ? tr("disconnecting") : tr("disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
