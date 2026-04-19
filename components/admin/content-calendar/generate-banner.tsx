"use client"

import { motion } from "framer-motion"
import { Sparkles, Undo2, Check, X } from "lucide-react"
import { useTranslations } from "next-intl"

interface GenerateBannerProps {
  count: number
  onUndo: () => void
  onApproveAll: () => void
  onDismiss: () => void
}

export function GenerateBanner({
  count,
  onUndo,
  onApproveAll,
  onDismiss,
}: GenerateBannerProps) {
  const t = useTranslations("contentCalendar")

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_40px_-20px_rgba(16,185,129,0.5)]"
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-emerald-400" />
      </div>
      <p className="flex-1 text-sm text-zinc-200">
        {t("draftsAdded", { count })}
      </p>
      <button
        type="button"
        onClick={onUndo}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors"
      >
        <Undo2 className="w-3 h-3" />
        {t("undo")}
      </button>
      <button
        type="button"
        onClick={onApproveAll}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
      >
        <Check className="w-3 h-3" />
        {t("approveAll")}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}
