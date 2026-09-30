"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { ArrowLeft, Check, ChevronDown, Copy, ExternalLink, FileCode2, Loader2, Paperclip, RefreshCw, Sparkles, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useIntegrationNavigation } from "@/components/admin/integrations/navigation"
import { AudioMessage } from "@/components/admin/support/audio-message"
import { TaskReview } from "@/components/admin/support/task-review"
import { supportRequest, supportErrorCode } from "@/components/admin/support/request"
import { ClassificationChip, ContactAvatar, Note, dayKey, formatDayLabel } from "@/components/admin/support/ui"
import type { SupportConversationView, SupportMessageView, SupportTaskView } from "@/lib/support/contracts"

export type ConversationDetail = { conversation: SupportConversationView; messages: SupportMessageView[]; tasks: SupportTaskView[]; nextBefore: string | null }

const DIVIDER = "border-zinc-200 dark:border-white/[0.08]"

export function Conversation({ businessId, conversationId, readOnly, codexConfigured, onChanged, onBack }: {
  businessId: string; conversationId: string; readOnly: boolean; codexConfigured: boolean; onChanged: () => void; onBack: () => void
}) {
  const t = useTranslations("supportInbox")
  const locale = useLocale()
  const { setDirty } = useIntegrationNavigation()
  const [data, setData] = useState<ConversationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const busyRef = useRef(false)
  const [reply, setReply] = useState("")
  const [dirty, setDirtyState] = useState(false)
  const dirtyRef = useRef(false)
  const mounted = useRef(true)
  const threadRef = useRef<HTMLDivElement>(null)
  const lastSeenMessage = useRef<string | null>(null)
  const endpoint = `/api/businesses/${businessId}/whatsapp/inbox/${conversationId}`
  const loadVersion = useRef(0)

  const markDirty = useCallback((value: boolean) => {
    dirtyRef.current = value; setDirtyState(value); setDirty(`reply:${conversationId}`, value)
  }, [conversationId, setDirty])

  const load = useCallback(async (signal?: AbortSignal) => {
    const version = ++loadVersion.current
    const result = await supportRequest<ConversationDetail>(endpoint, { signal })
    if (!mounted.current || signal?.aborted || version !== loadVersion.current) return
    setData((current) => ({ ...result, messages: current ? [...current.messages.filter((message) => !result.messages.some((incoming) => incoming.id === message.id)), ...result.messages] : result.messages,
      nextBefore: current && current.messages.length > 30 ? current.nextBefore : result.nextBefore }))
    if (!dirtyRef.current) setReply(result.conversation.suggestedReply ?? "")
    setError(null)
  }, [endpoint])

  useEffect(() => {
    mounted.current = true
    const controller = new AbortController()
    void load(controller.signal).catch((failure) => { if (!controller.signal.aborted) setError(supportErrorCode(failure)) })
    const timer = window.setInterval(() => {
      if (!document.hidden && !busyRef.current) void load(controller.signal).catch((failure) => { if (!controller.signal.aborted) setError(supportErrorCode(failure)) })
    }, 10_000)
    return () => { mounted.current = false; controller.abort(); clearInterval(timer); setDirty(`reply:${conversationId}`, false) }
  }, [load, conversationId, setDirty])

  // Keep the newest message in view: jump on first paint, follow new arrivals
  // only when the reader is already at the bottom. Loading older history never
  // moves the viewport. The thread only owns its scroll on wide screens.
  useEffect(() => {
    const latest = data?.messages.at(-1)?.id ?? null
    if (!latest || latest === lastSeenMessage.current) return
    const first = lastSeenMessage.current === null
    lastSeenMessage.current = latest
    const thread = threadRef.current
    if (!thread || !window.matchMedia("(min-width: 80rem)").matches) return
    const nearBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 160
    if (first || nearBottom) thread.scrollTo({ top: thread.scrollHeight, behavior: first ? "auto" : "smooth" })
  }, [data])

  async function mutate(action: "responded" | "pending" | "save_reply" | "analyze" | "older") {
    if (!data || busyRef.current) return
    busyRef.current = true; setBusy(action); setError(null)
    try {
      if (action === "analyze") {
        await supportRequest(`${endpoint}/analyze`, { method: "POST" })
        setData((current) => current ? { ...current, conversation: { ...current.conversation, triageStatus: "queued" } } : current)
      } else if (action === "older") {
        const older = await supportRequest<ConversationDetail>(`${endpoint}?before=${encodeURIComponent(data.nextBefore!)}`)
        if (mounted.current) setData((current) => current ? { ...current, messages: [...older.messages, ...current.messages.filter((message) => !older.messages.some((previous) => previous.id === message.id))], nextBefore: older.nextBefore } : current)
      } else {
        await supportRequest(endpoint, { method: "PATCH", body: JSON.stringify({ action, messageId: data.conversation.lastMessageId, ...(action === "save_reply" ? { suggestedReply: reply } : {}) }) })
        if (action === "save_reply") markDirty(false)
        await load(); onChanged(); toast.success(t(action === "responded" ? "markedResponded" : action === "pending" ? "markedPending" : "replySaved"))
      }
    } catch (failure) { if (mounted.current) setError(supportErrorCode(failure)) }
    finally { busyRef.current = false; if (mounted.current) setBusy(null) }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(reply); toast.success(t("copied")) }
    catch { setError("COPY_FAILED") }
  }

  const errorText = error ? (t.has(`errors.${error}`) ? t(`errors.${error}`) : t("loadError")) : null
  const backButton = <Button variant="ghost" size="icon-sm" className="-ml-2 text-zinc-500 md:hidden" aria-label={t("backToInbox")} onClick={onBack}><ArrowLeft className="size-4" /></Button>

  if (!data) {
    return (
      <div className="flex h-full flex-col">
        <header className={`flex h-18 shrink-0 items-center gap-3 border-b px-4 sm:px-6 ${DIVIDER}`}>
          {backButton}
          <Skeleton className="size-10 rounded-full bg-zinc-200 dark:bg-white/[0.07]" />
          <div className="space-y-2"><Skeleton className="h-4 w-40 bg-zinc-200 dark:bg-white/[0.07]" /><Skeleton className="h-3 w-24 bg-zinc-200/60 dark:bg-white/[0.05]" /></div>
        </header>
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500" role={error ? "alert" : "status"}>
          {error ? (
            <div className="space-y-3 text-center"><p>{errorText}</p><Button variant="outline" size="sm" onClick={() => void load().catch((failure) => setError(supportErrorCode(failure)))}>{t("retry")}</Button></div>
          ) : (
            <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />{t("loadingConversation")}</span>
          )}
        </div>
      </div>
    )
  }

  const conversation = data.conversation
  const contactLabel = conversation.contactName || conversation.fromPhone
  const analyzing = ["queued", "processing"].includes(conversation.triageStatus)
  const stale = conversation.analyzedThroughMessageId !== conversation.lastMessageId
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" })
  const dayLabels = { today: t("today"), yesterday: t("yesterday") }
  const canAnalyze = !busy && !analyzing && !readOnly && !dirty
  const evidence = conversation.repositoryEvidence ?? null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className={`flex min-h-18 shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-6 ${DIVIDER}`}>
        {backButton}
        <ContactAvatar name={conversation.contactName} className="size-10 text-sm" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-white">{contactLabel}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-500">
            {conversation.contactName && <span className="tabular-nums">{conversation.fromPhone}</span>}
            <span className={`inline-flex items-center gap-1.5 ${conversation.pending ? "text-emerald-700 dark:text-emerald-300" : ""}`}>
              {conversation.pending ? <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> : <Check className="size-3" aria-hidden />}
              {conversation.pending ? t("awaitingReply") : t("responded")}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" size="sm"><a href={`https://web.whatsapp.com/send?phone=${conversation.fromPhone.replace(/^\+/, "")}`} target="_blank" rel="noreferrer">{t("openWhatsApp")}<ExternalLink className="size-3.5" /></a></Button>
          <Button size="sm" className="min-w-36" variant={conversation.pending ? "default" : "outline"} disabled={!!busy || readOnly} onClick={() => void mutate(conversation.pending ? "responded" : "pending")}>
            {busy === "responded" || busy === "pending" ? <Loader2 className="size-4 animate-spin" /> : conversation.pending ? <Check className="size-4" /> : <Undo2 className="size-4" />}
            {conversation.pending ? t("markResponded") : t("markPending")}
          </Button>
        </div>
      </header>

      {errorText && (
        <Note role="alert" className="mx-4 mt-4 sm:mx-6">
          <p className="flex-1">{errorText}</p>
          <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void load().catch((failure) => setError(supportErrorCode(failure)))}><RefreshCw className="size-3.5" />{t("refresh")}</Button>
        </Note>
      )}

      {/* Below xl the thread and the rail stack in one scrolling column; at xl
          each side scrolls on its own so the draft stays next to the messages. */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide xl:flex xl:overflow-hidden">
        <div ref={threadRef} className="xl:min-w-0 xl:flex-1 xl:overflow-y-auto xl:scrollbar-hide">
          <ol className="mx-auto max-w-3xl space-y-3 px-4 py-6 sm:px-6" aria-label={t("threadLabel", { name: contactLabel })}>
            {data.nextBefore && (
              <li className="flex justify-center pb-2">
                <Button variant="ghost" size="sm" className="rounded-full text-xs text-zinc-500" disabled={!!busy} onClick={() => void mutate("older")}>{busy === "older" && <Loader2 className="size-3.5 animate-spin" />}{t("olderMessages")}</Button>
              </li>
            )}
            {data.messages.map((message, index) => {
              const previous = data.messages[index - 1]
              const newDay = !previous || dayKey(previous.receivedAt) !== dayKey(message.receivedAt)
              return (
                <li key={message.id} className="space-y-3">
                  {newDay && (
                    <div className="flex items-center gap-3 py-2" aria-hidden>
                      <span className={`h-px flex-1 border-t ${DIVIDER}`} />
                      <span className="text-[11px] font-medium text-zinc-500">{formatDayLabel(message.receivedAt, locale, dayLabels)}</span>
                      <span className={`h-px flex-1 border-t ${DIVIDER}`} />
                    </div>
                  )}
                  <div className="flex max-w-[85%] flex-col items-start sm:max-w-[75%]">
                    <div className="rounded-2xl rounded-tl-md bg-white/80 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/80 dark:bg-white/[0.06] dark:ring-white/[0.06]">
                      {message.messageType === "audio" ? (
                        <AudioMessage message={message} endpoint={endpoint} readOnly={readOnly} processing={analyzing} onSaved={load} />
                      ) : message.textBody ? (
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-800 dark:text-zinc-200">{message.textBody}</p>
                      ) : (
                        <p className="flex items-center gap-2 text-sm text-zinc-500"><Paperclip className="size-3.5" aria-hidden />{t("attachment", { type: message.messageType })}</p>
                      )}
                    </div>
                    <time dateTime={message.receivedAt} className="mt-1 pl-1 text-[11px] tabular-nums text-zinc-500">{timeFormat.format(new Date(message.receivedAt))}</time>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <aside className={`border-t xl:w-88 xl:shrink-0 xl:overflow-y-auto xl:border-t-0 xl:border-l xl:scrollbar-hide 2xl:w-96 ${DIVIDER}`} aria-label={t("analysisTitle")}>
          <section className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                <span className="flex size-6 items-center justify-center rounded-md bg-zinc-500/10 text-zinc-500 dark:text-zinc-400"><Sparkles className="size-3.5" aria-hidden /></span>
                {t("analysisTitle")}
              </h3>
              {conversation.suggestedReply && !analyzing && (
                <Button size="sm" variant="ghost" className="text-xs text-zinc-500" disabled={!canAnalyze} onClick={() => void mutate("analyze")}><RefreshCw className="size-3.5" />{t("analyzeAgain")}</Button>
              )}
            </div>

            {analyzing && (
              <div className="mt-4 space-y-2.5" role="status">
                <p className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="size-3.5 animate-spin" />{t("analyzing")}</p>
                <Skeleton className="h-3 w-3/4 bg-zinc-200 dark:bg-white/[0.07]" />
                <Skeleton className="h-3 w-full bg-zinc-200/60 dark:bg-white/[0.05]" />
                <Skeleton className="h-3 w-2/3 bg-zinc-200/60 dark:bg-white/[0.05]" />
              </div>
            )}

            {conversation.errorCode && <p role="alert" className="mt-4 text-sm leading-5 text-amber-700 dark:text-amber-300">{t.has(`errors.${conversation.errorCode}`) ? t(`errors.${conversation.errorCode}`) : t("analysisFailed")}</p>}

            {conversation.summary && (
              <div className="mt-4">
                <ClassificationChip value={conversation.classification} size="md" />
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{conversation.summary}</p>
              </div>
            )}

            {evidence && !analyzing && (
              <div className="mt-4 space-y-2.5">
                {evidence.status !== "ready" && (
                  <Note role="status" className="px-3 py-2.5 text-xs leading-5"><p>{t(evidence.status === "unavailable" ? "repositoryUnavailable" : "repositoryPartial")}</p></Note>
                )}
                {evidence.files.length > 0 && (
                  <details className="group rounded-xl bg-zinc-500/[0.06] text-xs dark:bg-white/[0.04]">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 font-medium text-zinc-600 marker:content-none dark:text-zinc-300 [&::-webkit-details-marker]:hidden">
                      <FileCode2 className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
                      <span className="flex-1">{t("repositorySources", { count: evidence.files.length })}</span>
                      <ChevronDown className="size-3.5 text-zinc-500 transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <ul className="space-y-1 px-3 pb-3">
                      {evidence.files.map((file, index) => (
                        <li key={`${file.path}:${file.startLine}:${index}`}>
                          <a href={`https://github.com/${evidence.repository.split("/").map(encodeURIComponent).join("/")}/blob/${encodeURIComponent(evidence.commit ?? evidence.branch)}/${file.path.split("/").map(encodeURIComponent).join("/")}#L${file.startLine}-L${file.endLine}`} target="_blank" rel="noreferrer"
                            className="flex items-baseline gap-2 font-mono text-[11px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                            <span className="truncate">{file.path}</span>
                            <span className="shrink-0 tabular-nums text-zinc-500">L{file.startLine}-{file.endLine}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            {!conversation.suggestedReply && !analyzing && (
              <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 text-center dark:border-white/[0.12]">
                <p className="text-sm leading-6 text-zinc-500">{t("analysisEmpty")}</p>
                <Button size="sm" className="mt-3" disabled={!canAnalyze} onClick={() => void mutate("analyze")}><Sparkles className="size-3.5" />{t("analyze")}</Button>
              </div>
            )}

            {conversation.suggestedReply && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`reply-${conversation.id}`}>{t("replyLabel")}</Label>
                  {dirty && <span className="text-[11px] text-zinc-500">{t("unsavedEdits")}</span>}
                </div>
                <Textarea id={`reply-${conversation.id}`} rows={6} value={reply} maxLength={5000} disabled={readOnly || !!busy || analyzing} className="resize-y text-sm leading-6" aria-describedby={`reply-help-${conversation.id}`}
                  onChange={(event) => { setReply(event.target.value); markDirty(event.target.value !== (conversation.suggestedReply ?? "")) }} />
                {stale ? (
                  <Note role="status" className="px-3 py-2.5 text-xs leading-5"><p id={`reply-help-${conversation.id}`}>{t("staleReply")}</p></Note>
                ) : (
                  <p id={`reply-help-${conversation.id}`} className="text-xs leading-5 text-zinc-500">{t("replyHelp")}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={!reply.trim()} onClick={() => void copy()}><Copy className="size-3.5" />{t("copyReply")}</Button>
                  <Button size="sm" variant="outline" disabled={!!busy || analyzing || readOnly || !dirty || !reply.trim() || stale} onClick={() => void mutate("save_reply")}>{busy === "save_reply" && <Loader2 className="size-3.5 animate-spin" />}{t("saveReply")}</Button>
                  {dirty && <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => { setReply(conversation.suggestedReply ?? ""); markDirty(false) }}>{t("discardReply")}</Button>}
                </div>
              </div>
            )}
          </section>

          {data.tasks.map((task) => <TaskReview key={task.id} task={task} endpoint={endpoint} readOnly={readOnly || analyzing} codexConfigured={codexConfigured} onUpdate={load} />)}
        </aside>
      </div>
    </div>
  )
}
