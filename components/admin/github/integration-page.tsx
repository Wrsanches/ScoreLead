"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { ExternalLink, FileText, Loader2, RefreshCw, Unplug } from "lucide-react"
import { ContentWrapper, PageHeader, SectionCard } from "@/components/admin"
import { BrandLogo } from "@/components/admin/brand-logo"
import { useBusinessAccess } from "@/components/admin/business-context"
import { IntegrationNavigationProvider, useIntegrationNavigation } from "@/components/admin/integrations/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { useRouter, Link } from "@/i18n/routing"
import { githubSettingsSchema, type PublicGitHubConnection } from "@/lib/github/contracts"
import { supportRequest, supportErrorCode } from "@/components/admin/support/request"
import { RepositoryPicker } from "@/components/admin/github/repository-picker"

type Settings = { repository: string; paths: string; notes: string; workflow: string }
const empty: Settings = { repository: "", paths: "README.md", notes: "", workflow: "" }
function settingsFor(connection: PublicGitHubConnection | null): Settings {
  return connection ? { repository: connection.repository, paths: connection.contextPaths.join("\n"), notes: connection.projectNotes, workflow: connection.codexWorkflow ?? "" } : empty
}

function GitHubSettings() {
  const t = useTranslations("githubIntegration")
  const ti = useTranslations("integrations")
  const locale = useLocale()
  const router = useRouter()
  const { businessId, readOnly } = useBusinessAccess()
  const { navigate, setDirty } = useIntegrationNavigation()
  const [connection, setConnection] = useState<PublicGitHubConnection | null>(null)
  const [settings, setSettings] = useState<Settings>(empty)
  const [saved, setSaved] = useState<Settings>(empty)
  const [token, setToken] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [appEnabled, setAppEnabled] = useState(false)
  const [installUrl, setInstallUrl] = useState<string | null>(null)
  const [authorizedLogin, setAuthorizedLogin] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [selection, setSelection] = useState<{ installationId: string; repositoryId: string } | null>(null)
  const [autoContext, setAutoContext] = useState(false)
  const initialOutcome = useRef<string | null>(null)
  const outcomeCaptured = useRef(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [validation, setValidation] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const endpoint = `/api/businesses/${businessId}/github/connection`
  const dirty = !!token || !!selection || JSON.stringify(settings) !== JSON.stringify(saved)
  useEffect(() => { setDirty("github", dirty); return () => setDirty("github", false) }, [dirty, setDirty])

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const data = await supportRequest<{ enabled: boolean; appEnabled: boolean; installUrl: string | null; authorization: { login: string } | null; connection: PublicGitHubConnection | null }>(endpoint, { signal })
      if (signal?.aborted) return
      setConnection(data.connection); setEnabled(data.enabled)
      setAppEnabled(data.appEnabled); setInstallUrl(data.installUrl); setAuthorizedLogin(data.authorization?.login ?? null); setSelection(null); setAutoContext(false)
      setSettings(settingsFor(data.connection)); setSaved(settingsFor(data.connection))
      if (initialOutcome.current && initialOutcome.current !== "authorized") setError(initialOutcome.current)
      initialOutcome.current = null
    } catch (failure) { if (!signal?.aborted) setError(supportErrorCode(failure)) }
    finally { if (!signal?.aborted) setLoading(false) }
  }, [endpoint])
  useEffect(() => {
    if (!outcomeCaptured.current) {
      outcomeCaptured.current = true
      const current = new URL(window.location.href)
      initialOutcome.current = current.searchParams.get("github")
      if (initialOutcome.current) { current.searchParams.delete("github"); window.history.replaceState(window.history.state, "", current) }
    }
    const controller = new AbortController(); void load(controller.signal); return () => controller.abort()
  }, [load])

  const input = { repository: settings.repository, contextPaths: settings.paths.split("\n").map((path) => path.trim()).filter(Boolean), projectNotes: settings.notes, codexWorkflow: settings.workflow.trim() || null, ...(token ? { token } : {}), ...(selection ? { appSelection: selection, autoContext } : {}) }
  const valid = githubSettingsSchema.safeParse(input).success && (!!connection || !!token || !!selection)
  const update = (field: keyof Settings, value: string) => { if (field === "paths") setAutoContext(false); setSettings((current) => ({ ...current, [field]: value })) }
  const manual = !selection && (manualOpen || connection?.authType === "token" || !appEnabled)
  async function connectGitHub() {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(null)
    try {
      const data = await supportRequest<{ url: string }>(`/api/businesses/${businessId}/github/connect`, { method: "POST", body: JSON.stringify({ locale }) })
      setDirty("github", false); window.location.assign(data.url)
    } catch (failure) { setError(supportErrorCode(failure)); busyRef.current = false; setBusy(false) }
  }
  async function save() {
    setValidation(true)
    if (!valid) { requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()); return }
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(null)
    try {
      const data = await supportRequest<{ connection: PublicGitHubConnection }>(endpoint, { method: "POST", body: JSON.stringify(input) })
      setConnection(data.connection); setSettings(settingsFor(data.connection)); setSaved(settingsFor(data.connection)); setToken(""); setValidation(false)
      setDirty("github", false); toast.success(t("saved"))
      if (selection) { setSelection(null); setAutoContext(false); setAuthorizedLogin(null); setManualOpen(false) }
    } catch (failure) { setError(supportErrorCode(failure)) }
    finally { busyRef.current = false; setBusy(false) }
  }
  async function disconnect() {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(null)
    try {
      await supportRequest(endpoint, { method: "DELETE" })
      setConnection(null); setSettings(empty); setSaved(empty); setToken(""); setDirty("github", false)
      setSelection(null); setAuthorizedLogin(null); setManualOpen(false)
      setDisconnectOpen(false); toast.success(t("disconnected"))
    } catch (failure) { setError(supportErrorCode(failure)) }
    finally { busyRef.current = false; setBusy(false) }
  }
  const errorText = error ? (t.has(`errors.${error}`) ? t(`errors.${error}`) : t("loadError")) : null
  return <div className="flex-1 overflow-y-auto"><ContentWrapper>
    <PageHeader title={t("title")} description={t("description")} breadcrumbs={[{ label: ti("title"), href: "/admin/integrations" }, { label: "GitHub" }]}
      onNavigate={(href) => navigate(() => router.push(href))} />
    {loading ? <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-500"><Loader2 className="size-4 animate-spin" />{t("loading")}</div> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <SectionCard title={t("repositorySection")}>
        <div className="mb-6 flex items-center gap-4"><BrandLogo platform="github" className="size-12" /><div className="min-w-0">
          <h2 className="break-words text-base font-semibold text-zinc-950 dark:text-zinc-50">{connection?.repository ?? t("notConnected")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{connection ? t("connected") : t("connectHelp")}</p></div></div>
        {errorText && <div role="alert" id="github-error" className="mb-4 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">{errorText}<Button variant="ghost" className="ml-2 cursor-pointer" disabled={busy} onClick={() => navigate(() => void load())}>{t("retry")}</Button></div>}
        {!enabled && <p role="status" className="mb-5 text-sm text-amber-700 dark:text-amber-300">{t("notConfigured")}</p>}
        <div className="mb-6 space-y-3"><p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{authorizedLogin ? t("authorizedAs", { login: authorizedLogin }) : connection?.authType === "github_app" ? t("connectedWithApp", { login: connection.githubLogin ?? "GitHub" }) : t("loginHelp")}</p><Button type="button" variant={connection ? "outline" : "default"} className="cursor-pointer" disabled={busy || readOnly || !appEnabled} onClick={() => navigate(() => void connectGitHub())}>{busy && <Loader2 className="size-4 animate-spin" />}{authorizedLogin || connection?.authType === "github_app" ? t("changeGitHubAccount") : t("loginGitHub")}</Button>{!appEnabled && <p className="text-xs leading-5 text-zinc-500">{t("appSetupPending")}</p>}</div>
        {authorizedLogin && <RepositoryPicker businessId={businessId} installUrl={installUrl} disabled={readOnly || busy} selectedId={selection?.repositoryId ?? null} onSelect={(repository, installationId) => {
          setSelection({ installationId, repositoryId: repository.id }); setAutoContext(true); setToken(""); setManualOpen(false)
          setSettings((current) => ({ ...current, repository: repository.fullName, paths: "", workflow: "" }))
        }} />}
        {!connection && !selection && appEnabled && <details className="mb-6 text-sm text-zinc-500" open={manualOpen} onToggle={(event) => setManualOpen(event.currentTarget.open)}><summary className="cursor-pointer">{t("manualConnection")}</summary><p className="mt-2 text-xs leading-5">{t("manualHelp")}</p></details>}
        {(connection || selection || manual) && <>
        <form ref={formRef} noValidate onSubmit={(event) => { event.preventDefault(); void save() }} className="space-y-5" aria-busy={busy}>
          <div className="space-y-2"><Label htmlFor="github-repository">{t("repositoryLabel")}</Label><Input id="github-repository" value={settings.repository} onChange={(event) => update("repository", event.target.value)} placeholder="organization/project" disabled={readOnly || busy || !enabled || !manual}
            aria-invalid={validation && !githubSettingsSchema.shape.repository.safeParse(settings.repository).success} aria-describedby="github-repository-help" /><p id="github-repository-help" className="text-xs text-zinc-500">{t("repositoryHelp")}</p></div>
          {manual && <div className="space-y-2"><Label htmlFor="github-token">{connection ? t("replaceToken") : t("tokenLabel")}</Label><Input id="github-token" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} disabled={readOnly || busy || !enabled} aria-invalid={validation && !connection && !token} aria-describedby="github-token-help" /><p id="github-token-help" className="text-xs leading-5 text-zinc-500">{connection ? t("tokenKeep") : t("tokenHelp")}</p></div>}
          <div className="space-y-2"><Label htmlFor="github-paths">{t("pathsLabel")}</Label><Textarea id="github-paths" value={settings.paths} onChange={(event) => update("paths", event.target.value)} rows={3} disabled={readOnly || busy || !enabled}
            aria-invalid={validation && !githubSettingsSchema.shape.contextPaths.safeParse(input.contextPaths).success} aria-describedby="github-paths-help" /><p id="github-paths-help" className="text-xs leading-5 text-zinc-500">{autoContext ? t("autoContextHelp") : t("pathsHelp")}</p></div>
          <div className="space-y-2"><Label htmlFor="github-notes">{t("notesLabel")}</Label><Textarea id="github-notes" value={settings.notes} onChange={(event) => update("notes", event.target.value)} rows={4} maxLength={12000} disabled={readOnly || busy || !enabled} aria-describedby="github-notes-help" /><p id="github-notes-help" className="text-xs leading-5 text-zinc-500">{t("notesHelp")}</p></div>
          <div className="space-y-2"><Label htmlFor="github-workflow">{t("workflowLabel")}</Label><Input id="github-workflow" value={settings.workflow} onChange={(event) => update("workflow", event.target.value)} placeholder="scorelead-codex.yml" disabled={readOnly || busy || !enabled}
            aria-invalid={validation && !!settings.workflow && !githubSettingsSchema.shape.codexWorkflow.safeParse(settings.workflow).success} aria-describedby="github-workflow-help" /><p id="github-workflow-help" className="text-xs leading-5 text-zinc-500">{t("workflowHelp")}</p></div>
          {validation && !valid && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{t("invalidForm")}</p>}
          <div className="flex flex-wrap gap-2"><Button className="min-w-40 cursor-pointer" type="submit" disabled={busy || readOnly || !enabled}>{busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}{selection ? t("connectRepository") : connection ? t("saveSync") : t("connect")}</Button>
            {connection && <Button className="cursor-pointer" type="button" variant="outline" disabled={busy || readOnly} onClick={() => setDisconnectOpen(true)}><Unplug className="size-4" />{t("disconnect")}</Button>}</div>
        </form>
        </>}
        {connection && <div className="mt-6 border-t border-black/5 pt-5 dark:border-white/10"><p className="text-xs text-zinc-500">{t("syncedAt", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(connection.contextSyncedAt)) })}</p><ul className="mt-3 space-y-2">{connection.contextFiles.map((file) => <li key={file.path} className="flex min-w-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"><FileText className="size-4 shrink-0" /><span className="break-all">{file.path}</span></li>)}</ul><a href={connection.repositoryUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:underline dark:text-emerald-300">{t("openRepository")}<ExternalLink className="size-3.5" /></a></div>}
      </SectionCard>
      <aside className="space-y-5"><SectionCard title={t("setupTitle")}><ol className="list-decimal space-y-3 pl-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400"><li>{appEnabled ? t("appStep1") : t("step1")}{!appEnabled && <> <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="text-emerald-700 underline dark:text-emerald-300">{t("createToken")}</a></>}</li><li>{appEnabled ? t("appStep2") : t("step2")}</li><li>{appEnabled ? t("appStep3") : t("step3")}</li></ol><p className="mt-4 text-xs leading-5 text-zinc-500">{t("privacy")}</p></SectionCard>
        <SectionCard title={t("codexTitle")}><p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{t("codexHelp")}</p><a href="/integrations/scorelead-codex.yml" download className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline dark:text-emerald-300">{t("downloadWorkflow")}</a><p className="mt-3 text-xs leading-5 text-zinc-500">{t("codexSecret")}</p></SectionCard>
        <Button asChild variant="outline" className="w-full"><Link href="/admin/inbox">{t("openInbox")}</Link></Button>
      </aside>
    </div>}
    <AlertDialog open={disconnectOpen} onOpenChange={(open) => { if (!busy) setDisconnectOpen(open) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("disconnectTitle")}</AlertDialogTitle><AlertDialogDescription>{t("disconnectDescription")}</AlertDialogDescription></AlertDialogHeader>{errorText && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{errorText}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel><Button className="cursor-pointer" variant="destructive" disabled={busy} onClick={() => void disconnect()}>{busy && <Loader2 className="size-4 animate-spin" />}{t("disconnect")}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </ContentWrapper></div>
}

export default function GitHubIntegrationPage() { return <IntegrationNavigationProvider><GitHubSettings /></IntegrationNavigationProvider> }
