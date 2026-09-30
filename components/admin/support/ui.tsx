"use client"
import type { ElementType, ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Bug, CircleHelp, LifeBuoy, Lightbulb, MessageSquare, Phone } from "lucide-react"
import { getInitials } from "@/lib/admin-utils"

// Classification tones map to the SectionCard accent palette so the inbox
// speaks the same colour language as the rest of the admin. Emerald is kept
// out of this map on purpose: it marks "needs you" (pending) and nothing else.
const CLASSIFICATIONS: Record<string, { icon: ElementType; tone: string }> = {
  question: { icon: CircleHelp, tone: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300" },
  support: { icon: LifeBuoy, tone: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300" },
  bug: { icon: Bug, tone: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300" },
  feature: { icon: Lightbulb, tone: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300" },
  other: { icon: MessageSquare, tone: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300" },
}

export function ClassificationChip({ value, size = "sm" }: { value: string | null; size?: "sm" | "md" }) {
  const t = useTranslations("supportInbox")
  if (!value) return null
  const { icon: Icon, tone } = CLASSIFICATIONS[value in CLASSIFICATIONS ? value : "other"]
  const label = t.has(`classification.${value}`) ? t(`classification.${value}`) : t("classification.other")
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ${tone} ${size === "md" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"}`}>
      <Icon className={size === "md" ? "size-3.5" : "size-3"} aria-hidden />
      {label}
    </span>
  )
}

export function ContactAvatar({ name, className = "size-9 text-xs" }: { name: string | null; className?: string }) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-zinc-200/80 font-semibold text-zinc-600 ring-1 ring-zinc-300/60 dark:bg-white/[0.08] dark:text-zinc-300 dark:ring-white/[0.08] ${className}`}>
      {name ? getInitials(name) : <Phone className="size-[42%]" />}
    </span>
  )
}

/** Amber notice used for recoverable problems. Children may include actions. */
export function Note({ role, className = "", children }: { role?: "alert" | "status"; className?: string; children: ReactNode }) {
  return (
    <div role={role} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-amber-500/10 px-3.5 py-3 text-sm leading-5 text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-200 ${className}`}>
      {children}
    </div>
  )
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Time for today, month and day for this year, short date otherwise. */
export function formatListTime(iso: string, locale: string): string {
  const date = new Date(iso)
  const now = new Date()
  if (sameDay(date, now)) return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date)
  if (date.getFullYear() === now.getFullYear()) return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date)
  return new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(date)
}

export function dayKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function formatDayLabel(iso: string, locale: string, labels: { today: string; yesterday: string }): string {
  const date = new Date(iso)
  const now = new Date()
  if (sameDay(date, now)) return labels.today
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return labels.yesterday
  return new Intl.DateTimeFormat(locale, {
    weekday: "short", month: "short", day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  }).format(date)
}
