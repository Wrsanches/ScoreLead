"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw,
  Loader2,
  Copy,
  Check,
  FileText,
  X,
  Handshake,
  Lightbulb,
  Send,
  Mail,
  MessageCircle,
  Smartphone,
} from "lucide-react"
import { toast } from "sonner"
import { AiOrb } from "@/components/ai-orb"

export interface OutreachMessage {
  step: number
  label: string
  subject?: string
  body: string
}

interface OutreachMessagesCardProps {
  leadId: string
  /** Pre-loaded messages from the parent — avoids a second fetch on mount. */
  initialMessages?: OutreachMessage[] | null
  /** Optional callback so the parent can keep its local lead state in sync. */
  onMessagesChange?: (messages: OutreachMessage[]) => void
  /** Recipient contact info — enables one-click send actions when provided. */
  contact?: {
    email?: string | null
    phone?: string | null
  }
}

// Per-step visual config: icon + colors + connecting line gradient.
const STEP_CONFIGS = [
  {
    icon: Handshake,
    border: "border-sky-500/25",
    bg: "bg-sky-500/[0.04]",
    iconBg: "bg-sky-500/15 ring-sky-500/30",
    iconText: "text-sky-300",
    chipBg: "bg-sky-500/15",
    chipText: "text-sky-200",
    line: "from-sky-500/40 via-sky-500/20 to-violet-500/30",
  },
  {
    icon: Lightbulb,
    border: "border-violet-500/25",
    bg: "bg-violet-500/[0.04]",
    iconBg: "bg-violet-500/15 ring-violet-500/30",
    iconText: "text-violet-300",
    chipBg: "bg-violet-500/15",
    chipText: "text-violet-200",
    line: "from-violet-500/40 via-violet-500/20 to-emerald-500/30",
  },
  {
    icon: Send,
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/[0.04]",
    iconBg: "bg-emerald-500/15 ring-emerald-500/30",
    iconText: "text-emerald-300",
    chipBg: "bg-emerald-500/15",
    chipText: "text-emerald-200",
    line: "",
  },
] as const

