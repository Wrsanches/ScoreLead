"use client"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Check, ClipboardList, ExternalLink, Loader2, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { useIntegrationNavigation } from "@/components/admin/integrations/navigation"
import { supportRequest, supportErrorCode } from "@/components/admin/support/request"
import { supportTaskProposalSchema, type SupportTaskView } from "@/lib/support/contracts"
import { Link } from "@/i18n/routing"

// Task lifecycle tones. Violet is the task colour across the admin; emerald
// here means "done", the one success state in the flow.
const STATUS_TONES: Record<string, string> = {
  proposed: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  approved: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  rejected: "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20",
  publishing: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  publish_uncertain: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  published: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
}
const PRIORITY_TONES: Record<string, string> = {
  low: "text-zinc-500",
  medium: "text-sky-700 dark:text-sky-300",
  high: "text-amber-700 dark:text-amber-300",
}

export function TaskReview({ task, endpoint, readOnly, codexConfigured, onUpdate }: {
  task: SupportTaskView; endpoint: string; readOnly: boolean; codexConfigured: boolean; onUpdate: () => Promise<void>
}) {
  const t = useTranslations("supportInbox")
  const [proposal, setProposal] = useState(task.proposal)
  const [criteria, setCriteria] = useState(task.proposal.acceptanceCriteria.join("\n"))
  const [reason, setReason] = useState("")
  const [action, setAction] = useState<"approve" | "reject" | "publish" | "codex" | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const { setDirty } = useIntegrationNavigation()
  const edited = { ...proposal, acceptanceCriteria: criteria.split("\n").map((item) => item.trim()).filter(Boolean) }
  const dirty = task.status === "proposed" && JSON.stringify(edited) !== JSON.stringify(task.proposal)
  useEffect(() => { setDirty(`task:${task.id}`, dirty); return () => setDirty(`task:${task.id}`, false) }, [dirty, setDirty, task.id])
  const source = JSON.stringify(task.proposal)
  useEffect(() => {
    if (!dirty) { setProposal(JSON.parse(source)); setCriteria(JSON.parse(source).acceptanceCriteria.join("\n")) }
  }, [source, dirty])

  async function submit(decision: "approve" | "reject" | "publish" | "codex" | "reconcile") {
    setInvalid(true)
    if ((decision === "approve" && !supportTaskProposalSchema.safeParse(edited).success) || (decision === "reject" && !reason.trim())) return
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(null)
    try {
      await supportRequest(`${endpoint}/tasks/${task.id}`, { method: "POST", body: JSON.stringify({ action: decision,
        ...(decision === "approve" ? { proposal: edited } : {}), ...(decision === "reject" ? { reason: reason.trim() } : {}),
      }) })
      setDirty(`task:${task.id}`, false); setAction(null); setInvalid(false)
      await onUpdate(); toast.success(t(`taskSuccess.${decision}`))
    } catch (failure) { setError(supportErrorCode(failure)); await onUpdate().catch(() => {}) }
    finally { busyRef.current = false; setBusy(false) }
  }

  const errorText = error ? (t.has(`errors.${error}`) ? t(`errors.${error}`) : t("actionError")) : null
  const proposed = task.status === "proposed"
  const codexRequested = ["dispatching", "dispatched", "dispatch_uncertain"].includes(task.codexStatus ?? "")
  const valid = supportTaskProposalSchema.safeParse(edited).success
  const statusLabel = t.has(`taskStatus.${task.status}`) ? t(`taskStatus.${task.status}`) : t("taskStatus.publishing")
  const statusTone = STATUS_TONES[task.status] ?? STATUS_TONES.publishing
  const settling = ["publishing", "publish_uncertain"].includes(task.status)

  return (
    <section className="border-t border-zinc-200 p-4 sm:p-5 dark:border-white/[0.08]" aria-label={t("taskProposal")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <span className="flex size-6 items-center justify-center rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-300"><ClipboardList className="size-3.5" aria-hidden /></span>
          {t("taskProposal")}
        </h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusTone}`}>
          {settling && <Loader2 className="size-3 animate-spin" aria-hidden />}
          {statusLabel}
        </span>
      </div>

      {proposed ? (
        <div className="mt-4 space-y-3.5">
          <div className="space-y-1.5"><Label htmlFor={`title-${task.id}`}>{t("taskTitle")}</Label><Input id={`title-${task.id}`} value={proposal.title} maxLength={200} onChange={(event) => setProposal((current) => ({ ...current, title: event.target.value }))} disabled={busy || readOnly} aria-invalid={invalid && !proposal.title.trim()} /></div>
          <div className="space-y-1.5"><Label htmlFor={`description-${task.id}`}>{t("taskDescription")}</Label><Textarea id={`description-${task.id}`} value={proposal.description} maxLength={6000} rows={4} className="text-sm leading-6" onChange={(event) => setProposal((current) => ({ ...current, description: event.target.value }))} disabled={busy || readOnly} /></div>
          <div className="space-y-1.5"><Label htmlFor={`criteria-${task.id}`}>{t("taskCriteria")}</Label><Textarea id={`criteria-${task.id}`} value={criteria} rows={3} className="text-sm leading-6" onChange={(event) => setCriteria(event.target.value)} disabled={busy || readOnly} aria-describedby={`criteria-help-${task.id}`} /><p id={`criteria-help-${task.id}`} className="text-xs text-zinc-500">{t("criteriaHelp")}</p></div>
          <div className="space-y-1.5"><Label htmlFor={`priority-${task.id}`}>{t("taskPriority")}</Label><Select value={proposal.priority} onValueChange={(value) => setProposal((current) => ({ ...current, priority: value as "low" | "medium" | "high" }))} disabled={busy || readOnly}><SelectTrigger id={`priority-${task.id}`} className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["low", "medium", "high"].map((priority) => <SelectItem key={priority} value={priority}>{t(`priority.${priority}`)}</SelectItem>)}</SelectContent></Select></div>
          <p className="border-l-2 border-violet-500/30 pl-3 text-xs leading-5 text-zinc-500">{task.proposal.rationale}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="font-medium leading-snug text-zinc-900 dark:text-zinc-100">{task.proposal.title}</h4>
            <p className={`mt-1 text-xs font-medium ${PRIORITY_TONES[task.proposal.priority] ?? PRIORITY_TONES.low}`}>{t("taskPriority")}: {t(`priority.${task.proposal.priority}`)}</p>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600 dark:text-zinc-400">{task.proposal.description}</p>
          <ul className="space-y-1.5 text-sm leading-5 text-zinc-600 dark:text-zinc-400">
            {task.proposal.acceptanceCriteria.map((item, index) => <li key={index} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-zinc-400" aria-hidden /><span>{item}</span></li>)}
          </ul>
          {task.rejectionReason && <p className="rounded-lg bg-zinc-500/10 px-3 py-2 text-xs leading-5 text-zinc-500">{t("rejectionReason")}: {task.rejectionReason}</p>}
        </div>
      )}

      {errorText && <p role="alert" className="mt-3 text-sm leading-5 text-amber-700 dark:text-amber-300">{errorText}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {proposed && <Button size="sm" disabled={readOnly || busy || !valid} onClick={() => { setError(null); setAction("approve") }}><Check className="size-3.5" />{t("approveTask")}</Button>}
        {["proposed", "approved"].includes(task.status) && <Button size="sm" variant="outline" disabled={readOnly || busy} onClick={() => { setError(null); setAction("reject") }}><X className="size-3.5" />{t("rejectTask")}</Button>}
        {task.status === "approved" && <Button size="sm" disabled={readOnly || busy} onClick={() => { setError(null); setAction("publish") }}>{t("publishTask")}</Button>}
        {settling && <Button size="sm" variant="outline" disabled={readOnly || busy} onClick={() => void submit("reconcile")}>{busy && <Loader2 className="size-3.5 animate-spin" />}{t("checkIssue")}</Button>}
        {task.githubIssueUrl && <Button asChild size="sm" variant="outline"><a href={task.githubIssueUrl} target="_blank" rel="noreferrer">{t("openIssue")}<ExternalLink className="size-3.5" /></a></Button>}
        {task.status === "published" && !codexRequested && <Button size="sm" disabled={readOnly || busy || !codexConfigured} onClick={() => { setError(null); setAction("codex") }}><Play className="size-3.5" />{t("sendCodex")}</Button>}
        {codexRequested && task.githubRepository && <Button asChild size="sm" variant="outline"><a href={`https://github.com/${task.githubRepository}/actions`} target="_blank" rel="noreferrer">{t("viewCodexRun")}<ExternalLink className="size-3.5" /></a></Button>}
      </div>

      {task.status === "approved" && <p className="mt-3 text-xs leading-5 text-zinc-500">{t("publishHelp")}</p>}
      {settling && <p role="status" className="mt-3 text-xs leading-5 text-amber-700 dark:text-amber-300">{t("publishUncertain")}</p>}
      {task.status === "published" && !codexConfigured && <p className="mt-3 text-xs leading-5 text-zinc-500">{t("codexSetupHelp")} <Link href="/admin/integrations/github" className="text-emerald-700 underline underline-offset-2 dark:text-emerald-300">GitHub</Link></p>}
      {codexRequested && <p role="status" className="mt-3 text-xs leading-5 text-zinc-500">{task.codexStatus === "dispatched" ? t("codexDispatched") : t("codexUncertain")}</p>}

      <AlertDialog open={!!action} onOpenChange={(open) => { if (!open && !busy) setAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{action ? t(`confirm.${action}.title`) : ""}</AlertDialogTitle><AlertDialogDescription>{action ? t(`confirm.${action}.description`) : ""}</AlertDialogDescription></AlertDialogHeader>
          {action === "reject" && <div className="space-y-2"><Label htmlFor={`reject-${task.id}`}>{t("rejectionReason")}</Label><Textarea id={`reject-${task.id}`} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} disabled={busy} aria-invalid={invalid && !reason.trim()} />{invalid && !reason.trim() && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{t("reasonRequired")}</p>}</div>}
          {errorText && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{errorText}</p>}
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel><Button className="min-w-32" disabled={busy} onClick={() => action && void submit(action)}>{busy && <Loader2 className="size-4 animate-spin" />}{action ? t(`confirm.${action}.action`) : ""}</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
