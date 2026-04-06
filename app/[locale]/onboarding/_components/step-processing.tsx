"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Globe, Search, Sparkles, Check } from "lucide-react"

export type ProcessingStatus = "scraping" | "searching" | "analyzing"

interface StepProcessingProps {
  status: ProcessingStatus
}

export function StepProcessing({ status }: StepProcessingProps) {
  const t = useTranslations("onboarding")

  const steps = [
    { key: "scraping", icon: Globe, label: t("processingScraping") },
    { key: "searching", icon: Search, label: t("processingSearching") },
    { key: "analyzing", icon: Sparkles, label: t("processingAnalyzing") },
  ]

  const currentIndex = steps.findIndex((s) => s.key === status)

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <h2 className="text-xl font-semibold text-white tracking-tight mb-1">
        {t("processingTitle")}
      </h2>
      <p className="text-zinc-500 text-sm mb-10">
        {t("processingDescription")}
      </p>

      <div className="w-full max-w-xs space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isActive = i === currentIndex
          const isDone = i < currentIndex

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.3 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                isActive
                  ? "bg-emerald-500/[0.08] border border-emerald-500/20"
                  : isDone
                    ? "bg-zinc-800/20 border border-zinc-800/40"
                    : "border border-transparent opacity-30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${
                  isActive
                    ? "bg-emerald-500/15"
                    : isDone
                      ? "bg-zinc-800/50"
                      : "bg-zinc-800/30"
                }`}
              >
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-zinc-600"}`} />
                )}
              </div>
              <span className={`text-sm ${isActive ? "text-zinc-200" : isDone ? "text-zinc-500" : "text-zinc-600"}`}>
                {step.label}
              </span>
              {isActive && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
