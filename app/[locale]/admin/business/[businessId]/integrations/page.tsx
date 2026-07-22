"use client"

import Script from "next/script"
import { use, useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Check,
  Clock3,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react"
import { toast } from "sonner"
import { Link } from "@/i18n/routing"
import { ContentWrapper, PageHeader } from "@/components/admin"
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
import { usePlan } from "@/components/admin/plan-context"
import { authClient } from "@/lib/auth-client"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"

declare global {
  interface Window {
    FB?: {
      init(options: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void
      login(
        callback: (response: { authResponse?: { code?: string }; status?: string }) => void,
        options: Record<string, unknown>,
      ): void
    }
  }
}

type Connection = {
  id: string
  displayPhoneNumber: string | null
  verifiedName: string | null
  status: "connected" | "needs_action" | "disconnected"
  timezone: string
  allowedWeekdays: number[]
  dailyLimit: number
  sendWindowStart: string
  sendWindowEnd: string
  connectedAt: string
  lastTemplateSyncAt: string | null
}

type SignupConfig = {
  nonce: string
  appId: string
  configId: string
  graphVersion: string
}

type SignupResult = { wabaId: string; phoneNumberId?: string }

const META_MESSAGE_ORIGINS = new Set([
  "https://www.facebook.com",
  "https://web.facebook.com",
  "https://business.facebook.com",
])

const WHATSAPP_INTEGRATION_CONFIGURED =
  process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED === "true"

export default function IntegrationsPage({
  params,
}: {
  params: Promise<{ businessId: string }>
}) {
  const { businessId } = use(params)
  const t = useTranslations("whatsapp")
  const td = useTranslations("dashboard")
  const { isPro, openUpgrade } = usePlan()
  const { data: session } = authClient.useSession()
  const integrationEnabled =
    WHATSAPP_INTEGRATION_CONFIGURED && hasWhatsAppEarlyAccess(session?.user.email)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)
  const [sdkReady, setSdkReady] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [templateCount, setTemplateCount] = useState(0)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const signupConfig = useRef<SignupConfig | null>(null)
  const signupCode = useRef<string | null>(null)
  const signupResult = useRef<SignupResult | null>(null)
  const completing = useRef(false)

  const load = useCallback(async () => {
    if (!integrationEnabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/whatsapp/connection`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || t("loadError"))
      setConnection(body.connection)
      if (body.connection?.status === "connected" && isPro) {
        const templates = await fetch(`/api/businesses/${businessId}/whatsapp/templates`)
        if (templates.ok) {
          const templateBody = await templates.json()
          setTemplateCount(templateBody.templates?.length ?? 0)
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("loadError"))
    } finally {
      setLoading(false)
    }
  }, [businessId, integrationEnabled, isPro, t])

  useEffect(() => {
    load()
  }, [load])

  const finishConnection = useCallback(async () => {
    const config = signupConfig.current
    const code = signupCode.current
    const result = signupResult.current
    if (!config || !code || !result || completing.current) return
    completing.current = true
    try {
      const response = await fetch(`/api/businesses/${businessId}/whatsapp/connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          nonce: config.nonce,
          wabaId: result.wabaId,
          phoneNumberId: result.phoneNumberId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || t("connectError"))
      setConnection(body.connection)
      toast.success(t("connectedToast"))
      const sync = await fetch(`/api/businesses/${businessId}/whatsapp/templates/sync`, { method: "POST" })
      if (sync.ok) {
        const syncBody = await sync.json()
        setTemplateCount(syncBody.templates?.length ?? 0)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("connectError"))
    } finally {
      completing.current = false
      setConnecting(false)
      signupConfig.current = null
      signupCode.current = null
      signupResult.current = null
    }
  }, [businessId, t])

  useEffect(() => {
    if (!integrationEnabled) return

    const onMessage = (event: MessageEvent) => {
      if (!META_MESSAGE_ORIGINS.has(event.origin)) return
      let payload: unknown = event.data
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload)
        } catch {
          return
        }
      }
      if (!payload || typeof payload !== "object") return
      const message = payload as {
        type?: unknown
        event?: unknown
        data?: { waba_id?: unknown; phone_number_id?: unknown }
      }
      if (message.type !== "WA_EMBEDDED_SIGNUP") return
      if (message.event === "CANCEL" || message.event === "ERROR") {
        setConnecting(false)
        toast.error(t("signupCancelled"))
        return
      }
      if (
        (message.event === "FINISH" || message.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") &&
        typeof message.data?.waba_id === "string"
      ) {
        signupResult.current = {
          wabaId: message.data.waba_id,
          ...(typeof message.data.phone_number_id === "string"
            ? { phoneNumberId: message.data.phone_number_id }
            : {}),
        }
        void finishConnection()
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [finishConnection, integrationEnabled, t])

  async function connect() {
    if (!integrationEnabled) return

    if (!isPro) {
      openUpgrade()
      return
    }
    if (!sdkReady || !window.FB) {
      toast.error(t("sdkLoading"))
      return
    }
    setConnecting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/whatsapp/connection/nonce`, {
        method: "POST",
      })
      const config = (await response.json()) as SignupConfig & { error?: string }
      if (!response.ok) throw new Error(config.error || t("connectError"))
      signupConfig.current = config
      window.FB.init({ appId: config.appId, cookie: true, xfbml: false, version: config.graphVersion })
      window.FB.login(
        (login) => {
          const code = login.authResponse?.code
          if (!code) {
            setConnecting(false)
            toast.error(t("signupCancelled"))
            return
          }
          signupCode.current = code
          void finishConnection()
        },
        {
          config_id: config.configId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            version: "v4",
            sessionInfoVersion: "3",
            featureType: "whatsapp_business_app_onboarding",
            setup: {},
          },
        },
      )
    } catch (error) {
      setConnecting(false)
      toast.error(error instanceof Error ? error.message : t("connectError"))
    }
  }

  async function saveSettings() {
    if (!connection) return
    setSaving(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/whatsapp/connection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone: connection.timezone,
          allowedWeekdays: connection.allowedWeekdays,
          dailyLimit: connection.dailyLimit,
          sendWindowStart: connection.sendWindowStart,
          sendWindowEnd: connection.sendWindowEnd,
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || t("saveError"))
      setConnection(body.connection)
      toast.success(t("savedToast"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  async function syncTemplates() {
    setSyncing(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/whatsapp/templates/sync`, { method: "POST" })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || t("syncError"))
      setTemplateCount(body.templates?.length ?? 0)
      setConnection((current) => current ? { ...current, lastTemplateSyncAt: new Date().toISOString() } : current)
      toast.success(t("syncToast", { count: body.templates?.length ?? 0 }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("syncError"))
    } finally {
      setSyncing(false)
    }
  }

  async function disconnect() {
    try {
      const response = await fetch(`/api/businesses/${businessId}/whatsapp/connection`, { method: "DELETE" })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || t("disconnectError"))
      }
      setConnection(null)
      setTemplateCount(0)
      toast.success(t("disconnectedToast"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("disconnectError"))
    } finally {
      setDisconnectOpen(false)
    }
  }

  function toggleWeekday(day: number) {
    if (!connection) return
    const exists = connection.allowedWeekdays.includes(day)
    if (exists && connection.allowedWeekdays.length === 1) return
    setConnection({
      ...connection,
      allowedWeekdays: exists
        ? connection.allowedWeekdays.filter((value) => value !== day)
        : [...connection.allowedWeekdays, day].sort(),
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {integrationEnabled ? (
        <Script
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="afterInteractive"
          onLoad={() => setSdkReady(true)}
        />
      ) : null}
      <ContentWrapper>
        <PageHeader
          variant="hero"
          title={t("title")}
          description={integrationEnabled ? t("description") : t("comingSoonPageDescription")}
          breadcrumbs={[{ label: td("businessPage"), href: `/admin/business/${businessId}/profile` }, { label: t("title") }]}
        />

        {!integrationEnabled ? (
          <section
            className="grid gap-8 border-y border-zinc-200 py-8 dark:border-zinc-800 lg:grid-cols-[minmax(0,1fr)_22rem]"
            aria-labelledby="whatsapp-coming-soon-title"
          >
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {t("comingSoonBadge")}
              </span>
              <h2 id="whatsapp-coming-soon-title" className="mt-5 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                {t("comingSoonTitle")}
              </h2>
              <p id="whatsapp-coming-soon-description" className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {t("comingSoonDescription")}
              </p>
              <Button className="mt-6" disabled aria-describedby="whatsapp-coming-soon-description">
                <Link2 className="h-4 w-4" aria-hidden="true" />
                {t("comingSoonAction")}
              </Button>
            </div>
            <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <InfoRow icon={ShieldCheck} title={t("consentTitle")} text={t("consentDescription")} />
              <InfoRow icon={Check} title={t("templatesTitle")} text={t("templatesDescription")} />
              <InfoRow icon={Clock3} title={t("guardrailsTitle")} text={t("guardrailsDescription")} />
            </div>
          </section>
        ) : loading ? (
          <div className="flex h-52 items-center justify-center text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !connection || connection.status !== "connected" ? (
          <section className="grid gap-8 border-y border-zinc-200 py-8 dark:border-zinc-800 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="max-w-2xl">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{t("connectTitle")}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">{t("connectDescription")}</p>
              <Button className="mt-6" onClick={connect} disabled={connecting}>
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {connecting ? t("connecting") : isPro ? t("connectButton") : t("upgradeButton")}
              </Button>
            </div>
            <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <InfoRow icon={ShieldCheck} title={t("consentTitle")} text={t("consentDescription")} />
              <InfoRow icon={Check} title={t("templatesTitle")} text={t("templatesDescription")} />
              <InfoRow icon={Clock3} title={t("guardrailsTitle")} text={t("guardrailsDescription")} />
            </div>
          </section>
        ) : (
          <div className="space-y-10">
            <section className="flex flex-col justify-between gap-5 border-y border-zinc-200 py-6 dark:border-zinc-800 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {connection.verifiedName || t("connectedAccount")}
                    </h2>
                    <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {t("connected")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{connection.displayPhoneNumber || t("numberUnavailable")}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setDisconnectOpen(true)}>
                <Unplug className="h-4 w-4" />
                {t("disconnect")}
              </Button>
            </section>

            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div>
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{t("sendingSettings")}</h2>
                <p className="mt-1 text-sm text-zinc-500">{t("sendingSettingsDescription")}</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="wa-timezone">{t("timezone")}</Label>
                    <Input
                      id="wa-timezone"
                      className="mt-2"
                      value={connection.timezone}
                      onChange={(event) => setConnection({ ...connection, timezone: event.target.value })}
                      placeholder="America/Sao_Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wa-start">{t("windowStart")}</Label>
                    <Input
                      id="wa-start"
                      type="time"
                      className="mt-2"
                      value={connection.sendWindowStart}
                      onChange={(event) => setConnection({ ...connection, sendWindowStart: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wa-end">{t("windowEnd")}</Label>
                    <Input
                      id="wa-end"
                      type="time"
                      className="mt-2"
                      value={connection.sendWindowEnd}
                      onChange={(event) => setConnection({ ...connection, sendWindowEnd: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wa-limit">{t("dailyLimit")}</Label>
                    <Input
                      id="wa-limit"
                      type="number"
                      min={1}
                      max={100}
                      className="mt-2"
                      value={connection.dailyLimit}
                      onChange={(event) => setConnection({ ...connection, dailyLimit: Number(event.target.value) })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t("weekdays")}</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                        const active = connection.allowedWeekdays.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleWeekday(day)}
                            className={`h-9 min-w-11 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                              active
                                ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200"
                                : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                            }`}
                          >
                            {t(`day${day}`)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <Button className="mt-6" onClick={saveSettings} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("saveSettings")}
                </Button>
              </div>

              <aside className="border-t border-zinc-200 pt-6 dark:border-zinc-800 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("approvedTemplates")}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">{templateCount}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{t("templateHelp")}</p>
                <Button asChild className="mt-5 w-full">
                  <Link href={`/admin/business/${businessId}/integrations/whatsapp-templates`}>
                    {t("manageTemplates")}
                  </Link>
                </Button>
                <Button variant="outline" className="mt-2 w-full" onClick={syncTemplates} disabled={syncing}>
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {t("syncTemplates")}
                </Button>
              </aside>
            </section>
          </div>
        )}
      </ContentWrapper>

      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("disconnectTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("disconnectDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={disconnect} className="bg-red-600 hover:bg-red-700">
              {t("disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType
  title: string
  text: string
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{text}</p>
      </div>
    </div>
  )
}
