"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MailCheck,
  MailOpen,
  MailWarning,
  MousePointerClick,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { usePlan } from "@/components/admin/plan-context"
import { useResendConnection } from "@/components/admin/resend/use-resend-connection"
import { readJson, resendErrorMessage } from "@/components/admin/resend/errors"
import { isResendIntegrationEnabled } from "@/lib/resend/feature-access"
import type { PublicEmailMessage } from "@/lib/resend/data"
import type { EmailMessageStatus } from "@/lib/db/schema"

type TemplateOption = { id: string; name: string; subject: string }
type MessageView = Omit<PublicEmailMessage, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string }
type Preview = { subject: string; html: string; to: string; from: string }

const TERMINAL: ReadonlySet<string> = new Set(["bounced", "complained", "failed", "delivered", "opened", "clicked"])

const STATUS_STYLE: Record<EmailMessageStatus, { icon: typeof Mail; className: string }> = {
  sending: { icon: Loader2, className: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400" },
  accepted: { icon: Mail, className: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300" },
  sent: { icon: Send, className: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300" },
  delivered: { icon: MailCheck, className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" },
  opened: { icon: MailOpen, className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" },
  clicked: { icon: MousePointerClick, className: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-200" },
  delivery_delayed: { icon: AlertCircle, className: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300" },
  bounced: { icon: MailWarning, className: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300" },
  complained: { icon: MailWarning, className: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300" },
  failed: { icon: AlertCircle, className: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300" },
}

const SELECT =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm text-zinc-900 dark:text-white"

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-7 border-t border-zinc-200 pt-6 dark:border-white/[0.08]">
      {children}
    </section>
  )
}

function Heading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-white/[0.07] dark:text-zinc-300">
        <Mail className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h4>
        {hint && <p className="mt-1 text-xs leading-5 text-zinc-500">{hint}</p>}
      </div>
    </div>
  )
}

/** Gated state row: an icon, one line of explanation, and the single action that unblocks it. */
function Notice({ icon: Icon, text, children }: { icon: React.ElementType; text: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-lg bg-zinc-100/70 p-4 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
        <Icon className="h-4 w-4 shrink-0" />
        {text}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/**
 * Lead-level email sending through the business's Resend account: pick a
 * recipient and a template, preview the rendered mail, send, and follow the
 * delivery timeline that webhooks fill in.
 */
export function EmailOutreachPanel({
  businessId,
  leadId,
  recipients,
}: {
  businessId: string
  leadId: string
  recipients: string[]
}) {
  const t = useTranslations("resend")
  const { can: planCan, openUpgrade } = usePlan()
  const enabled = isResendIntegrationEnabled()
  const canUse = planCan("emailOutreach")
  const { data, loading: connectionLoading } = useResendConnection(businessId, enabled && canUse)
  const connection = data?.connection ?? null
  const connected = connection?.status === "connected"

  const [templates, setTemplates] = useState<TemplateOption[] | null>(null)
  const [messages, setMessages] = useState<MessageView[] | null>(null)
  const [to, setTo] = useState(recipients[0] ?? "")
  const [templateId, setTemplateId] = useState("")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!recipients.includes(to)) setTo(recipients[0] ?? "")
  }, [recipients, to])

  const loadMessages = useCallback(async () => {
    const response = await fetch(`/api/leads/${leadId}/email/messages`)
    const body = await readJson<{ messages?: MessageView[] }>(response)
    if (response.ok) setMessages(body?.messages ?? [])
  }, [leadId])

  useEffect(() => {
    if (!enabled || !canUse || !connected) return
    const controller = new AbortController()
    fetch(`/api/businesses/${businessId}/resend/templates`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((body) => {
        const list: TemplateOption[] = (body.templates ?? []).map((row: TemplateOption) => ({ id: row.id, name: row.name, subject: row.subject }))
        setTemplates(list)
        setTemplateId((current) => current || list[0]?.id || "")
      })
      .catch(() => setTemplates([]))
    void loadMessages()
    return () => controller.abort()
  }, [businessId, enabled, canUse, connected, loadMessages])

  // Keep the timeline fresh while a recent message is still in flight.
  const hasInFlight = useMemo(() => {
    if (!messages) return false
    const cutoff = Date.now() - 10 * 60_000
    return messages.some((m) => !TERMINAL.has(m.status) && new Date(m.createdAt).getTime() > cutoff)
  }, [messages])
  useEffect(() => {
    if (!hasInFlight) return
    const handle = setInterval(() => void loadMessages(), 15_000)
    const onFocus = () => void loadMessages()
    window.addEventListener("focus", onFocus)
    return () => {
      clearInterval(handle)
      window.removeEventListener("focus", onFocus)
    }
  }, [hasInFlight, loadMessages])

  useEffect(() => {
    setPreview(null)
  }, [templateId, to])

  async function loadPreview() {
    if (!templateId) return
    setPreviewing(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/email/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, to }),
      })
      const body = await readJson<Preview & { error?: string; code?: string }>(response)
      if (!response.ok || !body) {
        toast.error(resendErrorMessage(t, body, "previewError"))
        return
      }
      setPreview(body)
      setShowPreview(true)
    } catch {
      toast.error(t("previewError"))
    } finally {
      setPreviewing(false)
    }
  }

  async function send() {
    setSending(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, to }),
      })
      const body = await readJson<{ message?: MessageView; error?: string; code?: string; action?: string }>(response)
      if (response.status === 402) {
        openUpgrade("emailOutreach")
        return
      }
      if (!response.ok || !body?.message) {
        toast.error(resendErrorMessage(t, body, "sendError"))
        return
      }
      setMessages((prev) => [body.message!, ...(prev ?? [])])
      toast.success(t("sentToast"))
      setConfirmOpen(false)
      setShowPreview(false)
    } catch {
      toast.error(t("sendError"))
    } finally {
      setSending(false)
    }
  }

  async function refresh() {
    setRefreshing(true)
    try {
      await loadMessages()
    } finally {
      setRefreshing(false)
    }
  }

  if (!enabled) return null
  if (!canUse) {
    return (
      <Shell>
        <Heading title={t("panelTitle")} hint={t("panelIntro")} />
        <Notice icon={ShieldCheck} text={t("planRequired")}>
          <Button size="sm" onClick={() => openUpgrade("emailOutreach")}>{t("upgradeButton")}</Button>
        </Notice>
      </Shell>
    )
  }
  if (connectionLoading && !data) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          {t("loading")}
        </div>
      </Shell>
    )
  }
  if (!connected) {
    return (
      <Shell>
        <Heading title={t("panelTitle")} hint={t("panelIntro")} />
        <Notice icon={ExternalLink} text={t("connectionRequired")}>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/integrations/resend">{t("openIntegrations")}</Link>
          </Button>
        </Notice>
      </Shell>
    )
  }

  const selectedTemplate = templates?.find((tpl) => tpl.id === templateId) ?? null

  return (
    <Shell>
      <Heading title={t("panelTitle")} hint={t("panelDescription", { from: connection.fromEmail })} />

      {recipients.length === 0 ? (
        <p className="mt-3 ml-12 text-xs text-zinc-500">{t("noRecipients")}</p>
      ) : templates && templates.length === 0 ? (
        <p className="mt-3 ml-12 text-xs text-zinc-500">
          {t("noTemplates")}{" "}
          <Link href="/admin/integrations/email-templates" className="text-emerald-700 hover:underline dark:text-emerald-300">
            {t("manageTemplates")}
          </Link>
        </p>
      ) : (
        <div className="mt-4 space-y-3 sm:ml-12">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("recipient")}</label>
              <Select value={to} onValueChange={setTo} disabled={sending}>
                <SelectTrigger className={SELECT}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map((address) => (
                    <SelectItem key={address} value={address}>
                      {address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("template")}</label>
              <Select value={templateId} onValueChange={setTemplateId} disabled={sending || !templates}>
                <SelectTrigger className={SELECT}>
                  <SelectValue placeholder={templates ? t("chooseTemplate") : t("loading")} />
                </SelectTrigger>
                <SelectContent>
                  {(templates ?? []).map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => (preview ? setShowPreview((v) => !v) : void loadPreview())} disabled={!templateId || previewing || sending}>
              {previewing ? <Loader2 className="size-3.5 animate-spin" /> : showPreview && preview ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              {showPreview && preview ? t("hidePreview") : t("preview")}
            </Button>
            <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={!templateId || !to || sending}>
              <Send className="size-3.5" />
              {t("send")}
            </Button>
          </div>

          {showPreview && preview && (
            <div className="rounded-xl border border-zinc-200 bg-white/60 p-3 dark:border-white/[0.08] dark:bg-black/25">
              <p className="truncate text-xs text-zinc-500">
                <span className="text-zinc-400">{t("previewFrom")}</span> {preview.from}
                <span className="mx-1.5 text-zinc-400 dark:text-zinc-700">/</span>
                <span className="text-zinc-400">{t("previewTo")}</span> {preview.to}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{preview.subject}</p>
              <iframe title={t("preview")} sandbox="" srcDoc={preview.html} className="mt-3 h-[360px] w-full rounded-lg border border-zinc-200 bg-white dark:border-white/[0.08]" />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 sm:ml-12">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("history")}</p>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing} aria-label={t("refresh")} className="h-7 px-2 text-zinc-500">
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {messages === null ? (
          <p className="text-xs text-zinc-500">{t("loading")}</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-zinc-500">{t("noHistory")}</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((message) => {
              const style = STATUS_STYLE[message.status] ?? STATUS_STYLE.sending
              const Icon = style.icon
              const stamps: { label: string; at: string | Date | null }[] = [
                { label: t("stampSent"), at: message.sentAt ?? message.acceptedAt },
                { label: t("stampDelivered"), at: message.deliveredAt },
                { label: t("stampOpened"), at: message.openedAt },
                { label: t("stampClicked"), at: message.clickedAt },
              ].filter((s) => s.at)
              return (
                <li key={message.id} className="rounded-xl border border-zinc-200 bg-white/60 px-3.5 py-3 dark:border-white/[0.08] dark:bg-black/25">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{message.subject}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {message.toEmail}
                        <span className="mx-1.5 text-zinc-400 dark:text-zinc-700">/</span>
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${style.className}`}>
                      <Icon className={`size-3 ${message.status === "sending" ? "animate-spin" : ""}`} aria-hidden="true" />
                      {t(`status_${message.status}`)}
                    </span>
                  </div>
                  {(stamps.length > 0 || message.openCount > 0 || message.clickCount > 0) && (
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                      {stamps.map((s) => (
                        <span key={s.label} className="inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
                          {s.label} {new Date(s.at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      ))}
                      {message.openCount > 0 && <span>{t("opens", { count: message.openCount })}</span>}
                      {message.clickCount > 0 && <span>{t("clicks", { count: message.clickCount })}</span>}
                    </p>
                  )}
                  {message.errorMessage && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{message.errorMessage}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !sending && setConfirmOpen(open)}>
        <AlertDialogContent className="glass-strong rounded-2xl border-transparent">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sendConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sendConfirmBody", {
                subject: preview?.subject ?? selectedTemplate?.subject ?? selectedTemplate?.name ?? "",
                to,
                from: connection.fromEmail,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={sending}
              onClick={(e) => {
                e.preventDefault()
                void send()
              }}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {sending ? t("sending") : t("send")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  )
}
