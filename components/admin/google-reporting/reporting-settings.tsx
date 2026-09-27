"use client"
import { useEffect, useState } from "react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import {
  Bot,
  ChartNoAxesColumnIncreasing,
  Copy,
  Loader2,
  Plus,
  Search,
} from "lucide-react"
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
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-all font-medium">{connection.email}</h3>
          <p className="mt-1 text-xs text-zinc-400">
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
        <div role="alert" className="mt-3 text-sm text-amber-300">
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
          className="mt-4 flex items-center gap-2 text-sm text-zinc-400"
        >
          <Loader2 className="size-4 animate-spin" />
          {t("loadingProperties")}
        </p>
      )}
      {resources && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <fieldset disabled={busy} className="mt-4">
            <legend className="mb-2 text-sm font-medium">
              {t("chooseProperties")}
            </legend>
            {options.length === 0 ? (
              <p className="text-sm text-zinc-400">{t("noProperties")}</p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {options.map((r) => (
                  <label
                    key={r.externalId}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      name="properties"
                      value={r.externalId}
                      className="mt-1 size-4 shrink-0 accent-emerald-500"
                      checked={selected.includes(r.externalId)}
                      onChange={(event) =>
                        setSelected((values) =>
                          event.target.checked
                            ? [...values, r.externalId]
                            : values.filter((v) => v !== r.externalId),
                        )
                      }
                    />
                    <span className="min-w-0 text-sm">
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
              className="mt-4"
              type="submit"
              disabled={busy || selected.length > 100}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t("saveSelection")}
            </Button>
            <p className="mt-2 text-xs text-zinc-500">{t("selectionHelp")}</p>
          </fieldset>
        </form>
      )}
    </div>
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
  useEffect(() => {
    if (window.location.hash === "#assistants")
      document
        .getElementById("assistants")
        ?.scrollIntoView({ behavior: "instant", block: "start" })
  }, [])
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
    try {
      await reportingFetch(
        `/api/businesses/${businessId}/google-reporting/grants/${id}`,
        { method: "DELETE" },
      )
      toast.success(t("revoked"))
      reload()
    } catch (cause) {
      toast.error(errorText(cause))
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
    <section id="assistants" className="scroll-mt-6 space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Bot className="size-5 text-emerald-400" />
          {t("assistantsTitle")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          {t("assistantDescription")}
        </p>
      </div>
      <SectionCard>
        <p className="mb-4 text-sm text-zinc-400">{t("steps")}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {commands.map((command) => (
            <div
              key={command.name}
              className="min-w-0 rounded-xl border border-white/10 p-4"
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
              <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs leading-6 text-zinc-300">
                <code>{command.value}</code>
              </pre>
              <p className="mt-3 text-sm text-zinc-400">{command.help}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-zinc-400">{t("samplePrompt")}</p>
      </SectionCard>
      <SectionCard>
        <h3 className="font-medium">{t("authorizedAssistants")}</h3>
        {data.grants.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">{t("noAssistants")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/10">
            {data.grants.map((grant) => (
              <li
                key={grant.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{grant.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">
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
    </section>
  )
}
function Settings({ businessId }: { businessId: string }) {
  const t = useTranslations("googleReporting"),
    locale = useLocale(),
    errorText = useReportingError()
  const { data, error, loading, reload } = useReporting(businessId)
  const [connecting, setConnecting] = useState<string>()
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    setNotice(new URLSearchParams(window.location.search).get("google"))
  }, [])
  async function connect(provider: "ga4" | "search_console") {
    setConnecting(provider)
    try {
      const result = await reportingFetch<{ url: string }>(
        `/api/businesses/${businessId}/google-reporting/connect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, locale }),
        },
      )
      window.location.assign(result.url)
    } catch (cause) {
      toast.error(errorText(cause))
      setConnecting(undefined)
    }
  }
  return (
    <div className="space-y-8">
      {notice && (
        <p
          role="status"
          className={`rounded-xl border p-4 text-sm ${notice === "connected" ? "border-emerald-500/20 text-emerald-300" : "border-amber-500/20 text-amber-300"}`}
        >
          {notice === "connected" ? t("connectedNotice") : errorText(notice)}
        </p>
      )}
      {loading && !data && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-zinc-400"
        >
          <Loader2 className="size-4 animate-spin" />
          {t("loading")}
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/20 p-4 text-sm text-amber-300"
        >
          {errorText(error)}
          <Button variant="link" onClick={reload}>
            {t("retry")}
          </Button>
        </div>
      )}
      {data && (
        <>
          {!data.enabled && (
            <p className="rounded-xl border border-amber-500/20 p-4 text-sm text-amber-300">
              {t("notConfigured")}
            </p>
          )}
          {(["ga4", "search_console"] as const).map((provider) => {
            const connections = data.connections.filter(
                (c) => c.provider === provider,
              ),
              Icon = provider === "ga4" ? ChartNoAxesColumnIncreasing : Search
            return (
              <section key={provider} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`size-7 ${provider === "ga4" ? "text-amber-400" : "text-sky-400"}`}
                    />
                    <h2 className="text-xl font-semibold">
                      {provider === "ga4"
                        ? "Google Analytics 4"
                        : "Google Search Console"}
                    </h2>
                  </div>
                  <Button
                    onClick={() => connect(provider)}
                    disabled={!data.enabled || !!connecting}
                  >
                    {connecting === provider ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {t("connectAccount")}
                  </Button>
                </div>
                <p className="text-sm text-zinc-400">
                  {t(provider === "ga4" ? "gaTagline" : "searchTagline")}
                </p>
                {connections.length === 0 ? (
                  <div className="glass-card rounded-2xl p-6 text-sm text-zinc-400">
                    {t("emptyConnection")}
                  </div>
                ) : (
                  connections.map((connection) => (
                    <ConnectionEditor
                      key={`${connection.id}:${connection.updatedAt}`}
                      businessId={businessId}
                      connection={connection}
                      reload={reload}
                      connect={() => connect(provider)}
                    />
                  ))
                )}
              </section>
            )
          })}
          <AssistantSettings
            data={data}
            businessId={businessId}
            reload={reload}
          />
        </>
      )}
    </div>
  )
}
export default function ReportingSettings() {
  const { businessId } = useBusinessAccess(),
    t = useTranslations("googleReporting")
  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={t("title")}
          description={t("description")}
          breadcrumbs={[
            { label: t("integrations"), href: "/admin/integrations" },
            { label: t("title") },
          ]}
        />
        <Settings key={businessId} businessId={businessId} />
      </ContentWrapper>
    </div>
  )
}
