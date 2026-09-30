"use client"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, ExternalLink, GitBranch, Loader2, Lock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supportRequest, supportErrorCode } from "@/components/admin/support/request"
import type { GitHubInstallationView, GitHubRepositoryView } from "@/lib/github/contracts"

type RepositoryList = { login: string; installations: GitHubInstallationView[]; installationId: string | null; repositories: GitHubRepositoryView[]; total: number; page: number; pageSize: number }
export function RepositoryPicker({ businessId, installUrl, disabled, selectedId, onSelect }: {
  businessId: string; installUrl: string | null; disabled: boolean; selectedId: string | null
  onSelect: (repository: GitHubRepositoryView, installationId: string) => void
}) {
  const t = useTranslations("githubIntegration")
  const [installation, setInstallation] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<RepositoryList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chosen, setChosen] = useState<GitHubRepositoryView | null>(null)
  const [expanded, setExpanded] = useState(true)
  const changeButton = useRef<HTMLButtonElement>(null)
  const choices = useRef<HTMLFieldSetElement>(null)
  useEffect(() => {
    if (!chosen || selectedId !== chosen.id) return
    if (!expanded) changeButton.current?.focus()
    else choices.current?.querySelector<HTMLInputElement>("input:checked")?.focus()
  }, [expanded, chosen, selectedId])
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(null)
    const query = new URLSearchParams({ page: String(page) })
    if (installation) query.set("installation", installation)
    supportRequest<RepositoryList>(`/api/businesses/${businessId}/github/repositories?${query}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result) })
      .catch((failure) => { if (!controller.signal.aborted) setError(supportErrorCode(failure)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [businessId, installation, page, revision])
  useEffect(() => {
    const refresh = () => { if (!document.hidden) setRevision((value) => value + 1) }
    window.addEventListener("focus", refresh)
    return () => window.removeEventListener("focus", refresh)
  }, [])
  const errorText = error && (t.has(`errors.${error}`) ? t(`errors.${error}`) : t("repositoriesError"))
  if (!expanded && chosen && selectedId === chosen.id) return <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"><div className="min-w-0"><p className="text-xs text-zinc-500">{t("selectedRepository")}</p><p className="mt-1 break-all text-sm font-medium text-zinc-900 dark:text-zinc-100">{chosen.fullName}</p></div><Button ref={changeButton} type="button" variant="ghost" className="cursor-pointer" disabled={disabled} onClick={() => setExpanded(true)}>{t("changeRepository")}</Button></div>
  return <div className="mb-6 space-y-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t("chooseRepository")}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{t("repositoriesHelp")}</p></div><Button type="button" variant="ghost" size="sm" className="cursor-pointer" disabled={loading || disabled} onClick={() => setRevision((value) => value + 1)}><RefreshCw className="size-3.5" />{t("refreshRepositories")}</Button></div>
    {data?.installations.length ? <div className="space-y-2"><Label htmlFor="github-account">{t("accountLabel")}</Label><Select value={installation ?? data.installationId ?? ""} disabled={disabled || loading} onValueChange={(value) => { setInstallation(value); setPage(0) }}><SelectTrigger id="github-account" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{data.installations.map((account) => <SelectItem key={account.id} value={account.id}>{account.login}</SelectItem>)}</SelectContent></Select></div> : null}
    {errorText ? <p role="alert" className="text-sm leading-6 text-amber-700 dark:text-amber-300">{errorText}</p> : loading ? <p role="status" className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="size-4 animate-spin" />{t("loadingRepositories")}</p> : !data?.repositories.length ? <p className="text-sm leading-6 text-zinc-500">{t("noRepositories")}</p> : <fieldset ref={choices} disabled={disabled || loading} className="max-h-96 space-y-2 overflow-y-auto"><legend className="sr-only">{t("chooseRepository")}</legend>{data.repositories.map((repository) => <label key={repository.id} className={`flex min-w-0 items-start gap-3 rounded-lg border p-3 ${selectedId === repository.id ? "border-emerald-500/40 bg-emerald-500/5" : "border-black/5 dark:border-white/5"} ${repository.writable && !repository.archived ? "cursor-pointer" : "opacity-60"}`}>
      <input type="radio" name="github-selected-repository" value={repository.id} checked={selectedId === repository.id} disabled={!repository.writable || repository.archived} onChange={() => { if (data.installationId) { setChosen(repository); setExpanded(false); onSelect(repository, data.installationId) } }} className="mt-1 accent-emerald-600" />
      <span className="min-w-0"><span className="flex items-start gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100"><GitBranch className="mt-0.5 size-4 shrink-0" /><span className="break-all">{repository.fullName}</span>{repository.private && <Lock className="mt-0.5 size-3.5 shrink-0" aria-label={t("privateRepository")} />}</span>{repository.description && <span className="mt-1 block line-clamp-2 text-xs leading-5 text-zinc-500">{repository.description}</span>}{(!repository.writable || repository.archived) && <span className="mt-1 block text-xs text-zinc-500">{repository.archived ? t("archivedRepository") : t("readOnlyRepository")}</span>}</span>
    </label>)}</fieldset>}
    {data && data.total > data.pageSize && <div className="flex items-center justify-between"><Button type="button" variant="ghost" size="icon" aria-label={t("previousPage")} className="cursor-pointer" disabled={disabled || loading || page === 0} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="size-4" /></Button><span className="text-xs text-zinc-500">{t("repositoryPage", { page: page + 1, total: Math.ceil(data.total / data.pageSize) })}</span><Button type="button" variant="ghost" size="icon" aria-label={t("nextPage")} className="cursor-pointer" disabled={disabled || loading || (page + 1) * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}><ChevronRight className="size-4" /></Button></div>}
    {installUrl && <a href={installUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-emerald-700 underline dark:text-emerald-300">{t("authorizeRepositories")}<ExternalLink className="size-3.5" /></a>}
  </div>
}
