"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Save,
  Unplug,
} from "lucide-react"
import { ContentWrapper, PageHeader, SectionCard } from "@/components/admin"
import { BrandLogo } from "@/components/admin/brand-logo"
import { useBusinessAccess } from "@/components/admin/business-context"
import {
  IntegrationNavigationProvider,
  useIntegrationNavigation,
} from "@/components/admin/integrations/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { useRouter, Link } from "@/i18n/routing"
import {
  githubSettingsSchema,
  type PublicGitHubConnection,
} from "@/lib/github/contracts"
import {
  supportRequest,
  supportErrorCode,
} from "@/components/admin/support/request"
import { RepositoryPicker } from "@/components/admin/github/repository-picker"

type Settings = {
  repository: string
  paths: string
  notes: string
  workflow: string
}
const empty: Settings = {
  repository: "",
  paths: "README.md",
  notes: "",
  workflow: "",
}
function settingsFor(connection: PublicGitHubConnection | null): Settings {
  return connection
    ? {
        repository: connection.repository,
        paths: connection.contextPaths.join("\n"),
        notes: connection.projectNotes,
        workflow: connection.codexWorkflow ?? "",
      }
    : empty
}

function GitHubSettings() {
  const t = useTranslations("githubIntegration")
  const ti = useTranslations("integrations")
  const locale = useLocale()
  const router = useRouter()
  const { businessId, readOnly } = useBusinessAccess()
  const { navigate, setDirty } = useIntegrationNavigation()
  const [connection, setConnection] = useState<PublicGitHubConnection | null>(
    null,
  )
  const [settings, setSettings] = useState<Settings>(empty)
  const [saved, setSaved] = useState<Settings>(empty)
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [appEnabled, setAppEnabled] = useState(false)
  const [installUrl, setInstallUrl] = useState<string | null>(null)
  const [authorizedLogin, setAuthorizedLogin] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [selection, setSelection] = useState<{
    installationId: string
    repositoryId: string
  } | null>(null)
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
  const dirty =
    !!token || !!selection || JSON.stringify(settings) !== JSON.stringify(saved)
  useEffect(() => {
    setDirty("github", dirty)
    return () => setDirty("github", false)
  }, [dirty, setDirty])

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        const data = await supportRequest<{
          enabled: boolean
          appEnabled: boolean
          installUrl: string | null
          authorization: { login: string } | null
          connection: PublicGitHubConnection | null
        }>(endpoint, { signal })
        if (signal?.aborted) return
        setConnection(data.connection)
        setEnabled(data.enabled)
        setManualOpen(data.connection?.authType === "token" || !data.appEnabled)
        setAppEnabled(data.appEnabled)
        setInstallUrl(data.installUrl)
        setAuthorizedLogin(data.authorization?.login ?? null)
        setSelection(null)
        setAutoContext(false)
        setSettings(settingsFor(data.connection))
        setSaved(settingsFor(data.connection))
        if (initialOutcome.current && initialOutcome.current !== "authorized")
          setError(initialOutcome.current)
        initialOutcome.current = null
      } catch (failure) {
        if (!signal?.aborted) setError(supportErrorCode(failure))
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [endpoint],
  )
  useEffect(() => {
    if (!outcomeCaptured.current) {
      outcomeCaptured.current = true
      const current = new URL(window.location.href)
      initialOutcome.current = current.searchParams.get("github")
      if (initialOutcome.current) {
        current.searchParams.delete("github")
        window.history.replaceState(window.history.state, "", current)
      }
    }
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const input = {
    repository: settings.repository,
    contextPaths: settings.paths
      .split("\n")
      .map((path) => path.trim())
      .filter(Boolean),
    projectNotes: settings.notes,
    codexWorkflow: settings.workflow.trim() || null,
    ...(token ? { token } : {}),
    ...(selection ? { appSelection: selection, autoContext } : {}),
  }
  const valid =
    githubSettingsSchema.safeParse(input).success &&
    (!!connection || !!token || !!selection)
  const update = (field: keyof Settings, value: string) => {
    if (field === "paths") setAutoContext(false)
    setSettings((current) => ({ ...current, [field]: value }))
  }
  const manual =
    !selection &&
    (connection?.authType === "token" ||
      (!connection && (manualOpen || !appEnabled)))
  async function connectGitHub() {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      const data = await supportRequest<{ url: string }>(
        `/api/businesses/${businessId}/github/connect`,
        { method: "POST", body: JSON.stringify({ locale }) },
      )
      setDirty("github", false)
      window.location.assign(data.url)
    } catch (failure) {
      setError(supportErrorCode(failure))
      busyRef.current = false
      setBusy(false)
    }
  }
  async function save() {
    setValidation(true)
    if (!valid) {
      requestAnimationFrame(() => {
        const field = formRef.current?.querySelector<HTMLElement>(
          "[aria-invalid=true]",
        )
        for (
          let parent = field?.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          if (parent instanceof HTMLDetailsElement) parent.open = true
        }
        field?.focus()
      })
      return
    }
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      const data = await supportRequest<{ connection: PublicGitHubConnection }>(
        endpoint,
        { method: "POST", body: JSON.stringify(input) },
      )
      setConnection(data.connection)
      setSettings(settingsFor(data.connection))
      setSaved(settingsFor(data.connection))
      setToken("")
      setValidation(false)
      setShowToken(false)
      setDirty("github", false)
      toast.success(t("saved"))
      if (selection) {
        setSelection(null)
        setAutoContext(false)
        setAuthorizedLogin(null)
        setManualOpen(false)
      }
    } catch (failure) {
      setError(supportErrorCode(failure))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  async function disconnect() {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      await supportRequest(endpoint, { method: "DELETE" })
      setConnection(null)
      setSettings(empty)
      setSaved(empty)
      setToken("")
      setDirty("github", false)
      setShowToken(false)
      setSelection(null)
      setAuthorizedLogin(null)
      setManualOpen(false)
      setDisconnectOpen(false)
      toast.success(t("disconnected"))
    } catch (failure) {
      setError(supportErrorCode(failure))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  const errorText = error
    ? t.has(`errors.${error}`)
      ? t(`errors.${error}`)
      : t("loadError")
    : null
  return (
    <div className="flex-1 overflow-y-auto">
      <ContentWrapper>
        <PageHeader
          title={t("title")}
          description={t("description")}
          breadcrumbs={[
            { label: ti("title"), href: "/admin/integrations" },
            { label: "GitHub" },
          ]}
          onNavigate={(href) => navigate(() => router.push(href))}
        />
        {loading ? (
          <div
            role="status"
            className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-500"
          >
            <Loader2 className="size-4 animate-spin" />
            {t("loading")}
          </div>
        ) : (
          <form
            ref={formRef}
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
            aria-busy={busy}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
          >
            <SectionCard title={t("repositorySection")}>
              <div className="mb-6 flex items-start gap-4">
                <BrandLogo platform="github" className="size-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {connection?.repository ?? t("notConnected")}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                    {connection && (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {connection ? t("connected") : t("connectHelp")}
                  </p>
                  {connection && (
                    <a
                      href={connection.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:underline dark:text-emerald-300"
                    >
                      {t("openRepository")}
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
              {errorText && (
                <div
                  role="alert"
                  id="github-error"
                  className="mb-4 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
                >
                  {errorText}
                  <Button
                    type="button"
                    variant="ghost"
                    className="ml-2 cursor-pointer"
                    disabled={busy}
                    onClick={() => navigate(() => void load())}
                  >
                    {t("retry")}
                  </Button>
                </div>
              )}
              {!enabled && (
                <p
                  role="status"
                  className="mb-5 text-sm text-amber-700 dark:text-amber-300"
                >
                  {t("notConfigured")}
                </p>
              )}
              <div className="mb-6 space-y-3">
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {authorizedLogin
                    ? t("authorizedAs", { login: authorizedLogin })
                    : connection?.authType === "github_app"
                      ? t("connectedWithApp", {
                          login: connection.githubLogin ?? "GitHub",
                        })
                      : t("loginHelp")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={connection ? "outline" : "default"}
                    className="cursor-pointer"
                    disabled={busy || readOnly || !appEnabled}
                    onClick={() => navigate(() => void connectGitHub())}
                  >
                    {authorizedLogin || connection?.authType === "github_app"
                      ? t("changeGitHubAccount")
                      : t("loginGitHub")}
                  </Button>
                  {connection && (
                    <Button
                      className="cursor-pointer"
                      type="button"
                      variant="ghost"
                      disabled={busy || readOnly}
                      onClick={() => setDisconnectOpen(true)}
                    >
                      <Unplug className="size-4" />
                      {t("disconnect")}
                    </Button>
                  )}
                </div>
                {!appEnabled && (
                  <p className="text-xs leading-5 text-zinc-500">
                    {t("appSetupPending")}
                  </p>
                )}
              </div>
              {authorizedLogin && (
                <RepositoryPicker
                  businessId={businessId}
                  installUrl={installUrl}
                  disabled={readOnly || busy}
                  selectedId={selection?.repositoryId ?? null}
                  onSelect={(repository, installationId) => {
                    setSelection({
                      installationId,
                      repositoryId: repository.id,
                    })
                    setAutoContext(true)
                    setToken("")
                    setShowToken(false)
                    setManualOpen(false)
                    setSettings((current) => ({
                      ...current,
                      repository: repository.fullName,
                      paths: "",
                      workflow: "",
                    }))
                  }}
                />
              )}
              <div className="border-t border-black/5 py-5 dark:border-white/10">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t("automaticContextTitle")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {t("automaticContextHelp")}
                </p>
                {connection && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {t("defaultBranch", { branch: connection.defaultBranch })}
                  </p>
                )}
              </div>
              {(connection || selection || manual) && (
                <details className="group/notes border-t border-black/5 py-5 dark:border-white/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-sm font-medium text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
                    {t("notesTitle")}
                    <ChevronDown className="size-4 shrink-0 text-zinc-500 group-open/notes:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="github-notes">{t("notesLabel")}</Label>
                    <Textarea
                      id="github-notes"
                      name="projectNotes"
                      value={settings.notes}
                      onChange={(event) => update("notes", event.target.value)}
                      rows={5}
                      className="resize-none"
                      maxLength={12000}
                      disabled={readOnly || busy || !enabled}
                      aria-describedby="github-notes-help"
                    />
                    <p
                      id="github-notes-help"
                      className="text-xs leading-5 text-zinc-500"
                    >
                      {t("notesHelp")}
                    </p>
                  </div>
                </details>
              )}
              <details
                className="group/advanced border-t border-black/5 py-5 dark:border-white/10"
                open={manualOpen}
                onToggle={(event) => setManualOpen(event.currentTarget.open)}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-sm font-medium text-zinc-600 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-400 [&::-webkit-details-marker]:hidden">
                  {t("advancedTitle")}
                  <ChevronDown className="size-4 shrink-0 text-zinc-500 group-open/advanced:rotate-180" />
                </summary>
                <div className="mt-4 space-y-5">
                  {manual && (
                    <fieldset className="space-y-4">
                      <legend className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {t("manualConnection")}
                      </legend>
                      <p className="text-xs leading-5 text-zinc-500">
                        {t("manualHelp")}
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="github-repository">
                          {t("repositoryLabel")}
                        </Label>
                        <Input
                          id="github-repository"
                          name="repository"
                          value={settings.repository}
                          onChange={(event) =>
                            update("repository", event.target.value)
                          }
                          placeholder="organization/project"
                          disabled={readOnly || busy || !enabled}
                          aria-invalid={
                            validation &&
                            !githubSettingsSchema.shape.repository.safeParse(
                              settings.repository,
                            ).success
                          }
                          aria-describedby="github-repository-help"
                        />
                        <p
                          id="github-repository-help"
                          className="text-xs text-zinc-500"
                        >
                          {t("repositoryHelp")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github-token">
                          {connection ? t("replaceToken") : t("tokenLabel")}
                        </Label>
                        <div className="relative">
                          <Input
                            id="github-token"
                            name="token"
                            type={showToken ? "text" : "password"}
                            autoComplete="off"
                            value={token}
                            onChange={(event) => setToken(event.target.value)}
                            className="pr-11"
                            disabled={readOnly || busy || !enabled}
                            aria-invalid={validation && !connection && !token}
                            aria-describedby="github-token-help"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 size-8 -translate-y-1/2 cursor-pointer"
                            aria-label={
                              showToken ? t("hideToken") : t("showToken")
                            }
                            aria-pressed={showToken}
                            disabled={readOnly || busy || !enabled}
                            onClick={() => setShowToken((current) => !current)}
                          >
                            {showToken ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                        <p
                          id="github-token-help"
                          className="text-xs leading-5 text-zinc-500"
                        >
                          {connection ? t("tokenKeep") : t("tokenHelp")}
                        </p>
                      </div>
                    </fieldset>
                  )}
                  {(connection || selection || manual) && (
                    <div className="space-y-2">
                      <Label htmlFor="github-paths">{t("pathsLabel")}</Label>
                      <Textarea
                        id="github-paths"
                        name="contextPaths"
                        value={settings.paths}
                        onChange={(event) =>
                          update("paths", event.target.value)
                        }
                        rows={3}
                        className="resize-none"
                        disabled={readOnly || busy || !enabled}
                        aria-invalid={
                          validation &&
                          !githubSettingsSchema.shape.contextPaths.safeParse(
                            input.contextPaths,
                          ).success
                        }
                        aria-describedby="github-paths-help"
                      />
                      <p
                        id="github-paths-help"
                        className="text-xs leading-5 text-zinc-500"
                      >
                        {autoContext ? t("autoContextHelp") : t("pathsHelp")}
                      </p>
                    </div>
                  )}
                  {connection && connection.contextFiles.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500">
                        {t("syncedAt", {
                          date: new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(connection.contextSyncedAt)),
                        })}
                      </p>
                      <ul className="mt-3 space-y-2">
                        {connection.contextFiles.map((file) => (
                          <li
                            key={file.path}
                            className="flex min-w-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                          >
                            <FileText className="size-4 shrink-0" />
                            <span className="break-all">{file.path}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
              {(connection || selection || manual) && (
                <div className="border-t border-black/5 pt-5 dark:border-white/10">
                  {validation && !valid && (
                    <p
                      role="alert"
                      className="mb-3 text-sm text-amber-700 dark:text-amber-300"
                    >
                      {t("invalidForm")}
                    </p>
                  )}
                  <Button
                    className="min-w-40 cursor-pointer"
                    type="submit"
                    disabled={
                      busy || readOnly || !enabled || (!!connection && !dirty)
                    }
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {selection
                      ? t("connectRepository")
                      : connection
                        ? t("saveChanges")
                        : t("connect")}
                  </Button>
                </div>
              )}
            </SectionCard>
            <aside className="space-y-5">
              <SectionCard title={t("setupTitle")}>
                <ol className="list-decimal space-y-3 pl-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  <li>
                    {appEnabled ? t("appStep1") : t("step1")}
                    {!appEnabled && (
                      <>
                        {" "}
                        <a
                          href="https://github.com/settings/personal-access-tokens/new"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline dark:text-emerald-300"
                        >
                          {t("createToken")}
                        </a>
                      </>
                    )}
                  </li>
                  <li>{appEnabled ? t("appStep2") : t("step2")}</li>
                  <li>{appEnabled ? t("appStep3") : t("step3")}</li>
                </ol>
                <p className="mt-4 text-xs leading-5 text-zinc-500">
                  {t("privacy")}
                </p>
              </SectionCard>
              {(connection || selection || manual) && (
                <SectionCard title={t("codexTitle")}>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {t("codexHelp")}
                  </p>
                  <details className="group/codex mt-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-sm text-sm font-medium text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
                      {t("codexSetup")}
                      <ChevronDown className="size-4 shrink-0 text-zinc-500 group-open/codex:rotate-180" />
                    </summary>
                    <div className="mt-4 space-y-4">
                      <p className="text-xs leading-5 text-zinc-500">
                        {t("codexInstall")}
                      </p>
                      <a
                        href="/integrations/scorelead-codex.yml"
                        download
                        className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        {t("downloadWorkflow")}
                        <ExternalLink className="size-3.5" />
                      </a>
                      <p className="text-xs leading-5 text-zinc-500">
                        {t("codexSecret")}
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="github-workflow">
                          {t("workflowLabel")}
                        </Label>
                        <Input
                          id="github-workflow"
                          name="codexWorkflow"
                          value={settings.workflow}
                          onChange={(event) =>
                            update("workflow", event.target.value)
                          }
                          placeholder="scorelead-codex.yml"
                          disabled={readOnly || busy || !enabled}
                          aria-invalid={
                            validation &&
                            !!settings.workflow &&
                            !githubSettingsSchema.shape.codexWorkflow.safeParse(
                              settings.workflow,
                            ).success
                          }
                          aria-describedby="github-workflow-help"
                        />
                        <p
                          id="github-workflow-help"
                          className="text-xs leading-5 text-zinc-500"
                        >
                          {t("workflowHelp")}
                        </p>
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full cursor-pointer"
                        disabled={
                          busy ||
                          readOnly ||
                          !enabled ||
                          (!!connection && !dirty)
                        }
                      >
                        {busy && <Loader2 className="size-4 animate-spin" />}
                        {selection
                          ? t("connectRepository")
                          : connection
                            ? t("saveChanges")
                            : t("connect")}
                      </Button>
                    </div>
                  </details>
                </SectionCard>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link
                  href="/admin/inbox"
                  onClick={(event) => {
                    event.preventDefault()
                    navigate(() => router.push("/admin/inbox"))
                  }}
                >
                  {t("openInbox")}
                </Link>
              </Button>
            </aside>
          </form>
        )}
        <AlertDialog
          open={disconnectOpen}
          onOpenChange={(open) => {
            if (!busy) setDisconnectOpen(open)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("disconnectTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("disconnectDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {errorText && (
              <p
                role="alert"
                className="text-sm text-amber-700 dark:text-amber-300"
              >
                {errorText}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>
                {t("cancel")}
              </AlertDialogCancel>
              <Button
                className="cursor-pointer"
                variant="destructive"
                disabled={busy}
                onClick={() => void disconnect()}
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                {t("disconnect")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ContentWrapper>
    </div>
  )
}

export default function GitHubIntegrationPage() {
  return (
    <IntegrationNavigationProvider>
      <GitHubSettings />
    </IntegrationNavigationProvider>
  )
}
