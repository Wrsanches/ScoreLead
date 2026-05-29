"use client"

import { useTransition } from "react"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"
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
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [, startTransition] = useTransition()

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
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">{t("theme")}</h2>
        <p className="text-sm text-zinc-500 mb-5">{t("themeDescription")}</p>

        <div className="space-y-1.5 max-w-xs">
          <Label className="text-zinc-700 dark:text-zinc-300">{t("theme")}</Label>
          <Select value={theme ?? "dark"} onValueChange={setTheme}>
            <SelectTrigger className="w-full bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("themeLight")}</SelectItem>
              <SelectItem value="dark">{t("themeDark")}</SelectItem>
              <SelectItem value="system">{t("themeSystem")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">{t("language")}</h2>
        <p className="text-sm text-zinc-500 mb-5">{t("languageDescription")}</p>

        <div className="space-y-1.5 max-w-xs">
          <Label className="text-zinc-700 dark:text-zinc-300">{t("language")}</Label>
          <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger className="w-full bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
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
    </div>
  )
}
