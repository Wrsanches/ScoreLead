"use client"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { ArrowLeft, ChevronLeft, ChevronRight, Inbox, Loader2, Mic, RefreshCw } from "lucide-react"
import { ContentWrapper, PageHeader, SectionCard } from "@/components/admin"
import { useBusinessAccess } from "@/components/admin/business-context"
import { IntegrationNavigationProvider, useIntegrationNavigation } from "@/components/admin/integrations/navigation"
import { Button } from "@/components/ui/button"
import { Link, useRouter } from "@/i18n/routing"
import { Conversation } from "@/components/admin/support/conversation"
import { supportRequest, supportErrorCode } from "@/components/admin/support/request"
import type { SupportConversationView } from "@/lib/support/contracts"
import type { PublicGitHubConnection } from "@/lib/github/contracts"

type List = { conversations: SupportConversationView[]; total: number; page: number; pageSize: number; filter?: string }
function InboxWorkspace() {
  const t = useTranslations("supportInbox")
  const locale = useLocale()
  const router = useRouter()
  const params = useSearchParams()
  const { businessId, readOnly } = useBusinessAccess()
  const { navigate } = useIntegrationNavigation()
  const filter = ["pending", "responded", "all"].includes(params.get("filter") ?? "") ? params.get("filter")! : "pending"
  const rawPage = Number(params.get("page") ?? 0)
  const page = Number.isInteger(rawPage) && rawPage >= 0 && rawPage <= 10000 ? rawPage : 0
  const selected = params.get("conversation")
  const [data, setData] = useState<List | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [revision, setRevision] = useState(0)
  const [github, setGitHub] = useState<PublicGitHubConnection | null>(null)
  const endpoint = `/api/businesses/${businessId}/whatsapp/inbox?filter=${filter}&page=${page}`
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  function change(next: { filter?: string; page?: number; conversation?: string | null }) {
    const query = new URLSearchParams(params.toString())
    if (next.filter) { query.set("filter", next.filter); query.delete("page") }
    if (next.page !== undefined) query.set("page", String(next.page))
    if (next.conversation !== undefined) { if (next.conversation) query.set("conversation", next.conversation); else query.delete("conversation") }
    navigate(() => router.replace(`/admin/inbox?${query.toString()}`, { scroll: false }))
  }
  useEffect(() => {
    const controller = new AbortController(); setRefreshing(true)
    supportRequest<List>(endpoint, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return
      setData({ ...result, filter }); setError(null)
      if (result.total > 0 && page * 25 >= result.total) router.replace(`/admin/inbox?filter=${filter}&page=${Math.max(0, Math.ceil(result.total / 25) - 1)}${selected ? `&conversation=${selected}` : ""}`, { scroll: false })
    }).catch((failure) => { if (!controller.signal.aborted) setError(supportErrorCode(failure)) })
      .finally(() => { if (!controller.signal.aborted) setRefreshing(false) })
    return () => controller.abort()
  }, [endpoint, revision, filter, page, selected, router])
  useEffect(() => { const timer = window.setInterval(() => { if (!document.hidden) refresh() }, 15_000); return () => clearInterval(timer) }, [refresh])
  useEffect(() => {
    const controller = new AbortController()
    supportRequest<{ connection: PublicGitHubConnection | null }>(`/api/businesses/${businessId}/github/connection`, { signal: controller.signal })
      .then((result) => setGitHub(result.connection)).catch(() => {})
    return () => controller.abort()
  }, [businessId])
  const errorText = error ? (t.has(`errors.${error}`) ? t(`errors.${error}`) : t("loadError")) : null
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  const visibleRows = data?.page === page && data?.filter === filter ? data.conversations : []
  return <div className="flex-1 overflow-y-auto"><ContentWrapper>
    <PageHeader title={t("title")} description={t("description")} actions={<><Button className="cursor-pointer" variant="outline" disabled={refreshing} onClick={refresh}>{refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}{t("refresh")}</Button><Button asChild variant="outline"><Link href="/admin/integrations/github">GitHub</Link></Button></>} />
    {errorText && <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"><p>{errorText}</p><Button className="cursor-pointer" variant="outline" disabled={refreshing} onClick={refresh}>{t("retry")}</Button><Button asChild variant="ghost"><Link href="/admin/integrations/whatsapp">{t("configureWhatsApp")}</Link></Button></div>}
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(16rem,21rem)_minmax(0,1fr)]">
      <div className={selected ? "hidden lg:block" : ""}><SectionCard>
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/5" aria-label={t("filterLabel")}>{["pending", "responded", "all"].map((value) => <Button key={value} variant={filter === value ? "secondary" : "ghost"} className="h-9 flex-1 cursor-pointer px-2 text-xs" aria-pressed={filter === value} onClick={() => change({ filter: value, conversation: null })}>{t(`filter.${value}`)}</Button>)}</div>
        <p className="mt-4 text-xs text-zinc-500" role="status">{data ? t("conversationCount", { count: data.total }) : t("loading")}</p>
        <div className="mt-3 min-h-64" aria-busy={refreshing}>
          {!data && !error ? <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-500"><Loader2 className="size-4 animate-spin" />{t("loading")}</div> : !visibleRows.length ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center text-zinc-500"><Inbox className="size-7" /><p className="text-sm">{error ? t("loadError") : t(`empty.${filter}`)}</p>{!error && <p className="max-w-60 text-xs leading-5">{t("emptyHelp")}</p>}</div> : <ul className="space-y-1">{visibleRows.map((conversation) => <li key={conversation.id}><button type="button" onClick={() => change({ conversation: conversation.id })} aria-current={selected === conversation.id ? "true" : undefined}
            className={`w-full cursor-pointer rounded-xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${selected === conversation.id ? "bg-emerald-500/10 ring-1 ring-emerald-500/20" : "hover:bg-zinc-100 dark:hover:bg-white/5"}`}>
            <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{conversation.contactName || conversation.fromPhone}</span>{conversation.pending && <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-label={t("awaitingReply")} />}</span><span className="mt-1 block line-clamp-2 break-words text-xs leading-5 text-zinc-500">{conversation.preview || (conversation.messageType === "audio" ? t("audio") : t("attachment", { type: conversation.messageType }))}</span><span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500"><time dateTime={conversation.lastMessageAt}>{date.format(new Date(conversation.lastMessageAt))}</time>{conversation.messageType === "audio" && <Mic className="size-3" aria-label={t("audio")} />}{conversation.classification && <span>{t.has(`classification.${conversation.classification}`) ? t(`classification.${conversation.classification}`) : t("classification.other")}</span>}</span>
          </button></li>)}</ul>}
        </div>
        {data && data.total > 25 && <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/10"><Button className="cursor-pointer" variant="ghost" size="icon" aria-label={t("previousPage")} disabled={page === 0 || refreshing} onClick={() => change({ page: page - 1 })}><ChevronLeft className="size-4" /></Button><span className="text-xs text-zinc-500">{t("page", { page: page + 1, total: Math.ceil(data.total / 25) })}</span><Button className="cursor-pointer" variant="ghost" size="icon" aria-label={t("nextPage")} disabled={(page + 1) * 25 >= data.total || refreshing} onClick={() => change({ page: page + 1 })}><ChevronRight className="size-4" /></Button></div>}
      </SectionCard></div>
      {selected ? <div className="min-w-0"><Button variant="ghost" className="mb-3 cursor-pointer lg:hidden" onClick={() => change({ conversation: null })}><ArrowLeft className="size-4" />{t("backToInbox")}</Button><Conversation key={`${businessId}:${selected}`} businessId={businessId} conversationId={selected} readOnly={readOnly} codexConfigured={!!github?.codexWorkflow} onChanged={refresh} /></div> : <SectionCard><div className="flex min-h-96 flex-col items-center justify-center gap-4 text-center"><Inbox className="size-8 text-zinc-400" /><h2 className="font-medium text-zinc-900 dark:text-zinc-100">{t("selectConversation")}</h2><p className="max-w-sm text-sm leading-6 text-zinc-500">{t("selectHelp")}</p></div></SectionCard>}
    </div>
  </ContentWrapper></div>
}
export default function SupportInboxPage() { return <IntegrationNavigationProvider><Suspense fallback={<div role="status" className="flex min-h-96 items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>}><InboxWorkspace /></Suspense></IntegrationNavigationProvider> }
