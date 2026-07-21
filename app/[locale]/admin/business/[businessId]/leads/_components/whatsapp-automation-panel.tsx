"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCheck,
  Clock3,
  ExternalLink,
  Loader2,
  MessageCircle,
  Pause,
  Send,
  ShieldCheck,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePlan } from "@/components/admin/plan-context"

type Consent = {
  id: string
  phoneE164: string
  status: "granted" | "revoked"
  source: string
  capturedAt: string
}

type Template = {
  id: string
  name: string
  language: string
  components: Array<{ type: string; text?: string }>
}

type SequenceStep = {
  id: string
  position: number
  offsetDays: number
  localSendTime: string
  scheduledAt: string
  status: string
  templateName: string
  templateLanguage: string
  renderedBody: string
  errorMessage?: string | null
  acceptedAt?: string | null
  sentAt?: string | null
  deliveredAt?: string | null
  readAt?: string | null
  failedAt?: string | null
}

type Sequence = {
  id: string
  status: string
  recipientPhone: string
  timezone: string
  pauseReason?: string | null
  approvedAt?: string | null
  steps: SequenceStep[]
  lastReply?: { textBody?: string | null; receivedAt: string } | null
}

const DEFAULT_STEPS = [
  { templateId: "", offsetDays: 0, localSendTime: "10:00" },
  { templateId: "", offsetDays: 3, localSendTime: "10:00" },
  { templateId: "", offsetDays: 7, localSendTime: "10:00" },
]

function suggestedE164(phone?: string | null): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  return digits ? `+${digits}` : ""
}

