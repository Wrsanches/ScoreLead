"use client"

import { useTransition } from "react"
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
    </div>
  )
}
