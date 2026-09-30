"use client"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, Inbox, Loader2, Mic, Paperclip, RefreshCw } from "lucide-react"
import { MobileMenuButton } from "@/components/admin-shell"
import { useBusinessAccess } from "@/components/admin/business-context"
import { IntegrationNavigationProvider, useIntegrationNavigation } from "@/components/admin/integrations/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Link, useRouter } from "@/i18n/routing"
import { Conversation } from "@/components/admin/support/conversation"
import { supportRequest, supportErrorCode } from "@/components/admin/support/request"
import { ClassificationChip, ContactAvatar, Note, formatListTime } from "@/components/admin/support/ui"
import type { SupportConversationView } from "@/lib/support/contracts"
import type { PublicGitHubConnection } from "@/lib/github/contracts"

const FILTERS = ["pending", "responded", "all"] as const
const PAGE_SIZE = 25
type Filter = (typeof FILTERS)[number]
type List = { conversations: SupportConversationView[]; total: number; page: number; pageSize: number; filter?: string }

const DIVIDER = "border-zinc-200 dark:border-white/[0.08]"

function InboxWorkspace() {
  const t = useTranslations("supportInbox")
  const locale = useLocale()
  const router = useRouter()
  const params = useSearchParams()
  const { businessId, readOnly } = useBusinessAccess()
  const { navigate } = useIntegrationNavigation()
  const rawFilter = params.get("filter") ?? ""
  const filter: Filter = (FILTERS as readonly string[]).includes(rawFilter) ? (rawFilter as Filter) : "pending"
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

  function change(next: { filter?: Filter; page?: number; conversation?: string | null }) {
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
      if (result.total > 0 && page * PAGE_SIZE >= result.total) router.replace(`/admin/inbox?filter=${filter}&page=${Math.max(0, Math.ceil(result.total / PAGE_SIZE) - 1)}${selected ? `&conversation=${selected}` : ""}`, { scroll: false })
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
  const visibleRows = data?.page === page && data?.filter === filter ? data.conversations : []
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Conversation list. On phones it is the whole screen until a conversation opens. */}
      <aside className={`${selected ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r md:w-80 xl:w-88 ${DIVIDER}`}>
        <div className={`flex h-18 shrink-0 items-center justify-between gap-3 border-b px-4 ${DIVIDER}`}>
          <div className="flex min-w-0 items-center gap-3">
            <MobileMenuButton />
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{t("title")}</h1>
              <p className="mt-0.5 truncate text-xs text-zinc-500" role="status">{data ? t("conversationCount", { count: data.total }) : t("loading")}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white" aria-label={t("refresh")} disabled={refreshing} onClick={refresh}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="shrink-0 px-3 pt-3" role="group" aria-label={t("filterLabel")}>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-200/50 p-1 dark:bg-white/[0.05]">
            {FILTERS.map((value) => {
              const active = filter === value
              return (
                <button key={value} type="button" aria-pressed={active} onClick={() => change({ filter: value, conversation: null })}
                  className={`h-8 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${active ? "glass-pill text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>
                  {t(`filter.${value}`)}
                </button>
              )
            })}
          </div>
        </div>

        {errorText && (
          <Note role="alert" className="mx-3 mt-3">
            <p className="basis-full">{errorText}</p>
            <Button size="sm" variant="outline" disabled={refreshing} onClick={refresh}>{t("retry")}</Button>
            <Button asChild size="sm" variant="ghost"><Link href="/admin/integrations/whatsapp">{t("configureWhatsApp")}</Link></Button>
          </Note>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-2" aria-busy={refreshing}>
          {!data && !error ? (
            <ListSkeleton />
          ) : !visibleRows.length ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
              <span className="glass-pill flex size-11 items-center justify-center rounded-xl"><Inbox className="size-5 text-zinc-500" /></span>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{error ? t("loadError") : t(`empty.${filter}`)}</p>
              {!error && <p className="max-w-56 text-xs leading-5 text-zinc-500">{t("emptyHelp")}</p>}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {visibleRows.map((conversation) => {
                const active = selected === conversation.id
                const preview = conversation.preview || (conversation.messageType === "audio" ? t("audio") : t("attachment", { type: conversation.messageType }))
                return (
                  <li key={conversation.id}>
                    <button type="button" onClick={() => change({ conversation: conversation.id })} aria-current={active ? "true" : undefined}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${active ? "glass-pill" : "hover:bg-zinc-200/40 dark:hover:bg-white/[0.05]"}`}>
                      <span className="relative mt-0.5 shrink-0">
                        <ContactAvatar name={conversation.contactName} />
                        {conversation.pending && <span role="img" aria-label={t("awaitingReply")} className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--glass-canvas)]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-sm ${conversation.pending ? "font-semibold text-zinc-900 dark:text-white" : "font-medium text-zinc-700 dark:text-zinc-300"}`}>{conversation.contactName || conversation.fromPhone}</span>
                          <time dateTime={conversation.lastMessageAt} className="shrink-0 text-[11px] tabular-nums text-zinc-500">{formatListTime(conversation.lastMessageAt, locale)}</time>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                          {conversation.messageType === "audio" ? <Mic className="size-3 shrink-0" aria-hidden /> : !conversation.preview ? <Paperclip className="size-3 shrink-0" aria-hidden /> : null}
                          <span className="truncate">{preview}</span>
                        </span>
                        {conversation.classification && <span className="mt-1.5 block"><ClassificationChip value={conversation.classification} /></span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {data && totalPages > 1 && (
          <div className={`flex shrink-0 items-center justify-between border-t px-3 py-2 ${DIVIDER}`}>
            <Button variant="ghost" size="icon-sm" aria-label={t("previousPage")} disabled={page === 0 || refreshing} onClick={() => change({ page: page - 1 })}><ChevronLeft className="size-4" /></Button>
            <span className="text-xs tabular-nums text-zinc-500">{t("page", { page: page + 1, total: totalPages })}</span>
            <Button variant="ghost" size="icon-sm" aria-label={t("nextPage")} disabled={page + 1 >= totalPages || refreshing} onClick={() => change({ page: page + 1 })}><ChevronRight className="size-4" /></Button>
          </div>
        )}
      </aside>

      {/* Thread and triage. Hidden on phones until a conversation is selected. */}
      <section className={`${selected ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {selected ? (
          <Conversation key={`${businessId}:${selected}`} businessId={businessId} conversationId={selected} readOnly={readOnly} codexConfigured={!!github?.codexWorkflow} onChanged={refresh} onBack={() => change({ conversation: null })} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-sm rounded-2xl border border-zinc-200 bg-white/70 px-8 py-10 text-center dark:border-white/[0.08] dark:bg-black/25">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200 dark:bg-white/[0.03] dark:ring-white/[0.08]"><Inbox className="size-5 text-zinc-500" /></div>
              <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("selectConversation")}</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">{t("selectHelp")}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-0.5" aria-hidden>
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-3 py-2.5">
          <Skeleton className="size-9 rounded-full bg-zinc-200 dark:bg-white/[0.07]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="flex justify-between gap-2"><Skeleton className="h-3.5 w-2/5 bg-zinc-200 dark:bg-white/[0.07]" /><Skeleton className="h-3 w-10 bg-zinc-200/60 dark:bg-white/[0.05]" /></div>
            <Skeleton className="h-3 w-4/5 bg-zinc-200/60 dark:bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SupportInboxPage() {
  return (
    <IntegrationNavigationProvider>
      <Suspense fallback={<div role="status" className="flex h-full items-center justify-center"><Loader2 className="size-5 animate-spin text-zinc-500" /></div>}>
        <InboxWorkspace />
      </Suspense>
    </IntegrationNavigationProvider>
  )
}
