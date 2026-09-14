"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Bot, GitBranch, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

type Settings = {
  enabled: boolean
  version: number
  instructions: string
  handoffMessage: string
  includePaths: string[]
  repository: string | null
  branch: string | null
  status: string
  lastSyncedAt: string | null
  snapshotSha: string | null
  snapshotPaths: string[]
  skippedFiles: number
  errorCode: string | null
  tested: boolean
  authorized: boolean
}
type Data = {
  settings: Settings
  githubConfigured: boolean
  installUrl: string | null
}
type Conversation = {
  id: string
  phone: string
  mode: string
  lastMessageAt: string
}
type Message = {
  id: string
  direction: string
  body: string | null
  status: string
  at: string
}

export function SupportAssistantCard({
  businessId,
  readOnly,
}: {
  businessId: string
  readOnly: boolean
}) {
  const t = useTranslations("supportAssistant"),
    locale = useLocale(),
    base = `/api/businesses/${businessId}/support`
  const [data, setData] = useState<Data | null>(null),
    [draft, setDraft] = useState({
      instructions: "",
      handoffMessage: "",
      paths: "",
    })
  const [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState<string | null>(null)
  const [repository, setRepository] = useState(""),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState<{ reply: string; handoff: boolean } | null>(
      null,
    )
  const [disconnectOpen, setDisconnectOpen] = useState(false),
    [leaveUrl, setLeaveUrl] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [baseline, setBaseline] = useState<Settings | null>(null),
    [conflict, setConflict] = useState(false)
  const [invalid, setInvalid] = useState<string[]>([])
  const leaving = useRef(false)
  const generation = useRef(0),
    requestBusy = useRef(false),
    initialized = useRef(false),
    root = useRef<HTMLElement>(null)
  const dirty =
    !!baseline &&
    (draft.instructions !== baseline.instructions ||
      draft.handoffMessage !== baseline.handoffMessage ||
      draft.paths !== baseline.includePaths.join("\n"))
  const errorText = useCallback(
    (code: string) =>
      t.has(`errors.${code}`)
        ? t(`errors.${code}`)
        : t("errors.request_failed"),
    [t],
  )

  const load = useCallback(
    async (reset = false, signal?: AbortSignal) => {
      const version = ++generation.current
      try {
        const response = await fetch(base, { signal }),
          body = await response.json()
        if (!response.ok) throw new Error(body.code || "request_failed")
        if (version !== generation.current) return
        setData(body)
        if (reset || !initialized.current) {
          setBaseline(body.settings)
          setDraft({
            instructions: body.settings.instructions,
            handoffMessage: body.settings.handoffMessage,
            paths: body.settings.includePaths.join("\n"),
          })
          initialized.current = true
        }
      } catch (error) {
        if (!signal?.aborted)
          setError(
            errorText(
              error instanceof Error ? error.message : "request_failed",
            ),
          )
      }
    },
    [base, errorText],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(false, controller.signal)
    const timer = setInterval(() => {
      if (!document.hidden && !requestBusy.current)
        void load(false, controller.signal)
    }, 10_000)
    return () => {
      controller.abort()
      clearInterval(timer)
      generation.current++
    }
  }, [load])

  useEffect(() => {
    if (!dirty) return
    const unload = (event: BeforeUnloadEvent) => {
      if (!leaving.current) {
        event.preventDefault()
        event.returnValue = ""
      }
    }
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = (event.target as Element).closest("a")
      if (
        !link ||
        link.target === "_blank" ||
        link.href === window.location.href
      )
        return
      event.preventDefault()
      event.stopPropagation()
      setLeaveUrl(link.href)
    }
    window.addEventListener("beforeunload", unload)
    document.addEventListener("click", navigate, true)
    return () => {
      window.removeEventListener("beforeunload", unload)
      document.removeEventListener("click", navigate, true)
    }
  }, [dirty])

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("support") ===
      "github_error"
    )
      setError(errorText("github_unavailable"))
  }, [errorText])

  useEffect(() => {
    if (!error) return
    const ids: Record<string, string> = {
      repository: "support-repository",
      includePaths: "support-paths",
      handoffMessage: "support-handoff",
      instructions: "support-instructions",
    }
    const field = invalid[0] && document.getElementById(ids[invalid[0]])
    if (field) field.focus()
    else
      root.current?.querySelector<HTMLElement>("[data-support-error]")?.focus()
  }, [error, invalid])

  useEffect(() => {
    const controller = new AbortController()
    if (!data) return
    fetch(`${base}/conversations`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return
        const body = await response.json()
        setConversations(body.conversations)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [base, data])

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    fetch(
      `${base}/conversations?conversation=${encodeURIComponent(selected)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("request_failed")
        const body = await response.json()
        setMessages(body.messages)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(errorText("request_failed"))
      })
      .finally(() => {
        if (!controller.signal.aborted) setMessagesLoading(false)
      })
    return () => controller.abort()
  }, [base, selected, data, errorText])

  async function act(
    name: string,
    path: string,
    method: string,
    body?: unknown,
  ) {
    if (requestBusy.current || readOnly) return
    requestBusy.current = true
    setBusy(name)
    setError(null)
    setInvalid([])
    setConflict(false)
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(name === "preview" ? 120_000 : 60_000),
      })
      const result = await response.json()
      if (!response.ok) {
        setConflict(result.code === "settings_changed")
        setInvalid(
          result.fields
            ? Object.keys(result.fields)
            : result.code === "invalid_repository"
              ? ["repository"]
              : [],
        )
        throw new Error(result.code || "request_failed")
      }
      if (result.url) {
        window.location.assign(result.url)
        return
      }
      if (result.answer) setAnswer(result.answer)
      if (name !== "preview") toast.success(t("saved"))
      if (["save", "repository", "disconnect", "sync"].includes(name))
        setAnswer(null)
      await load(name !== "mode" && name !== "preview")
    } catch (error) {
      setError(
        errorText(error instanceof Error ? error.message : "request_failed"),
      )
    } finally {
      setBusy(null)
      requestBusy.current = false
    }
  }

  const settings = data?.settings
  const save = () =>
    baseline &&
    act("save", "", "PATCH", {
      version: baseline.version,
      enabled: false,
      instructions: draft.instructions,
      handoffMessage: draft.handoffMessage,
      includePaths: draft.paths
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    })
  const controlClass = "cursor-pointer disabled:cursor-not-allowed"

  return (
    <section
      ref={root}
      id="support-assistant"
      aria-labelledby="support-title"
      className="space-y-6 border-t border-border py-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Bot className="size-5" aria-hidden="true" />
            <span className="text-sm">{t("label")}</span>
          </div>
          <h2 id="support-title" className="text-xl font-semibold">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        {settings && (
          <span className="rounded-full border border-border px-3 py-1 text-sm">
            {settings.enabled ? t("active") : t("paused")}
          </span>
        )}
      </div>
      <div aria-live="polite" className="min-h-6">
        {error && (
          <p
            id="support-error"
            tabIndex={-1}
            data-support-error
            role="alert"
            className="text-sm text-destructive"
          >
            {error}{" "}
            <Button
              variant="link"
              onClick={() => {
                if (conflict) {
                  setLeaveUrl("reload")
                  return
                }
                setError(null)
                void load()
              }}
            >
              {t("retry")}
            </Button>
          </p>
        )}
      </div>
      {!data ? (
        <div
          role="status"
          className="flex min-h-40 items-center justify-center gap-2 text-muted-foreground"
        >
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          {t("loading")}
        </div>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
            <div className="space-y-5">
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  <GitBranch className="size-4" aria-hidden="true" />
                  {t("repositoryTitle")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("repositoryHelp")}
                </p>
              </div>
              {!data.githubConfigured && (
                <p className="rounded-md border border-border bg-muted p-4 text-sm">
                  {t("notConfigured")}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {data.installUrl && (
                  <a
                    className={buttonVariants({
                      variant: "outline",
                      className: controlClass,
                    })}
                    href={data.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("install")}
                  </a>
                )}
                <Button
                  variant="outline"
                  className={controlClass}
                  disabled={
                    !data.githubConfigured || !!busy || readOnly || dirty
                  }
                  onClick={() =>
                    void act("authorize", "/github", "POST", { locale })
                  }
                >
                  {busy === "authorize" && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {t("authorize")}
                </Button>
              </div>
              {settings!.authorized && (
                <form
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!repository.trim()) {
                      setInvalid(["repository"])
                      setError(errorText("invalid_repository"))
                      document.getElementById("support-repository")?.focus()
                      return
                    }
                    void act("repository", "/github", "PUT", {
                      repository: repository.trim(),
                    })
                  }}
                  className="space-y-2"
                >
                  <Label htmlFor="support-repository">
                    {t("repositoryLabel")}
                  </Label>
                  <Input
                    id="support-repository"
                    placeholder="owner/repository"
                    value={repository}
                    onChange={(event) => setRepository(event.target.value)}
                    aria-invalid={invalid.includes("repository")}
                    aria-describedby={`support-repo-help${invalid.includes("repository") ? " support-error" : ""}`}
                    disabled={!!busy || readOnly}
                  />
                  <p
                    id="support-repo-help"
                    className="text-xs text-muted-foreground"
                  >
                    {t("repositoryExample")}
                  </p>
                  <Button
                    type="submit"
                    disabled={!!busy || readOnly || dirty}
                    className={controlClass}
                  >
                    {t("useRepository")}
                  </Button>
                </form>
              )}
              {settings!.repository && (
                <div className="space-y-3 rounded-md border border-border p-4">
                  <p className="break-all font-mono text-sm">
                    {settings!.repository}{" "}
                    <span className="text-muted-foreground">
                      / {settings!.branch}
                    </span>
                  </p>
                  <p role="status" className="text-sm">
                    {t.has(`statuses.${settings!.status}`)
                      ? t(`statuses.${settings!.status}`)
                      : settings!.status}
                  </p>
                  {settings!.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("synced", {
                        date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(settings!.lastSyncedAt)),
                      })}
                    </p>
                  )}
                  {settings!.errorCode && (
                    <p role="alert" className="text-sm text-destructive">
                      {errorText(settings!.errorCode)}
                    </p>
                  )}
                  {!!settings!.snapshotPaths.length && (
                    <details>
                      <summary className="cursor-pointer text-sm hover:underline focus-visible:outline focus-visible:outline-2">
                        {t("files", { count: settings!.snapshotPaths.length })}
                      </summary>
                      <ul className="mt-2 max-h-48 overflow-auto text-xs">
                        {settings!.snapshotPaths.map((path) => (
                          <li className="break-all py-1 font-mono" key={path}>
                            {path}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {settings!.skippedFiles > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t("skippedFiles", { count: settings!.skippedFiles })}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={controlClass}
                      disabled={
                        !!busy ||
                        dirty ||
                        readOnly ||
                        !["ready", "error"].includes(settings!.status)
                      }
                      onClick={() => void act("sync", "/sync", "POST")}
                    >
                      <RefreshCw className="size-4" aria-hidden="true" />
                      {t("sync")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={controlClass}
                      disabled={!!busy || readOnly}
                      onClick={() => setDisconnectOpen(true)}
                    >
                      {t("disconnect")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <aside className="space-y-3 border-t border-border pt-5 text-sm leading-6 text-muted-foreground lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <p>{t("scopeHelp")}</p>
              <p>{t("privacyHelp")}</p>
              <p>{t("updatesHelp")}</p>
            </aside>
          </div>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              if (!draft.handoffMessage.trim() || !draft.paths.trim()) {
                setInvalid([
                  !draft.paths.trim() ? "includePaths" : "handoffMessage",
                ])
                setError(errorText("invalid_settings"))
                document
                  .getElementById(
                    !draft.paths.trim() ? "support-paths" : "support-handoff",
                  )
                  ?.focus()
                return
              }
              void save()
            }}
            className="grid gap-5 border-t border-border pt-6 lg:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="support-paths">{t("paths")}</Label>
              <Textarea
                id="support-paths"
                className="min-h-32 resize-none font-mono"
                value={draft.paths}
                disabled={!!busy || readOnly}
                onChange={(event) =>
                  setDraft({ ...draft, paths: event.target.value })
                }
                aria-invalid={invalid.includes("includePaths")}
                aria-describedby={`support-paths-help${invalid.includes("includePaths") ? " support-error" : ""}`}
              />
              <p
                id="support-paths-help"
                className="text-xs leading-5 text-muted-foreground"
              >
                {t("pathsHelp")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-instructions">{t("instructions")}</Label>
              <Textarea
                id="support-instructions"
                aria-invalid={invalid.includes("instructions")}
                aria-describedby={
                  invalid.includes("instructions") ? "support-error" : undefined
                }
                className="min-h-32 resize-none"
                maxLength={6000}
                value={draft.instructions}
                disabled={!!busy || readOnly}
                onChange={(event) =>
                  setDraft({ ...draft, instructions: event.target.value })
                }
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="support-handoff">{t("handoff")}</Label>
              <Textarea
                id="support-handoff"
                className="min-h-20 resize-none"
                maxLength={1000}
                value={draft.handoffMessage}
                disabled={!!busy || readOnly}
                onChange={(event) =>
                  setDraft({ ...draft, handoffMessage: event.target.value })
                }
                aria-invalid={invalid.includes("handoffMessage")}
                aria-describedby={`support-handoff-help${invalid.includes("handoffMessage") ? " support-error" : ""}`}
              />
              <p
                id="support-handoff-help"
                className="text-xs text-muted-foreground"
              >
                {t("handoffHelp")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
              <Button
                type="submit"
                className={controlClass}
                disabled={!dirty || !!busy || readOnly}
              >
                {busy === "save" && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {t("save")}
              </Button>
              {dirty && (
                <p className="text-sm text-muted-foreground">{t("unsaved")}</p>
              )}
            </div>
          </form>
          <div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                if (question.trim())
                  void act("preview", "/preview", "POST", { question })
              }}
              className="space-y-3"
            >
              <Label htmlFor="support-question">{t("testTitle")}</Label>
              <Textarea
                id="support-question"
                className="min-h-28 resize-none"
                maxLength={4000}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={!!busy || readOnly}
                placeholder={t("questionPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("testHelp")}</p>
              <Button
                className={controlClass}
                type="submit"
                disabled={
                  !!busy ||
                  dirty ||
                  !question.trim() ||
                  settings!.status !== "ready" ||
                  readOnly
                }
              >
                {busy === "preview" && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {t("test")}
              </Button>
            </form>
            <div
              aria-live="polite"
              className="min-h-40 rounded-md border border-border bg-muted/30 p-5"
            >
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                {t("answerTitle")}
              </p>
              {answer ? (
                <>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {answer.reply}
                  </p>
                  {answer.handoff && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("needsHuman")}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("answerEmpty")}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {t("activationHelp")}
            </p>
            <Button
              className={controlClass}
              variant={settings!.enabled ? "outline" : "default"}
              disabled={
                !!busy ||
                dirty ||
                readOnly ||
                (!settings!.enabled &&
                  (!settings!.tested || settings!.status !== "ready"))
              }
              onClick={() =>
                void act("toggle", "", "PATCH", {
                  version: settings!.version,
                  enabled: !settings!.enabled,
                  instructions: settings!.instructions,
                  handoffMessage: settings!.handoffMessage,
                  includePaths: settings!.includePaths,
                })
              }
            >
              {settings!.enabled ? t("pause") : t("activate")}
            </Button>
          </div>
          <div className="space-y-3 border-t border-border pt-6">
            <h3 className="font-semibold">{t("conversations")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("conversationHelp")}
            </p>
            {!conversations.length ? (
              <p className="text-sm text-muted-foreground">
                {t("noConversations")}
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <ul className="max-h-80 space-y-2 overflow-auto">
                  {conversations.map((chat) => (
                    <li
                      key={chat.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                    >
                      <Button
                        variant="ghost"
                        className={controlClass}
                        aria-pressed={selected === chat.id}
                        onClick={() => {
                          if (selected !== chat.id) {
                            setMessages([])
                            setMessagesLoading(true)
                            setSelected(chat.id)
                          }
                        }}
                      >
                        {chat.phone}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {chat.mode === "human" ? t("needsHuman") : t("active")}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className={controlClass}
                        disabled={!!busy || readOnly}
                        onClick={() =>
                          void act("mode", "/conversations", "PATCH", {
                            conversationId: chat.id,
                            mode: chat.mode === "human" ? "bot" : "human",
                          })
                        }
                      >
                        {chat.mode === "human" ? t("resume") : t("takeOver")}
                      </Button>
                    </li>
                  ))}
                </ul>
                <div
                  aria-live="polite"
                  className="max-h-80 min-h-24 space-y-3 overflow-auto rounded-md border border-border p-4"
                >
                  {messagesLoading ? (
                    <p role="status">{t("loading")}</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={`${message.direction}-${message.id}`}
                        className="text-sm"
                      >
                        <p className="text-xs text-muted-foreground">
                          {message.direction === "inbound"
                            ? t("customer")
                            : t("label")}
                          {message.status === "needs_review"
                            ? ` · ${t("deliveryUnknown")}`
                            : ""}
                        </p>
                        <p className="whitespace-pre-wrap break-words">
                          {message.body || t("mediaMessage")}
                        </p>
                      </div>
                    ))
                  )}
                  {!selected && (
                    <p className="text-sm text-muted-foreground">
                      {t("selectConversation")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("disconnectTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("disconnectHelp")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void act("disconnect", "", "DELETE")}
            >
              {t("disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!leaveUrl}
        onOpenChange={(open) => {
          if (!open) setLeaveUrl(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leaveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("leaveHelp")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leaveUrl === "reload") {
                  setError(null)
                  setConflict(false)
                  setInvalid([])
                  setAnswer(null)
                  void load(true)
                  setLeaveUrl(null)
                } else if (leaveUrl) {
                  leaving.current = true
                  window.location.assign(leaveUrl)
                }
              }}
            >
              {t("discard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
