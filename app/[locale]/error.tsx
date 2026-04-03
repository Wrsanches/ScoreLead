"use client"

import { useTranslations } from "next-intl"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error")

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#09090B" }}
    >
      <h1 className="text-6xl sm:text-8xl font-black text-white mb-4">500</h1>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
        {t("title")}
      </h2>
      <p className="text-sm text-zinc-500 mb-10 text-center max-w-sm leading-relaxed">
        {t("description")}
      </p>
      <button
        onClick={reset}
        className="group relative px-6 py-3 text-sm font-medium text-white rounded-lg bg-zinc-800/80 border border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all duration-300"
      >
        {t("retry")}
      </button>
    </div>
  )
}