export function WhatsAppAutomationPanel({
  businessId,
  leadId,
  phone,
}: {
  businessId: string
  leadId: string
  phone?: string | null
}) {
  const t = useTranslations("whatsapp")
  const { isPro, openUpgrade } = usePlan()
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [consent, setConsent] = useState<Consent | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [phoneE164, setPhoneE164] = useState(suggestedE164(phone))
  const [source, setSource] = useState("written")
  const [capturedAt, setCapturedAt] = useState(() => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toISOString().slice(0, 16)
  })
  const [evidenceNote, setEvidenceNote] = useState("")
  const [attested, setAttested] = useState(false)
  const [savingConsent, setSavingConsent] = useState(false)
  const [draftSteps, setDraftSteps] = useState(DEFAULT_STEPS)
  const [previewing, setPreviewing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const activeSequence = useMemo(
    () => sequences.find((sequence) => ["draft", "scheduled", "paused"].includes(sequence.status)) ?? null,
    [sequences],
  )

  const load = useCallback(async (quiet = false) => {
    try {
      const [connectionResponse, consentResponse, sequenceResponse] = await Promise.all([
        fetch(`/api/businesses/${businessId}/whatsapp/connection`),
        fetch(`/api/leads/${leadId}/whatsapp/consent`),
        fetch(`/api/leads/${leadId}/whatsapp/sequences`),
      ])
      const connectionBody = await connectionResponse.json().catch(() => ({}))
      const consentBody = await consentResponse.json().catch(() => ({}))
      const sequenceBody = await sequenceResponse.json().catch(() => ({}))
      const isConnected = connectionBody.connection?.status === "connected"
      setConnected(isConnected)
      setConsent(consentBody.consent ?? null)
      setSequences(sequenceBody.sequences ?? [])
      if (isConnected && isPro) {
        const templatesResponse = await fetch(`/api/businesses/${businessId}/whatsapp/templates`)
        if (templatesResponse.ok) {
          const templateBody = await templatesResponse.json()
          setTemplates(templateBody.templates ?? [])
        }
      }
    } catch {
      if (!quiet) toast.error(t("automationLoadError"))
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [businessId, isPro, leadId, t])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (activeSequence?.status !== "scheduled") return
    const interval = window.setInterval(() => void load(true), 15_000)
    return () => window.clearInterval(interval)
  }, [activeSequence?.status, load])

  async function grantConsent() {
    setSavingConsent(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/whatsapp/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneE164,
          source,
          capturedAt: new Date(capturedAt).toISOString(),
          evidenceNote: evidenceNote || null,
          attested,
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || t("consentSaveError"))
      setConsent(body.consent)
      toast.success(t("consentSaved"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("consentSaveError"))
    } finally {
      setSavingConsent(false)
    }
  }

  async function revokeConsent() {
    try {
      const response = await fetch(`/api/leads/${leadId}/whatsapp/consent/revoke`, { method: "POST" })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || t("consentRevokeError"))
      setConsent(body.consent)
      await load(true)
      toast.success(t("consentRevoked"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("consentRevokeError"))
    }
  }

  async function createPreview() {
    if (draftSteps.some((step) => !step.templateId)) {
      toast.error(t("selectTemplatesError"))
      return
    }
    setPreviewing(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/whatsapp/sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: draftSteps }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || t("previewError"))
      await load(true)
      toast.success(t("previewReady"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("previewError"))
    } finally {
      setPreviewing(false)
    }
  }

  async function approveSequence() {
    if (!activeSequence) return
    setApproving(true)
    try {
      const response = await fetch(
        `/api/leads/${leadId}/whatsapp/sequences/${activeSequence.id}/approve`,
        { method: "POST" },
      )
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || t("approveError"))
      await load(true)
      toast.success(t("sequenceApproved"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("approveError"))
    } finally {
      setApproving(false)
    }
  }

  async function cancelSequence() {
    if (!activeSequence) return
    setCancelling(true)
    try {
      const response = await fetch(
        `/api/leads/${leadId}/whatsapp/sequences/${activeSequence.id}/cancel`,
        { method: "POST" },
      )
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || t("cancelSequenceError"))
      await load(true)
      toast.success(t("sequenceCancelled"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("cancelSequenceError"))
    } finally {
      setCancelling(false)
    }
  }

  function updateStep(index: number, patch: Partial<(typeof draftSteps)[number]>) {
    setDraftSteps((current) => current.map((step, stepIndex) =>
      stepIndex === index ? { ...step, ...patch } : step,
    ))
  }

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loadingAutomation")}
      </div>
    )
  }

  return (
    <section className="mt-7 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{t("automationTitle")}</h4>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500">{t("automationDescription")}</p>
          </div>
        </div>
        {consent?.status === "granted" && (
          <button type="button" onClick={revokeConsent} className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400">
            {t("revokeConsent")}
          </button>
        )}
      </div>

      {!isPro ? (
        <Notice icon={ShieldCheck} text={t("proRequired")}>
          <Button size="sm" onClick={openUpgrade}>{t("upgradeButton")}</Button>
        </Notice>
      ) : !connected ? (
        <Notice icon={ExternalLink} text={t("connectionRequired")}>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/business/${businessId}/integrations`}>{t("openIntegrations")}</Link>
          </Button>
        </Notice>
      ) : consent?.status !== "granted" ? (
        <div className="mt-6 grid gap-5 rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/30 sm:grid-cols-2">
          <div>
            <Label htmlFor={`wa-phone-${leadId}`}>{t("consentPhone")}</Label>
            <Input
              id={`wa-phone-${leadId}`}
              className="mt-2"
              value={phoneE164}
              onChange={(event) => setPhoneE164(event.target.value)}
              placeholder="+5511999999999"
              inputMode="tel"
            />
          </div>
          <div>
            <Label htmlFor={`wa-source-${leadId}`}>{t("consentSource")}</Label>
            <select
              id={`wa-source-${leadId}`}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="mt-2 h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {["website_form", "written", "verbal", "qr_code", "other"].map((value) => (
                <option key={value} value={value}>{t(`source_${value}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor={`wa-captured-${leadId}`}>{t("capturedAt")}</Label>
            <Input
              id={`wa-captured-${leadId}`}
              type="datetime-local"
              className="mt-2"
              value={capturedAt}
              onChange={(event) => setCapturedAt(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`wa-evidence-${leadId}`}>{t("evidenceNote")}</Label>
            <Input
              id={`wa-evidence-${leadId}`}
              className="mt-2"
              value={evidenceNote}
              onChange={(event) => setEvidenceNote(event.target.value)}
              placeholder={t("evidencePlaceholder")}
            />
          </div>
          <label className="flex items-start gap-2.5 text-xs leading-5 text-zinc-600 dark:text-zinc-400 sm:col-span-2">
            <input
              type="checkbox"
              checked={attested}
              onChange={(event) => setAttested(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            {t("consentAttestation")}
          </label>
          <div className="sm:col-span-2">
            <Button size="sm" onClick={grantConsent} disabled={!attested || savingConsent}>
              {savingConsent ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {t("recordConsent")}
            </Button>
          </div>
        </div>
      ) : activeSequence ? (
        <SequenceView
          sequence={activeSequence}
          approving={approving}
          cancelling={cancelling}
          onApprove={approveSequence}
          onCancel={cancelSequence}
        />
      ) : templates.length === 0 ? (
        <Notice icon={AlertCircle} text={t("noTemplates")}>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/business/${businessId}/integrations`}>{t("syncTemplates")}</Link>
          </Button>
        </Notice>
      ) : (
        <div className="mt-6 space-y-3">
          {draftSteps.map((step, index) => (
            <div key={index} className="grid gap-3 border-b border-zinc-200 py-4 first:pt-0 last:border-0 dark:border-zinc-800 sm:grid-cols-[2rem_minmax(0,1fr)_6rem_7rem] sm:items-end">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {index + 1}
              </span>
              <div>
                <Label htmlFor={`wa-template-${leadId}-${index}`}>{t("template")}</Label>
                <select
                  id={`wa-template-${leadId}-${index}`}
                  value={step.templateId}
                  onChange={(event) => updateStep(index, { templateId: event.target.value })}
                  className="mt-2 h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="">{t("chooseTemplate")}</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name} · {template.language}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor={`wa-delay-${leadId}-${index}`}>{t("dayOffset")}</Label>
                <Input
                  id={`wa-delay-${leadId}-${index}`}
                  type="number"
                  min={index === 0 ? 0 : draftSteps[index - 1].offsetDays}
                  max={30}
                  className="mt-2"
                  value={step.offsetDays}
                  onChange={(event) => updateStep(index, { offsetDays: Number(event.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`wa-time-${leadId}-${index}`}>{t("sendTime")}</Label>
                <Input
                  id={`wa-time-${leadId}-${index}`}
                  type="time"
                  className="mt-2"
                  value={step.localSendTime}
                  onChange={(event) => updateStep(index, { localSendTime: event.target.value })}
                />
              </div>
            </div>
          ))}
          <Button size="sm" onClick={createPreview} disabled={previewing}>
            {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            {previewing ? t("creatingPreview") : t("previewSequence")}
          </Button>
        </div>
      )}
    </section>
  )
}

function Notice({
  icon: Icon,
  text,
  children,
}: {
  icon: React.ElementType
  text: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 rounded-lg bg-zinc-100/70 p-4 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
        <Icon className="h-4 w-4 shrink-0" />
        {text}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SequenceView({
  sequence,
  approving,
  cancelling,
  onApprove,
  onCancel,
}: {
  sequence: Sequence
  approving: boolean
  cancelling: boolean
  onApprove: () => void
  onCancel: () => void
}) {
  const t = useTranslations("whatsapp")
  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusIcon status={sequence.status} />
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t(`sequence_${sequence.status}`)}</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{sequence.recipientPhone} · {sequence.timezone}</p>
        </div>
        <div className="flex gap-2">
          {sequence.status === "draft" && (
            <Button size="sm" onClick={onApprove} disabled={approving}>
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("approveSequence")}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onCancel} disabled={cancelling}>
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            {t("cancelSequence")}
          </Button>
        </div>
      </div>

      {sequence.lastReply && (
        <div className="mb-4 rounded-lg bg-emerald-500/8 px-4 py-3 text-xs leading-5 text-emerald-900 dark:text-emerald-100">
          <span className="font-semibold">{t("latestReply")}</span>{" "}
          {sequence.lastReply.textBody || t("nonTextReply")}
        </div>
      )}
      {sequence.pauseReason && sequence.status !== "draft" && (
        <p className="mb-4 text-xs text-amber-700 dark:text-amber-300">{t("pausedReason", { reason: sequence.pauseReason })}</p>
      )}

      <div className="space-y-3">
        {sequence.steps.map((step) => (
          <div key={step.id} className="grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {t("stepLabel", { step: step.position })} · {step.templateName}
                </span>
                <StepStatus status={step.status} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-200">{step.renderedBody}</p>
              <StepTimeline step={step} />
              {step.errorMessage && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{step.errorMessage}</p>}
            </div>
            <div className="text-left text-[11px] tabular-nums text-zinc-500 sm:text-right">
              <p>{t("dayValue", { day: step.offsetDays })}</p>
              <p className="mt-1">{new Date(step.scheduledAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepTimeline({ step }: { step: SequenceStep }) {
  const t = useTranslations("whatsapp")
  const events = [
    { label: t("timelineScheduled"), at: step.scheduledAt },
    { label: t("timelineAccepted"), at: step.acceptedAt },
    { label: t("timelineSent"), at: step.sentAt },
    { label: t("timelineDelivered"), at: step.deliveredAt },
    { label: t("timelineRead"), at: step.readAt },
    { label: t("timelineFailed"), at: step.failedAt },
  ].filter((event): event is { label: string; at: string } => !!event.at)
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-100 pt-2 text-[10px] text-zinc-500 dark:border-zinc-800">
      {events.map((event) => (
        <span key={event.label}>{event.label} {new Date(event.at).toLocaleString()}</span>
      ))}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "scheduled") return <Clock3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  if (status === "paused") return <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  if (status === "completed") return <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
  return <ShieldCheck className="h-4 w-4 text-zinc-500" />
}

function StepStatus({ status }: { status: string }) {
  const Icon = status === "read" || status === "delivered"
    ? CheckCheck
    : status === "failed" || status === "blocked" || status === "needs_review"
      ? AlertCircle
      : status === "sent" || status === "accepted"
        ? Check
        : Clock3
  const tone = status === "failed" || status === "blocked" || status === "needs_review"
    ? "text-red-600 dark:text-red-400"
    : status === "read" || status === "delivered"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-zinc-500"
  return <Icon className={`h-3.5 w-3.5 ${tone}`} aria-label={status} />
}
