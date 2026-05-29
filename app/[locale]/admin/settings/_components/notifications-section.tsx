"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

type Preferences = {
  leadAlerts: boolean
  weeklyDigest: boolean
  productUpdates: boolean
}

const DEFAULT_PREFS: Preferences = {
  leadAlerts: true,
  weeklyDigest: true,
  productUpdates: false,
}

const ROWS: { key: keyof Preferences; labelKey: string; descKey: string }[] = [
  {
    key: "leadAlerts",
    labelKey: "leadAlerts",
    descKey: "leadAlertsDescription",
  },
  {
    key: "weeklyDigest",
    labelKey: "weeklyDigest",
    descKey: "weeklyDigestDescription",
  },
  {
    key: "productUpdates",
    labelKey: "productUpdates",
    descKey: "productUpdatesDescription",
  },
]

export function NotificationsSection() {
  const t = useTranslations("settings")
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const inFlight = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/user/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.preferences) {
          setPrefs(data.preferences as Preferences)
        } else {
          setPrefs(DEFAULT_PREFS)
        }
      })
      .catch(() => {
        if (!cancelled) setPrefs(DEFAULT_PREFS)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleToggle(key: keyof Preferences, value: boolean) {
    if (!prefs) return
    const next = { ...prefs, [key]: value }
    setPrefs(next)

    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
        signal: controller.signal,
      })
      if (!res.ok) {
        toast.error(t("saveFailed"))
        setPrefs((p) => (p ? { ...p, [key]: !value } : p))
      }
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return
      toast.error(t("saveFailed"))
      setPrefs((p) => (p ? { ...p, [key]: !value } : p))
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
        {t("notifications")}
      </h2>
      <p className="text-sm text-zinc-500 mb-6">{t("description")}</p>

      <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
        {ROWS.map((row) => (
          <li
            key={row.key}
            className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {t(row.labelKey)}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{t(row.descKey)}</p>
            </div>
            <Switch
              checked={prefs?.[row.key] ?? false}
              disabled={prefs === null}
              onCheckedChange={(v) => handleToggle(row.key, v)}
              className="mt-0.5"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