export function OutreachMessagesCard({
  leadId,
  initialMessages,
  onMessagesChange,
  contact,
}: OutreachMessagesCardProps) {
  const t = useTranslations("outreach")
  const [messages, setMessages] = useState<OutreachMessage[]>(initialMessages ?? [])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(initialMessages === undefined)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState(false)

  const hasMessages = messages.length > 0

  // Reset when lead changes
  useEffect(() => {
    if (initialMessages !== undefined) {
      setMessages(initialMessages ?? [])
      setInitialLoading(false)
      setEditingIdx(null)
      setCopiedIdx(null)
    }
  }, [initialMessages, leadId])

  // Fallback fetch
  const loadSaved = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/messages`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.messages)) {
          setMessages(data.messages)
        }
      }
    } catch {
      /* ignore */
    }
    setInitialLoading(false)
  }, [leadId])

  useEffect(() => {
    if (initialMessages === undefined) loadSaved()
  }, [initialMessages, loadSaved])

  const generate = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/messages`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
        onMessagesChange?.(data.messages)
        toast.success(t("toastGenerated"))
      } else {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error || t("toastGenerateError"))
      }
    } catch {
      toast.error(t("toastGenerateError"))
    }
    setLoading(false)
  }, [leadId, onMessagesChange, t])

  const handleCopy = useCallback(
    (body: string, idx: number) => {
      navigator.clipboard.writeText(body)
      setCopiedIdx(idx)
      toast.success(t("toastCopied"))
      setTimeout(() => setCopiedIdx((v) => (v === idx ? null : v)), 2000)
    },
    [t],
  )

  const startEditing = useCallback(
    (idx: number) => {
      setEditingIdx(idx)
      setEditValue(messages[idx].body)
    },
    [messages],
  )

  const cancelEditing = useCallback(() => {
    setEditingIdx(null)
    setEditValue("")
  }, [])

  const saveEdit = useCallback(async () => {
    if (editingIdx === null) return
    setSaving(true)
    const updated = messages.map((msg, i) =>
      i === editingIdx ? { ...msg, body: editValue } : msg,
    )
    try {
      const res = await fetch(`/api/leads/${leadId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      })
      if (res.ok) {
        setMessages(updated)
        onMessagesChange?.(updated)
        setEditingIdx(null)
        setEditValue("")
        toast.success(t("toastSaved"))
      } else {
        toast.error(t("toastSaveError"))
      }
    } catch {
      toast.error(t("toastSaveError"))
    }
    setSaving(false)
  }, [editingIdx, editValue, messages, leadId, onMessagesChange, t])

  // ── Loading skeleton ────────────────────────────────
  if (initialLoading) {
    return (
      <div className="mb-6 rounded-xl border border-zinc-800/70 bg-zinc-900/40 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] overflow-hidden">
        <OutreachHeader title={t("title")} subtitle="" />
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-800/70 bg-zinc-900/40 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] overflow-hidden">
      {/* Header with subtle emerald glow */}
      <OutreachHeader
        title={t("title")}
        subtitle={
          hasMessages
            ? `${messages.length} ${messages.length === 1 ? "message" : "messages"}`
            : t("emptyTitle")
        }
      >
        {hasMessages && (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-zinc-300 hover:text-white rounded-md bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all duration-150 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {loading ? t("generating") : t("regenerate")}
          </button>
        )}
      </OutreachHeader>

      <div className="p-5">
        {/* Empty state */}
        {!hasMessages && !loading && (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            cta={t("generate")}
            onGenerate={generate}
          />
        )}

        {/* Generating state */}
        {loading && !hasMessages && <GeneratingState text={t("creatingDescription")} />}

        {/* Timeline of messages */}
        {hasMessages && !loading && (
          <div className="relative">
            <AnimatePresence>
              {messages.map((msg, idx) => {
                const cfg = STEP_CONFIGS[idx] || STEP_CONFIGS[0]
                const isEditing = editingIdx === idx
                const isCopied = copiedIdx === idx
                const isLast = idx === messages.length - 1
                const Icon = cfg.icon

                return (
                  <motion.div
                    key={msg.step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.12,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="relative flex gap-4 pb-4 last:pb-0"
                  >
                    {/* Left rail: step icon + connecting line */}
                    <div className="relative flex flex-col items-center shrink-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${cfg.iconBg} ${cfg.iconText} shadow-lg shadow-black/20`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-px flex-1 min-h-4 mt-1.5 bg-gradient-to-b ${cfg.line}`}
                        />
                      )}
                    </div>

                    {/* Message card */}
                    <div
                      className={`group flex-1 rounded-xl border overflow-hidden transition-colors ${cfg.border} ${cfg.bg}`}
                    >
                      {/* Card header */}
                      <div className="px-4 py-2.5 flex items-center justify-between gap-2 border-b border-zinc-800/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.chipBg} ${cfg.chipText} tabular-nums`}
                          >
                            {msg.step}
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
                            {msg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {isEditing ? null : (
                            <>
                              <IconButton
                                icon={FileText}
                                label={t("edit")}
                                onClick={() => startEditing(idx)}
                                hoverReveal
                              />
                              <IconButton
                                icon={isCopied ? Check : Copy}
                                label={isCopied ? t("copied") : t("copy")}
                                onClick={() => handleCopy(msg.body, idx)}
                                active={isCopied}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      {isEditing ? (
                        <div className="p-3">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault()
                                saveEdit()
                              }
                              if (e.key === "Escape") cancelEditing()
                            }}
                            rows={6}
                            className="w-full resize-none rounded-lg bg-zinc-900/80 border border-zinc-800/80 px-3 py-2.5 text-sm text-zinc-100 leading-relaxed placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
                            autoFocus
                          />
                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center gap-2 text-[11px] text-zinc-600 tabular-nums">
                              <span>{editValue.length}</span>
                              <span className="hidden sm:inline text-zinc-700">·</span>
                              <span className="hidden sm:inline text-zinc-700">
                                <kbd className="px-1 py-0.5 bg-zinc-800/60 rounded text-[10px]">
                                  ⌘
                                </kbd>{" "}
                                <kbd className="px-1 py-0.5 bg-zinc-800/60 rounded text-[10px]">
                                  ↵
                                </kbd>{" "}
                                to save
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={cancelEditing}
                                disabled={saving}
                                className="flex items-center gap-1 h-7 px-2.5 text-xs text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                {t("cancel")}
                              </button>
                              <button
                                type="button"
                                onClick={saveEdit}
                                disabled={saving}
                                className="flex items-center gap-1 h-7 px-2.5 text-xs font-medium text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors disabled:opacity-50"
                              >
                                {saving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                {t("save")}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-zinc-200">
                            {msg.body}
                          </p>

                          {/* Footer: char count + quick send */}
                          <SendActions
                            body={msg.body}
                            contact={contact}
                            charCount={msg.body.length}
                          />
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────

/**
 * The real `AiOrb` scaled down to an icon-sized slot. AiOrb's smallest preset
 * is 80px (size="sm"); we scale it to fit any target size while keeping all
 * its internal wave animations and glow layers intact.
 */
function OrbIcon({ size = 32, state = "idle" as const }: { size?: number; state?: "idle" | "active" | "processing" }) {
  const NATIVE = 80 // w-20 h-20, AiOrb size="sm"
  const scale = size / NATIVE
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <AiOrb size="sm" state={state} />
      </div>
    </div>
  )
}

function OutreachHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="relative px-5 py-4 border-b border-zinc-800/60 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.06] via-transparent to-transparent pointer-events-none"
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <OrbIcon size={32} />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span className="truncate">{title}</span>
              <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded uppercase tracking-wider ring-1 ring-emerald-500/30 shrink-0">
                AI
              </span>
            </h4>
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function EmptyState({
  title,
  description,
  cta,
  onGenerate,
}: {
  title: string
  description: string
  cta: string
  onGenerate: () => void
}) {
  return (
    <div className="relative py-10 flex flex-col items-center justify-center text-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_60%)] pointer-events-none"
      />
      <div className="relative flex flex-col items-center">
        <div className="mb-5">
          <OrbIcon size={56} />
        </div>
        <p className="text-sm font-semibold text-zinc-100 mb-1">{title}</p>
        <p className="text-xs text-zinc-500 mb-5 max-w-80 leading-relaxed">{description}</p>
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex items-center gap-2 h-9 px-5 text-sm font-medium text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all duration-150 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
        >
          {cta}
        </button>
      </div>
    </div>
  )
}

function GeneratingState({ text }: { text: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
      </div>
      <p className="text-sm text-zinc-400">{text}</p>
    </div>
  )
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  active,
  hoverReveal,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  active?: boolean
  hoverReveal?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-md transition-all duration-150 ${
        active
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-zinc-500 hover:text-white hover:bg-zinc-800/70"
      } ${hoverReveal ? "opacity-0 group-hover:opacity-100 focus:opacity-100" : ""}`}
      title={label}
    >
      <Icon className="w-3 h-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function SendActions({
  body,
  contact,
  charCount,
}: {
  body: string
  contact?: { email?: string | null; phone?: string | null }
  charCount: number
}) {
  const encoded = encodeURIComponent(body)
  const actions: { label: string; href: string; icon: React.ElementType }[] = []

  if (contact?.email) {
    actions.push({
      label: "Email",
      href: `mailto:${contact.email}?body=${encoded}`,
      icon: Mail,
    })
  }
  if (contact?.phone) {
    const digits = contact.phone.replace(/\D/g, "")
    if (digits) {
      actions.push({
        label: "WhatsApp",
        href: `https://wa.me/${digits}?text=${encoded}`,
        icon: MessageCircle,
      })
    }
    actions.push({
      label: "SMS",
      href: `sms:${contact.phone}?body=${encoded}`,
      icon: Smartphone,
    })
  }

  return (
    <div className="px-4 py-2 border-t border-zinc-800/50 flex items-center justify-between gap-2 bg-zinc-950/30">
      <span className="text-[10px] text-zinc-600 tabular-nums">{charCount}</span>
      {actions.length > 0 && (
        <div className="flex items-center gap-1">
          {actions.map((a) => {
            const A = a.icon
            return (
              <a
                key={a.label}
                href={a.href}
                target={a.href.startsWith("http") ? "_blank" : undefined}
                rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center gap-1 h-6 px-2 text-[11px] font-medium text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700 transition-all duration-150"
                title={`Send via ${a.label}`}
              >
                <A className="w-3 h-3" />
                <span className="hidden sm:inline">{a.label}</span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
