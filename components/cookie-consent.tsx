"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Cookie } from "lucide-react"

export function CookieConsent() {
  const t = useTranslations("cookies")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem("cookie-consent", "accepted")
    setVisible(false)
  }

  function handleDecline() {
    localStorage.setItem("cookie-consent", "declined")
    setVisible(false)
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-4 md:left-auto md:bottom-4 md:right-4 md:p-0 z-50 transition-all duration-500 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="w-full md:w-85 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center">
            <Cookie className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="text-sm font-medium text-white">{t("message")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 text-sm text-zinc-400 hover:text-white transition-colors py-2 rounded-lg hover:bg-zinc-800/50"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-zinc-700 hover:border-zinc-600 py-2 rounded-lg transition-all"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  )
}
