"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Check, PartyPopper } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const CONFETTI_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#fbbf24"]

function Confetti() {
  // Positions are randomized once per mount; index keeps colors varied.
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.6 + Math.random() * 1.3,
        rotate: (Math.random() - 0.5) * 720,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + Math.random() * 6,
      })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 rounded-[1px]"
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.6, background: p.color }}
          initial={{ y: -24, opacity: 0, rotate: 0 }}
          animate={{ y: 420, opacity: [0, 1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  )
}

export function CongratsModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("billing")
  const perks = [
    t("perkDiscovery"),
    t("perkOutreach"),
    t("perkContent"),
    t("perkImages"),
    t("perkBusinesses"),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden bg-zinc-950 border-emerald-500/30 text-zinc-100 sm:max-w-md">
        {open && <Confetti />}
        <DialogHeader>
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15"
          >
            <PartyPopper className="h-7 w-7 text-emerald-400" />
          </motion.div>
          <DialogTitle className="text-center text-xl text-white">
            {t("congratsTitle")}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            {t("congratsBody")}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-zinc-300">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              {p}
            </li>
          ))}
        </ul>

        <Button
          onClick={() => onOpenChange(false)}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {t("congratsCta")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
