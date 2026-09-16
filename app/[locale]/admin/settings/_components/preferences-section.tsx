"use client"

import { useMemo, useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useUserTimeZone } from "@/components/admin/user-timezone-context"
import {
  formatTimeZoneLabel,
  getDeviceTimeZone,
  getSupportedTimeZones,
} from "@/lib/timezone"
import { useRouter, usePathname } from "@/i18n/routing"
import { useParams } from "next/navigation"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PreferencesSection() {
  const t = useTranslations("settings")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [, startTransition] = useTransition()
  const { timeZone, setTimeZone } = useUserTimeZone()
  const [savingZone, setSavingZone] = useState(false)
  const deviceZone = useMemo(() => getDeviceTimeZone(), [])
  const zones = useMemo(() => {
    const list = getSupportedTimeZones()
    // Make sure the saved value is always selectable, even on a runtime with
    // a shorter zone list.
    return list.includes(timeZone) ? list : [timeZone, ...list]
  }, [timeZone])

  async function handleTimeZoneChange(next: string) {
    if (next === timeZone || savingZone) return
    setSavingZone(true)
    const ok = await setTimeZone(next)
    setSavingZone(false)
    if (ok) toast.success(t("saved"))
    else toast.error(t("saveFailed"))
  }

  function handleLocaleChange(next: string) {
    startTransition(() => {
      router.replace(
        // @ts-expect-error - typed-routing pathname union, runtime is fine
        { pathname, params },
        { locale: next as "en" | "pt" | "es" },
      )
    })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">{t("language")}</h2>
        <p className="text-sm text-zinc-500 mb-5">{t("languageDescription")}</p>

        <div className="space-y-1.5 max-w-xs">
          <Label className="text-zinc-700 dark:text-zinc-300">{t("language")}</Label>
          <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger className="w-full bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("languageEn")}</SelectItem>
              <SelectItem value="pt">{t("languagePt")}</SelectItem>
              <SelectItem value="es">{t("languageEs")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">{t("timezone")}</h2>
        <p className="text-sm text-zinc-500 mb-5">{t("timezoneDescription")}</p>

        <div className="space-y-1.5 max-w-xs">
          <Label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            {t("timezone")}
            {savingZone && <Loader2 className="size-3.5 animate-spin text-zinc-500" aria-hidden="true" />}
          </Label>
          <Select value={timeZone} onValueChange={handleTimeZoneChange} disabled={savingZone}>
            <SelectTrigger className="w-full bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {zones.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {formatTimeZoneLabel(zone, locale)}
                  <span className="ml-2 text-xs text-zinc-500">{zone}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {deviceZone !== timeZone && (
            <button
              type="button"
              onClick={() => handleTimeZoneChange(deviceZone)}
              disabled={savingZone}
              className="mt-1 text-xs text-emerald-600 underline-offset-2 hover:underline disabled:opacity-50 dark:text-emerald-400"
            >
              {t("timezoneUseDevice", { zone: formatTimeZoneLabel(deviceZone, locale) })}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
