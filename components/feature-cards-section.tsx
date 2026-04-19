"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

const featureCards = [
  {
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
        <Image
          src="/images/radar-discovery.svg"
          alt=""
          fill
          className="object-contain"
          aria-hidden="true"
          unoptimized
        />
      </div>
    ),
  },
  {
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
        <Image
          src="/images/lead-scoring.svg"
          alt=""
          fill
          className="object-contain"
          aria-hidden="true"
          unoptimized
        />
      </div>
    ),
  },
  {
    illustration: null,
  },
]

const cardKeys = ["card1", "card2", "card3"] as const

function OutreachIllustration() {
  const t = useTranslations("features")
  return (
    <div className="relative w-full h-full flex items-start justify-center overflow-hidden rounded-lg px-5 pt-6">
      <div className="w-full flex flex-col gap-0">
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0">1</div>
            <div className="w-px flex-1 bg-zinc-700/50" />
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <p className="text-[11px] text-zinc-300 font-medium mb-0.5">{t("introduction")}</p>
            <p className="text-[10px] text-zinc-600 leading-snug">Hi, I noticed your studio offers yoga and pilates...</p>
            <span className="text-[9px] text-zinc-700 mt-1 inline-block">Day 1</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] text-amber-400 font-bold shrink-0">2</div>
            <div className="w-px flex-1 bg-zinc-700/50" />
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <p className="text-[11px] text-zinc-300 font-medium mb-0.5">{t("followUp")}</p>
            <p className="text-[10px] text-zinc-600 leading-snug">Studios like yours are saving 10+ hours a week...</p>
            <span className="text-[9px] text-zinc-700 mt-1 inline-block">Day 3</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0">3</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-zinc-300 font-medium mb-0.5">{t("valueProp")}</p>
            <p className="text-[10px] text-zinc-600 leading-snug">With your 4.7 rating and growing demand...</p>
            <span className="text-[9px] text-zinc-700 mt-1 inline-block">Day 7</span>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3 ml-10">
          <span className="text-[9px] bg-blue-500/15 text-blue-400/80 px-1.5 py-0.5 rounded">EN</span>
          <span className="text-[9px] bg-zinc-800/80 text-zinc-600 px-1.5 py-0.5 rounded">ES</span>
          <span className="text-[9px] bg-zinc-800/80 text-zinc-600 px-1.5 py-0.5 rounded">PT</span>
          <span className="text-[9px] bg-zinc-800/80 text-zinc-600 px-1.5 py-0.5 rounded">FR</span>
        </div>
      </div>
    </div>
  )
}

export function FeatureCardsSection() {
  const t = useTranslations("features")

  return (
    <section id="features" className="relative z-20 py-40" style={{ backgroundColor: "#09090B" }}>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-5xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white max-w-md"
              style={{
                letterSpacing: "-0.0325em",
                fontVariationSettings: '"opsz" 28',
                fontWeight: 538,
                lineHeight: 1.1,
              }}
            >
              {t("heading")}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-md"
            >
              <p className="text-zinc-400 leading-relaxed">
                {t("description")}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((card, index) => (
              <motion.div
                key={cardKeys[index]}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 overflow-hidden relative flex flex-col justify-end rounded-[30px] isolate min-h-80 lg:min-h-90"
              >
                <div
                  className="absolute top-0 left-0 w-full flex"
                  style={{
                    maskImage: "linear-gradient(#000 70%, transparent 90%)",
                    WebkitMaskImage: "linear-gradient(#000 70%, transparent 90%)",
                  }}
                >
                  {card.illustration || <OutreachIllustration />}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-24 z-5 pointer-events-none"
                  style={{
                    background: "linear-gradient(to top, rgba(9,9,11,0.95) 40%, transparent 100%)",
                  }}
                />
                <div
                  className="relative z-10 flex items-center justify-between w-full"
                  style={{ padding: "0 24px 28px", gap: "16px" }}
                >
                  <h3 className="text-white font-medium text-base md:text-lg leading-tight">{t(cardKeys[index])}</h3>
                  <ChevronRight className="w-5 h-5 text-zinc-600 shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
