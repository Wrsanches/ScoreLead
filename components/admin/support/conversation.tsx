"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Check, Copy, ExternalLink, Loader2, RefreshCw, Undo2 } from "lucide-react"
import { SectionCard } from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useIntegrationNavigation } from "@/components/admin/integrations/navigation"
import { AudioMessage } from "@/components/admin/support/audio-message"
import { TaskReview } from "@/components/admin/support/task-review"
import { supportRequest, supportErrorCode } from "@/components/admin/support/request"
import type { SupportConversationView, SupportMessageView, SupportTaskView } from "@/lib/support/contracts"

export type ConversationDetail = { conversation: SupportConversationView; messages: SupportMessageView[]; tasks: SupportTaskView[]; nextBefore: string | null }

export function Conversation({ businessId, conversationId, readOnly, codexConfigured, onChanged }: {
  businessId: string; conversationId: string; readOnly: boolean; codexConfigured: boolean; onChanged: () => void
}) {
  const t = useTranslations("supportInbox")
  const locale = useLocale()
  const { setDirty } = useIntegrationNavigation()
  const [data, setData] = useState<ConversationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const busyRef = useRef(false)
  const [reply, setReply] = useState("")
  const dirtyRef = useRef(false)
  const mounted = useRef(true)
  const endpoint = `/api/businesses/${businessId}/whatsapp/inbox/${conversationId}`
  const loadVersion = useRef(0)
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
        if (action === "save_reply") { dirtyRef.current = false; setDirty(`reply:${conversationId}`, false) }
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
  if (!data) return <SectionCard><div className="flex min-h-96 items-center justify-center gap-2 text-sm text-zinc-500" role={error ? "alert" : "status"}>{error ? <div className="space-y-3 text-center"><p>{errorText}</p><Button variant="outline" className="cursor-pointer" onClick={() => void load().catch((failure) => setError(supportErrorCode(failure)))}>{t("retry")}</Button></div> : <><Loader2 className="size-4 animate-spin" />{t("loadingConversation")}</>}</div></SectionCard>
  const conversation = data.conversation
  const analyzing = ["queued", "processing"].includes(conversation.triageStatus)
  const stale = conversation.analyzedThroughMessageId !== conversation.lastMessageId
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" })
  return <div className="min-w-0 space-y-5">
    <SectionCard><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-lg font-semibold text-zinc-900 dark:text-zinc-50">{conversation.contactName || conversation.fromPhone}</h2>{conversation.contactName && <p className="mt-1 text-xs text-zinc-500">{conversation.fromPhone}</p>}<p className="mt-2 text-xs text-zinc-500">{conversation.pending ? t("awaitingReply") : t("responded")}</p></div>
      <div className="flex flex-wrap gap-2"><Button className="min-w-36 cursor-pointer" variant={conversation.pending ? "default" : "outline"} disabled={!!busy || readOnly} onClick={() => void mutate(conversation.pending ? "responded" : "pending")}>{busy === "responded" || busy === "pending" ? <Loader2 className="size-4 animate-spin" /> : conversation.pending ? <Check className="size-4" /> : <Undo2 className="size-4" />}{conversation.pending ? t("markResponded") : t("markPending")}</Button><Button asChild variant="outline"><a href={`https://web.whatsapp.com/send?phone=${conversation.fromPhone.replace(/^\+/, "")}`} target="_blank" rel="noreferrer">{t("openWhatsApp")}<ExternalLink className="size-3.5" /></a></Button></div></div>
      {errorText && <div role="alert" className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"><p>{errorText}</p><Button className="cursor-pointer" variant="ghost" disabled={!!busy} onClick={() => void load().catch((failure) => setError(supportErrorCode(failure)))}>{t("refresh")}</Button></div>}
      <ol className="mt-5 space-y-4 border-t border-black/5 pt-5 dark:border-white/10">
        {data.nextBefore && <li><Button variant="ghost" className="w-full cursor-pointer" disabled={!!busy} onClick={() => void mutate("older")}>{busy === "older" && <Loader2 className="size-4 animate-spin" />}{t("olderMessages")}</Button></li>}
        {data.messages.map((message) => <li key={message.id} className="rounded-xl bg-zinc-100/70 p-4 dark:bg-white/5"><time dateTime={message.receivedAt} className="mb-2 block text-[11px] text-zinc-500">{formatter.format(new Date(message.receivedAt))}</time>{message.messageType === "audio" ? <AudioMessage message={message} endpoint={endpoint} readOnly={readOnly} processing={analyzing} onSaved={load} /> : <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700 dark:text-zinc-300">{message.textBody || t("attachment", { type: message.messageType })}</p>}</li>)}
      </ol>
    </SectionCard>
    <SectionCard title={t("analysisTitle")} actions={<Button className="cursor-pointer" size="sm" variant="ghost" disabled={!!busy || analyzing || readOnly || dirtyRef.current} onClick={() => void mutate("analyze")}><RefreshCw className="size-3.5" />{conversation.suggestedReply ? t("analyzeAgain") : t("analyze")}</Button>}>
      {analyzing && <p role="status" className="mb-4 flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="size-4 animate-spin" />{t("analyzing")}</p>}
      {conversation.errorCode && <p role="alert" className="mb-4 text-sm text-amber-700 dark:text-amber-300">{t.has(`errors.${conversation.errorCode}`) ? t(`errors.${conversation.errorCode}`) : t("analysisFailed")}</p>}
      {conversation.summary && <div className="mb-5"><span className="inline-flex rounded-full bg-zinc-500/10 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t.has(`classification.${conversation.classification}`) ? t(`classification.${conversation.classification}`) : t("classification.other")}</span><p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{conversation.summary}</p></div>}
      {!conversation.suggestedReply && !analyzing && <p className="mb-4 text-sm text-zinc-500">{t("analysisEmpty")}</p>}
      {conversation.suggestedReply && <div className="space-y-3"><Label htmlFor={`reply-${conversation.id}`}>{t("replyLabel")}</Label><Textarea id={`reply-${conversation.id}`} rows={5} value={reply} maxLength={5000} disabled={readOnly || !!busy || analyzing} onChange={(event) => { setReply(event.target.value); dirtyRef.current = event.target.value !== (conversation.suggestedReply ?? ""); setDirty(`reply:${conversationId}`, dirtyRef.current) }} aria-describedby={`reply-help-${conversation.id}`} /><p id={`reply-help-${conversation.id}`} className="text-xs leading-5 text-zinc-500">{stale ? t("staleReply") : t("replyHelp")}</p><div className="flex flex-wrap gap-2"><Button className="cursor-pointer" disabled={!reply.trim()} onClick={() => void copy()}><Copy className="size-4" />{t("copyReply")}</Button><Button className="cursor-pointer" variant="outline" disabled={!!busy || analyzing || readOnly || !dirtyRef.current || !reply.trim() || stale} onClick={() => void mutate("save_reply")}>{busy === "save_reply" && <Loader2 className="size-4 animate-spin" />}{t("saveReply")}</Button>{dirtyRef.current && <Button variant="ghost" className="cursor-pointer" disabled={!!busy} onClick={() => { setReply(conversation.suggestedReply ?? ""); dirtyRef.current = false; setDirty(`reply:${conversationId}`, false) }}>{t("discardReply")}</Button>}</div></div>}
    </SectionCard>
    {data.tasks.map((task) => <TaskReview key={task.id} task={task} endpoint={endpoint} readOnly={readOnly || analyzing} codexConfigured={codexConfigured} onUpdate={load} />)}
  </div>
}
