"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const EASE = [0.25, 0.46, 0.45, 0.94] as const

interface StepWelcomeProps {
  userName: string
  onContinue: () => void
}

export function StepWelcome({ userName, onContinue }: StepWelcomeProps) {
  const t = useTranslations("onboarding")
  const firstName = userName.split(" ")[0] || userName

  return (
    <div className="flex flex-col items-center text-center py-6">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3"
      >
        {t("welcomeTitle", { name: firstName })}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
        className="text-zinc-400 text-base max-w-md leading-relaxed mb-12"
      >
        {t("welcomeSubtitle")}
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        className="group relative px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg shadow-emerald-500/20"
      >
        {t("welcomeCta")}
        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </motion.button>
    </div>
  )
}
