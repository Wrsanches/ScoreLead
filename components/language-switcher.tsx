"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/routing"
import { Globe } from "lucide-react"

const localeNames: Record<string, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
}

const localeLabels: Record<string, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
}

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as "en" | "pt" | "es" })
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-800/50">
      <Globe className="w-3.5 h-3.5 text-zinc-500 mr-1" />
      {Object.keys(localeNames).map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          aria-label={`Switch to ${localeLabels[loc]}`}
          aria-current={locale === loc ? "true" : undefined}
          className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all ${
            locale === loc
              ? "bg-zinc-600 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  )
}
