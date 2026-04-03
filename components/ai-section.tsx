"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { ChevronRight, Globe, Mail, Phone, Users, Star, AtSign, MapPin } from "lucide-react"

export function AISection() {
  const t = useTranslations("ai")

  const enrichmentFields = [
    { icon: Globe, label: t("website"), value: "sunsetyoga.com", color: "text-blue-400" },
    { icon: Mail, label: t("email"), value: "hello@sunsetyoga.com", color: "text-zinc-300" },
    { icon: Phone, label: t("phone"), value: "(415) 555-0142", color: "text-zinc-300" },
    { icon: Users, label: t("teamSize"), value: t("teamSizeValue"), color: "text-zinc-300" },
    { icon: Star, label: t("rating"), value: t("ratingValue"), color: "text-amber-400" },
    { icon: AtSign, label: t("social"), value: "@sunsetyogasf · 2.4k", color: "text-zinc-300" },
    { icon: MapPin, label: t("location"), value: "San Francisco, CA", color: "text-zinc-300" },
  ]

  return (
    <section id="ai" className="relative z-20 py-40" style={{ backgroundColor: "#09090B" }}>
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
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-zinc-400 text-sm">{t("label")}</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white max-w-3xl mb-8"
            style={{
              letterSpacing: "-0.0325em",
              fontVariationSettings: '"opsz" 28',
              fontWeight: 538,
              lineHeight: 1.1,
            }}
          >
            {t("heading")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 max-w-lg mb-8"
          >
            {t("description")}
          </motion.p>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="px-5 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors text-sm flex items-center gap-2 mb-16"
          >
            {t("cta")}
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center mb-12 md:mb-24"
          >
            <div
              className="w-full max-w-[90%] md:max-w-[720px]"
              style={{
                perspective: "900px",
                userSelect: "none",
                WebkitUserSelect: "none",
                position: "relative",
              }}
            >
              <div
                className="scale-90 md:scale-100"
                style={{
                  transformOrigin: "top",
                  willChange: "transform",
                  transform: "translateY(0%) rotateX(30deg) scale(1.15)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    border: "1px solid rgba(66, 66, 66, 0.5)",
                    background: "linear-gradient(rgba(255, 255, 255, 0.1) 40%, rgba(8, 9, 10, 0.1) 100%)",
                    borderRadius: "8px",
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    boxShadow:
                      "inset 0 1.503px 5.261px rgba(255, 255, 255, 0.04), inset 0 -0.752px 0.752px rgba(255, 255, 255, 0.1)",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />

                <div
                  style={{
                    background: "linear-gradient(180deg, transparent 0%, #09090B 100%)",
                    height: "80%",
                    position: "absolute",
                    bottom: "-2px",
                    left: "-180px",
                    right: "-180px",
                    pointerEvents: "none",
                    zIndex: 11,
                  }}
                />

                <div className="bg-zinc-800/50 border border-zinc-700 rounded-t-xl px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-zinc-300 font-medium text-sm">{t("enrichmentTitle")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[t("sourceMaps"), t("sourceWeb"), t("sourceAI")].map((source) => (
                      <span
                        key={source}
                        className="text-[10px] bg-zinc-700/50 text-zinc-400 px-2 py-0.5 rounded"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/80 border border-t-0 border-zinc-700 rounded-b-xl py-2">
                  {enrichmentFields.map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-800/30 transition-colors"
                    >
                      <field.icon className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-500 text-sm w-20">{field.label}</span>
                      <span className={`text-sm ${field.color}`}>{field.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-5 py-3 mt-1 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{t("servicesDetected")}</span>
                      {[t("serviceYoga"), t("servicePilates"), t("serviceMeditation"), t("serviceWorkshops")].map((s) => (
                        <span key={s} className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">{t("confidence")}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="border-t border-b md:border-r border-zinc-800/60 pt-8 px-6 pb-10 md:pt-12 md:pr-12 md:px-0 md:pb-16">
                <h3 className="text-zinc-200 font-medium text-xl mb-3">{t("scoringTitle")}</h3>
                <p className="text-zinc-500 text-base mb-8">
                  {t("scoringDesc")}
                </p>

                <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-zinc-300 text-sm font-medium">Sunset Yoga Studio</span>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400 font-bold text-xl">4.5</span>
                      <span className="text-zinc-500 text-xs">/5</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: t("onlineReach"), value: 5, color: "bg-emerald-500" },
                      { label: t("trustworthiness"), value: 4, color: "bg-emerald-500" },
                      { label: t("marketFit"), value: 5, color: "bg-emerald-500" },
                      { label: t("engagement"), value: 4, color: "bg-blue-500" },
                      { label: t("readiness"), value: 3, color: "bg-amber-500" },
                    ].map((signal) => (
                      <div key={signal.label} className="flex items-center gap-3">
                        <span className="text-zinc-500 text-xs w-28">{signal.label}</span>
                        <div className="flex-1 flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 flex-1 rounded-sm ${i < signal.value ? signal.color : "bg-zinc-800"}`}
                            />
                          ))}
                        </div>
                        <span className="text-zinc-400 text-xs w-6 text-right">{signal.value}/5</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">{t("highOpportunity")}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">{t("openMarket")}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{t("growingDemand")}</span>
                  </div>
                </div>
              </div>

              <div className="border-b md:border-t border-zinc-800/60 pt-8 px-6 pb-10 md:pt-12 md:pl-12 md:px-0 md:pb-16">
                <h3 className="text-zinc-200 font-medium text-xl mb-3">{t("outreachTitle")}</h3>
                <p className="text-zinc-500 text-base mb-8">
                  {t("outreachDesc")}
                </p>

                <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-5 font-mono text-sm">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">1</div>
                        <span className="text-zinc-400 text-xs">{t("outreachStep1Label")}</span>
                      </div>
                      <div className="bg-zinc-800/40 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">{t("subject")} <span className="text-zinc-300">{t("outreachStep1Subject")}</span></p>
                        <p className="text-zinc-600 text-xs">{t("outreachStep1Body")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-2.5">
                      <div className="w-px h-4 bg-zinc-700" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-400 font-bold">2</div>
                        <span className="text-zinc-400 text-xs">{t("outreachStep2Label")}</span>
                      </div>
                      <div className="bg-zinc-800/40 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">{t("subject")} <span className="text-zinc-300">{t("outreachStep2Subject")}</span></p>
                        <p className="text-zinc-600 text-xs">{t("outreachStep2Body")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-2.5">
                      <div className="w-px h-4 bg-zinc-700" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold">3</div>
                        <span className="text-zinc-400 text-xs">{t("outreachStep3Label")}</span>
                      </div>
                      <div className="bg-zinc-800/40 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">{t("subject")} <span className="text-zinc-300">{t("outreachStep3Subject")}</span></p>
                        <p className="text-zinc-600 text-xs">{t("outreachStep3Body")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center gap-3">
                    {["EN", "ES", "PT", "FR", "DE", "+12"].map((lang) => (
                      <span
                        key={lang}
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          lang === "EN" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
