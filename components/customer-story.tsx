"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { ChevronRight, Quote, ArrowUpRight } from "lucide-react"
import Image from "next/image"

export function CustomerStory() {
  const t = useTranslations("customerStory")

  return (
    <section id="customers" className="relative z-20 py-40" style={{ backgroundColor: "#09090B" }}>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 text-sm">{t("label")}</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white max-w-3xl mb-16"
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
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="border-t border-b md:border-r border-zinc-800/60 pt-8 px-6 pb-10 md:pt-12 md:pr-12 md:px-0 md:pb-16">
                <Quote className="w-8 h-8 text-emerald-500/30 mb-6" />
                <p className="text-lg md:text-xl text-zinc-200 leading-relaxed mb-8">
                  {t("quote")}
                </p>

                <div className="flex items-center gap-4">
                  <Image
                    src="/images/ceramik-logo.png"
                    alt={t("company")}
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div>
                    <p className="text-white font-medium">{t("company")}</p>
                    <p className="text-zinc-500 text-sm">{t("companyDesc")}</p>
                  </div>
                </div>
              </div>

              <div className="border-b md:border-t border-zinc-800/60 pt-8 px-6 pb-10 md:pt-12 md:pl-12 md:px-0 md:pb-16">
                <p className="text-zinc-500 text-sm mb-8">{t("statsLabel")}</p>

                <div className="space-y-8">
                  <div>
                    <p className="text-4xl md:text-5xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                      {t("stat1")}
                    </p>
                    <p className="text-zinc-500 text-sm">{t("stat1Label")}</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                      {t("stat2")}
                    </p>
                    <p className="text-zinc-500 text-sm">{t("stat2Label")}</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                      {t("stat3")}
                    </p>
                    <p className="text-zinc-500 text-sm">{t("stat3Label")}</p>
                  </div>
                </div>

                <a href="https://ceramik.app" target="_blank" rel="noopener noreferrer" className="mt-10 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  {t("readMore")}
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
