"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"

export function CookieConsent() {
  const t = useTranslations("cookies")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setVisible(true)
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

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-4xl rounded-lg border border-zinc-800 bg-[#09090B]/95 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">{t("message")}</p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
          >
            {t("decline")}
          </button>
          <button
            onClick={handleAccept}
            className="text-sm text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-md transition-colors"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  )
}
