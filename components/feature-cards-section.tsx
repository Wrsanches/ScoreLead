"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import Image from "next/image"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import { Link } from "@/i18n/routing"

const featureCards = [
  {
    illustrationSrc: "/images/radar-discovery.svg",
  },
  {
    illustrationSrc: "/images/lead-scoring.svg",
  },
  {
    illustrationSrc: null,
  },
]

const cardKeys = ["card1", "card2", "card3"] as const
const cardHrefs = [
  "/features/ai-lead-discovery",
  "/features/lead-scoring",
  "/features/outreach-automation",
] as const

function OutreachIllustration() {
  const t = useTranslations("features")
  return (
    <div className="relative w-full h-full flex items-start justify-center overflow-hidden rounded-lg px-5 pt-6">
      <div className="w-full flex flex-col gap-0">
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0">1</div>
            <div className="w-px flex-1 bg-white/[0.1]" />
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <p className="text-[11px] text-zinc-300 font-medium mb-0.5">{t("introduction")}</p>
            <p className="text-[10px] text-zinc-600 leading-snug">{t("outreachPreview1")}</p>
            <span className="text-[9px] text-zinc-700 mt-1 inline-block">{t("day1")}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] text-amber-400 font-bold shrink-0">2</div>
            <div className="w-px flex-1 bg-white/[0.1]" />
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <p className="text-[11px] text-zinc-300 font-medium mb-0.5">{t("followUp")}</p>
            <p className="text-[10px] text-zinc-600 leading-snug">{t("outreachPreview2")}</p>
            <span className="text-[9px] text-zinc-700 mt-1 inline-block">{t("day3")}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0">3</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-zinc-300 font-medium mb-0.5">{t("valueProp")}</p>
            <p className="text-[10px] text-zinc-600 leading-snug">{t("outreachPreview3")}</p>
            <span className="text-[9px] text-zinc-700 mt-1 inline-block">{t("day7")}</span>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3 ml-10">
          <span className="text-[9px] bg-blue-500/15 text-blue-400/80 px-1.5 py-0.5 rounded">EN</span>
          <span className="text-[9px] bg-white/[0.07] text-zinc-500 px-1.5 py-0.5 rounded">ES</span>
          <span className="text-[9px] bg-white/[0.07] text-zinc-500 px-1.5 py-0.5 rounded">PT</span>
          <span className="text-[9px] bg-white/[0.07] text-zinc-500 px-1.5 py-0.5 rounded">FR</span>
        </div>
      </div>
    </div>
  )
}

export function FeatureCardsSection() {
  const t = useTranslations("features")

  return (
    <section id="features" className="relative z-20 py-40">
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
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
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
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
              className="max-w-md"
            >
              <p className="text-zinc-300 leading-relaxed">
                {t("description")}
              </p>
              <Link
                href="/features/ai-lead-discovery"
                className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                {t("seeAll")}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((card, index) => (
              <motion.div
                key={cardKeys[index]}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.06, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
                className="group surface-card overflow-hidden relative flex flex-col justify-end rounded-[30px] isolate min-h-96 lg:min-h-[26rem] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:ring-1 hover:ring-white/[0.14]"
              >
                <Link
                  href={cardHrefs[index]}
                  aria-label={t(cardKeys[index])}
                  className="absolute inset-0 z-20 rounded-[30px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                />
                <div
                  className="absolute top-0 left-0 w-full flex"
                  style={{
                    maskImage: "linear-gradient(#000 55%, transparent 78%)",
                    WebkitMaskImage: "linear-gradient(#000 55%, transparent 78%)",
                  }}
                >
                  {card.illustrationSrc ? (
                    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-lg lg:h-80">
                      <Image
                        src={card.illustrationSrc}
                        alt={t(cardKeys[index])}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <OutreachIllustration />
                  )}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-40 z-5 pointer-events-none"
                  style={{
                    background: "linear-gradient(to top, rgba(9,9,11,0.96) 45%, transparent 100%)",
                  }}
                />
                <div
                  className="relative z-10 flex items-end justify-between w-full"
                  style={{ padding: "0 24px 26px", gap: "16px" }}
                >
                  <div className="min-w-0">
                    <p className="mb-2 text-[11px] font-medium tracking-[0.14em] text-zinc-500 tabular-nums">0{index + 1}</p>
                    <h3 className="text-white font-medium text-base md:text-lg leading-tight">{t(cardKeys[index])}</h3>
                    <p className="mt-1.5 text-sm leading-5 text-zinc-500">{t(`${cardKeys[index]}Desc`)}</p>
                  </div>
                  <ChevronRight strokeWidth={1.75} className="mb-1 w-5 h-5 text-zinc-600 shrink-0 transition-[transform,color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1 group-hover:text-zinc-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
