"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Clock, Loader2, Mail, MessageSquareText, Send } from "lucide-react"
import { authClient } from "@/lib/auth-client"

const SUPPORT_EMAIL = "hello@scorelead.io"

const INPUT =
  "w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all"

export function SupportSection() {
  const t = useTranslations("settings")
  const { data: session } = authClient.useSession()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const email = session?.user?.email ?? ""
  const name = session?.user?.name || email || "ScoreLead user"
  const canSend =
    subject.trim().length >= 3 &&
    message.trim().length >= 20 &&
    !!email &&
    !sending

  const topics = [
    t("supportTopicBilling"),
    t("supportTopicBug"),
    t("supportTopicFeature"),
    t("supportTopicOther"),
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return
    setSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: "",
          inquiryType: "support",
          subject: subject.trim(),
          message: message.trim(),
          website: "",
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("supportSent"))
      setSubject("")
      setMessage("")
    } catch {
      toast.error(t("supportFailed"))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl grid gap-5 lg:grid-cols-[1fr_18rem]">
      {/* Message form */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <MessageSquareText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </span>
          <h2 className="text-base font-medium text-zinc-900 dark:text-white">
            {t("supportFormTitle")}
          </h2>
        </div>
        <p className="text-sm text-zinc-500 mb-5">{t("supportDescription")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
              {t("supportTopicsLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => {
                const active = subject === topic
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSubject(topic)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    {topic}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
              {t("supportSubject")}
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={160}
              placeholder={t("supportSubjectPlaceholder")}
              className={INPUT}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
              {t("supportMessage")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={7}
              placeholder={t("supportMessagePlaceholder")}
              className={`${INPUT} resize-none`}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {email ? (
              <p className="text-xs text-zinc-500 min-w-0 truncate">
                {t("supportReplyTo", { email })}
              </p>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={!canSend}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? t("supportSending") : t("supportSend")}
            </button>
          </div>
        </form>
      </section>

      {/* Other ways to reach us */}
      <aside className="space-y-4">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          <span className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
            <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </span>
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
            {t("supportEmailLabel")}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200 break-all">
            {SUPPORT_EMAIL}
          </p>
        </a>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-5">
          <span className="w-9 h-9 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </span>
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
            {t("supportResponseTitle")}
          </p>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {t("supportResponseBody")}
          </p>
        </div>
      </aside>
    </div>
  )
}
