"use client"

import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import { usePathname, useRouter } from "@/i18n/routing"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const locales = {
  en: { code: "EN", label: "English", flag: "/flags/us.svg" },
  pt: { code: "PT", label: "Português", flag: "/flags/br.svg" },
  es: { code: "ES", label: "Español", flag: "/flags/es.svg" },
} as const

type AppLocale = keyof typeof locales

function Flag({ src }: { src: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative h-[15px] w-5 shrink-0 overflow-hidden rounded-[3px] bg-zinc-800 ring-1 ring-white/20 shadow-sm shadow-black/50"
    >
      <Image src={src} alt="" fill sizes="20px" className="object-cover" />
    </span>
  )
}

export function LanguageSwitcher() {
  const t = useTranslations("nav")
  const activeLocale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const current = locales[activeLocale] ?? locales.en

  function switchLocale(newLocale: string) {
    if (newLocale === activeLocale) return
    router.replace(pathname, { locale: newLocale as AppLocale })
  }

  return (
    <Select value={activeLocale} onValueChange={switchLocale}>
      <SelectTrigger
        aria-label={`${t("language")}: ${current.label}`}
        className="h-8 min-w-20 rounded-full border-zinc-700/80 bg-zinc-900/70 px-2.5 text-zinc-200 shadow-none transition-colors hover:border-zinc-600 hover:bg-zinc-800/80 focus-visible:border-emerald-500/70 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
      >
        <SelectValue aria-label={current.label}>
          <span className="flex items-center gap-2">
            <Flag src={current.flag} />
            <span className="text-xs font-semibold tracking-wide">{current.code}</span>
          </span>
        </SelectValue>
      </SelectTrigger>

      <SelectContent
        align="end"
        sideOffset={8}
        className="min-w-44 border-zinc-700 bg-zinc-950 text-zinc-200 shadow-xl shadow-black/30"
      >
        {(Object.entries(locales) as [AppLocale, (typeof locales)[AppLocale]][]).map(
          ([locale, option]) => (
            <SelectItem
              key={locale}
              value={locale}
              className="py-2.5 text-zinc-300 focus:bg-zinc-800 focus:text-white data-[state=checked]:text-white"
            >
              <Flag src={option.flag} />
              <span>{option.label}</span>
            </SelectItem>
          ),
        )}
      </SelectContent>
    </Select>
  )
}
