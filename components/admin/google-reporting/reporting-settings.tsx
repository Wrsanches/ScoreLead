"use client"
import { useEffect, useState } from "react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import {
  Check,
  ShieldCheck,
  ArrowUpRight,
  Copy,
  Loader2,
  Plus,
} from "lucide-react"
import { Link, useRouter } from "@/i18n/routing"
import {
  reportingIntegrationPath,
  type ReportingIntegration,
} from "@/lib/google-reporting/paths"
import { ReportingIcon } from "./reporting-icon"
import {
  ReportingNavigationProvider,
  useReportingNavigation,
} from "./reporting-navigation"
import { toast } from "sonner"
import { ContentWrapper, PageHeader, SectionCard } from "@/components/admin"
import { useBusinessAccess } from "@/components/admin/business-context"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  reportingFetch,
  useReporting,
  type ReportingConnection,
  type ReportingSummary,
} from "./use-reporting"

function useReportingError() {
  const t = useTranslations("googleReporting")
  return (error: unknown) => {
    const code = error instanceof Error ? error.message : String(error)
    return t.has(`errors.${code}`)
      ? t(`errors.${code}`)
      : t("errors.REPORTING_UNAVAILABLE")
  }
}
function ConfirmAction({
  label,
  description,
  action,
  disabled = false,
}: {
  label: string
  description: string
  action: () => void
  disabled?: boolean
}) {
  const t = useTranslations("googleReporting")
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={action}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
function ConnectionEditor({
  businessId,
  connection,
  reload,
  connect,
}: {
  businessId: string
  connection: ReportingConnection
  reload: () => void
  connect: () => void
}) {
  const t = useTranslations("googleReporting"),
    format = useFormatter(),
    errorText = useReportingError()
  const [resources, setResources] =
    useState<{ externalId: string; name: string }[]>()
  const [selected, setSelected] = useState(
    connection.resources.map((r) => r.externalId),
  )
  const [error, setError] = useState<string | undefined>(
      connection.lastError || undefined,
    ),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0)
  const { setDirty } = useReportingNavigation()
  const changed =
    selected.length !== connection.resources.length ||
    selected.some(
      (id) => !connection.resources.some((r) => r.externalId === id),
    )
  useEffect(() => {
    setDirty(connection.id, changed)
    return () => setDirty(connection.id, false)
  }, [connection.id, changed, setDirty])
  const base = `/api/businesses/${businessId}/google-reporting/connections/${connection.id}`
  useEffect(() => {
    const controller = new AbortController()
    reportingFetch<{ resources: { externalId: string; name: string }[] }>(
      `${base}/resources`,
      { signal: controller.signal },
    )
      .then((body) => {
        if (!controller.signal.aborted) {
          setResources(body.resources)
          setError(undefined)
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message)
      })
    return () => controller.abort()
  }, [base, revision])
  async function save() {
    setBusy(true)
    setError(undefined)
    try {
      await reportingFetch(`${base}/resources`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalIds: selected,
          version: connection.updatedAt,
        }),
      })
      setDirty(connection.id, false)
      toast.success(t("saved"))
      reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "REPORTING_UNAVAILABLE")
    } finally {
      setBusy(false)
    }
  }
  async function disconnect() {
    setBusy(true)
    try {
      await reportingFetch(base, { method: "DELETE" })
      setDirty(connection.id, false)
      toast.success(t("disconnected"))
      reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "REPORTING_UNAVAILABLE")
    } finally {
      setBusy(false)
    }
  }
  const unavailable = connection.resources.filter(
    (r) =>
      resources && !resources.some((item) => item.externalId === r.externalId),
  )
  const options = [...(resources || []), ...unavailable]
  return (
    <SectionCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-all font-semibold text-zinc-950 dark:text-zinc-50">
            {connection.email}
          </h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {connection.status === "reconnect"
              ? t("reconnect")
              : t("selectedCount", { count: connection.resources.length })}
          </p>
          {connection.lastCheckedAt && (
            <p className="mt-1 text-xs text-zinc-500">
              {t("lastChecked", {
                date: format.dateTime(new Date(connection.lastCheckedAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={connect} disabled={busy}>
            {t("reconnect")}
          </Button>
          <ConfirmAction
            label={t("disconnect")}
            description={t("disconnectDescription")}
            action={disconnect}
            disabled={busy}
          />
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="mt-3 text-sm text-amber-700 dark:text-amber-300"
        >
          {errorText(error)}
          <Button
            variant="link"
            onClick={() => {
              if (error === "CONNECTION_CHANGED") reload()
              else setRevision((r) => r + 1)
            }}
          >
            {t("retry")}
          </Button>
        </div>
      )}
      {!resources && !error && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
        >
          <Loader2 className="size-4 animate-spin" />
          {t("loadingProperties")}
        </p>
      )}
      {resources && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <fieldset
            disabled={busy}
            className="mt-5 border-t border-black/[0.06] pt-5 dark:border-white/[0.08]"
          >
            <legend className="mb-2 text-sm font-medium">
              {t("chooseProperties")}
            </legend>
            {options.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("noProperties")}
              </p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {options.map((r) => (
                  <label
                    key={r.externalId}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-zinc-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 dark:hover:bg-white/[0.04] ${selected.includes(r.externalId) ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-transparent"}`}
                  >
                    <input
                      type="checkbox"
                      name="properties"
                      value={r.externalId}
                      className="mt-1 size-4 shrink-0 accent-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                      checked={selected.includes(r.externalId)}
                      onChange={(event) =>
                        setSelected((values) =>
                          event.target.checked
                            ? [...values, r.externalId]
                            : values.filter((v) => v !== r.externalId),
                        )
                      }
                    />
                    <span className="min-w-0 text-sm text-zinc-800 dark:text-zinc-200">
                      <span className="block break-words">{r.name}</span>
                      <span className="block break-all text-xs text-zinc-500">
                        {r.externalId}
                        {unavailable.some(
                          (item) => item.externalId === r.externalId,
                        ) && ` — ${t("propertyUnavailable")}`}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            <Button
              className="mt-4 min-w-36"
              type="submit"
              disabled={busy || !changed || selected.length > 100}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {t("saveSelection")}
            </Button>
            <p role="status" className="mt-2 min-h-5 text-xs text-zinc-500">
              {selected.length > 100
                ? t("propertiesLimit")
                : changed
                  ? t("unsaved")
                  : t("selectedCount", { count: selected.length })}
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              {t("selectionHelp")}
            </p>
          </fieldset>
        </form>
      )}
    </SectionCard>
  )
}
function AssistantSettings({
  data,
  businessId,
  reload,
}: {
  data: ReportingSummary
  businessId: string
  reload: () => void
}) {
  const t = useTranslations("googleReporting"),
    format = useFormatter(),
    errorText = useReportingError()
  const [busy, setBusy] = useState<string>()
  const [revokeError, setRevokeError] = useState<string>()
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t("copied"))
    } catch {
      toast.error(t("copyFailed"))
    }
  }
  async function revoke(id: string) {
    setBusy(id)
    setRevokeError(undefined)
    try {
      await reportingFetch(
        `/api/businesses/${businessId}/google-reporting/grants/${id}`,
        { method: "DELETE" },
      )
      toast.success(t("revoked"))
      reload()
    } catch (cause) {
      setRevokeError(errorText(cause))
    } finally {
      setBusy(undefined)
    }
  }
  const commands = [
    {
      name: "Codex",
      value: `codex mcp add scorelead --url ${data.mcpUrl}\ncodex mcp login scorelead`,
      help: t("codexHelp"),
    },
    {
      name: "Claude Code",
      value: `claude mcp add --transport http --scope user scorelead ${data.mcpUrl}`,
      help: t("claudeHelp"),
    },
  ]
  return (
    <div className="min-w-0 space-y-6">
      <SectionCard title={t("assistantSetup")}>
        <div className="mb-5 flex items-start gap-4">
          <ReportingIcon integration="assistants" />
          <div>
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
              {t("assistantsTitle")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t("assistantDescription")}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {commands.map((command) => (
            <div
              key={command.name}
              className="min-w-0 rounded-xl border border-black/[0.08] dark:border-white/[0.10] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{command.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(command.value)}
                >
                  <Copy className="size-4" />
                  {t("copy")}
                </Button>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs leading-6 text-zinc-700 dark:bg-black/20 dark:text-zinc-300">
                <code>{command.value}</code>
              </pre>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {command.help}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {t("samplePrompt")}
        </p>
      </SectionCard>
      <SectionCard title={t("authorizedAssistants")}>
        {revokeError && (
          <p
            role="alert"
            className="mb-3 text-sm text-red-600 dark:text-red-400"
          >
            {revokeError}
          </p>
        )}
        {data.grants.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {t("noAssistants")}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            {data.grants.map((grant) => (
              <li
                key={grant.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{grant.name}</p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {t("grantDetails", {
                      count: grant.resourceIds.length,
                      date: format.dateTime(new Date(grant.expiresAt), {
                        dateStyle: "medium",
                      }),
                    })}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {grant.lastUsedAt
                      ? t("lastUsed", {
                          date: format.dateTime(new Date(grant.lastUsedAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }),
                        })
                      : t("neverUsed")}
                  </p>
                </div>
                <ConfirmAction
                  label={t("revoke")}
                  description={t("revokeDescription")}
                  action={() => revoke(grant.id)}
                  disabled={busy === grant.id}
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}
function SetupGuide({
  integration,
  data,
}: {
  integration: ReportingIntegration
  data?: ReportingSummary
}) {
  const t = useTranslations("googleReporting")
  const ti = useTranslations("integrations")
  const assistants = integration === "assistants"
  const steps = assistants
    ? [t("assistantStep1"), t("assistantStep2"), t("assistantStep3")]
    : [t("googleStep1"), t("googleStep2"), t("googleStep3")]
  return (
    <aside className="min-w-0 space-y-6">
      <SectionCard title={ti("howItWorks")}>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.07] dark:text-zinc-300 dark:ring-white/[0.12]">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {step}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex gap-2 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <p className="text-xs leading-5 text-zinc-500">{t("readOnlyHelp")}</p>
        </div>
      </SectionCard>
      {assistants && (
        <SectionCard title={t("connectedSources")}>
          <p className="mb-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t("sourcesHelp")}
          </p>
          <div className="space-y-2">
            {(["ga4", "search_console"] as const).map((provider) => {
              const count = data?.connections
                .filter((c) => c.provider === provider)
                .reduce((sum, c) => sum + c.resources.length, 0)
              return (
                <Link
                  key={provider}
                  href={reportingIntegrationPath(provider)}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.06] p-3 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
                >
                  <ReportingIcon integration={provider} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {provider === "ga4"
                        ? "Google Analytics 4"
                        : "Search Console"}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {count === undefined
                        ? t("loading")
                        : t("selectedCount", { count })}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-zinc-400"
                    aria-hidden="true"
                  />
                </Link>
              )
            })}
          </div>
        </SectionCard>
      )}
    </aside>
  )
}

function Settings({
  businessId,
  integration,
}: {
  businessId: string
  integration: ReportingIntegration
}) {
  const t = useTranslations("googleReporting"),
    ti = useTranslations("integrations"),
    locale = useLocale(),
    errorText = useReportingError()
  const { data, error, loading, reload } = useReporting(businessId)
  const { navigate } = useReportingNavigation()
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string>()
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    setNotice(new URLSearchParams(window.location.search).get("google"))
  }, [])
  async function connect() {
    if (integration === "assistants" || connecting) return
    setConnecting(true)
    setConnectError(undefined)
    try {
      const result = await reportingFetch<{ url: string }>(
        `/api/businesses/${businessId}/google-reporting/connect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: integration, locale }),
        },
      )
      window.location.assign(result.url)
    } catch (cause) {
      setConnectError(errorText(cause))
      setConnecting(false)
    }
  }
  const connections =
    data?.connections.filter((c) => c.provider === integration) ?? []
  const selectedCount = connections.reduce(
    (sum, c) => sum + c.resources.length,
    0,
  )
  const needsReconnect = connections.some((c) => c.status === "reconnect")
  const assistants = integration === "assistants"
  return (
    <div className="space-y-6">
      {notice && !assistants && (
        <p
          role="status"
          className={`rounded-xl border p-4 text-sm ${notice === "connected" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300" : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300"}`}
        >
          {notice === "connected" ? t("connectedNotice") : errorText(notice)}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          {loading && !data && (
            <SectionCard>
              <p
                role="status"
                className="flex min-h-24 items-center justify-center gap-2 text-sm text-zinc-500"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("loading")}
              </p>
            </SectionCard>
          )}
          {error && (
            <SectionCard>
              <div
                role="alert"
                className="text-sm text-amber-700 dark:text-amber-300"
              >
                {errorText(error)}
                <Button variant="link" onClick={reload}>
                  {t("retry")}
                </Button>
              </div>
            </SectionCard>
          )}
          {data &&
            (assistants ? (
              <AssistantSettings
                data={data}
                businessId={businessId}
                reload={reload}
              />
            ) : (
              <>
                <SectionCard title={ti("accountSection")}>
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="flex min-w-0 items-start gap-4">
                      <ReportingIcon integration={integration} />
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {connections.length
                            ? t("accountCount", { count: connections.length })
                            : ti("notConnectedYet")}
                        </h2>
                        {connections.length > 0 ? (
                          <>
                            <span
                              className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${needsReconnect ? "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300" : "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"}`}
                            >
                              {needsReconnect
                                ? ti("statusReconnect")
                                : ti("statusConnected")}
                            </span>
                            <p className="mt-3 text-xs text-zinc-500">
                              {t("selectedCount", { count: selectedCount })}
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            {t("emptyConnection")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        navigate(() => {
                          void connect()
                        })
                      }
                      disabled={!data.enabled || connecting}
                      aria-busy={connecting}
                      className="min-w-48"
                    >
                      {connecting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                      {t(connections.length ? "addAccount" : "connectAccount")}
                    </Button>
                  </div>
                  {!data.enabled && (
                    <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                      {t("notConfigured")}
                    </p>
                  )}
                  {connectError && (
                    <p
                      role="alert"
                      className="mt-4 text-sm text-red-600 dark:text-red-400"
                    >
                      {connectError}
                    </p>
                  )}
                </SectionCard>
                {connections.map((connection) => (
                  <ConnectionEditor
                    key={`${connection.id}:${connection.updatedAt}`}
                    businessId={businessId}
                    connection={connection}
                    reload={reload}
                    connect={() =>
                      navigate(() => {
                        void connect()
                      })
                    }
                  />
                ))}
              </>
            ))}
        </div>
        <SetupGuide integration={integration} data={data} />
      </div>
    </div>
  )
}

function ReportingDetail({
  integration,
}: {
  integration: ReportingIntegration
}) {
  const { businessId } = useBusinessAccess()
  const t = useTranslations("googleReporting")
  const td = useTranslations("dashboard")
  const router = useRouter()
  const { navigate } = useReportingNavigation()
  const title =
    integration === "ga4"
      ? "Google Analytics 4"
      : integration === "search_console"
        ? "Google Search Console"
        : t("assistantName")
  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={title}
          onNavigate={(href) => navigate(() => router.push(href))}
          description={t(
            integration === "ga4"
              ? "gaTagline"
              : integration === "search_console"
                ? "searchTagline"
                : "assistantsTagline",
          )}
          breadcrumbs={[
            { label: td("businessPage"), href: "/admin/profile" },
            { label: t("integrations"), href: "/admin/integrations" },
            { label: title },
          ]}
        />
        <Settings
          key={`${businessId}:${integration}`}
          businessId={businessId}
          integration={integration}
        />
      </ContentWrapper>
    </div>
  )
}

export default function ReportingSettings({
  integration,
}: {
  integration: ReportingIntegration
}) {
  return (
    <ReportingNavigationProvider>
      <ReportingDetail integration={integration} />
    </ReportingNavigationProvider>
  )
}

/** Preserve bookmarked URLs from the original combined integration page. */
export function LegacyReportingRedirect() {
  const router = useRouter()
  const t = useTranslations("googleReporting")
  useEffect(() => {
    const integration =
      window.location.hash === "#assistants" ? "assistants" : "ga4"
    router.replace(
      `${reportingIntegrationPath(integration)}${window.location.search}`,
    )
  }, [router])
  return (
    <ContentWrapper>
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-zinc-500"
      >
        <Loader2 className="size-4 animate-spin" />
        {t("loading")}
      </p>
    </ContentWrapper>
  )
}
