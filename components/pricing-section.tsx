"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Check, Zap } from "lucide-react"
import { TrackedLink } from "./tracked-link"

export function PricingSection() {
  const t = useTranslations("billing")

  const freeFeatures = [
    t("freeFeatBusiness"),
    t("freeFeatDiscovery"),
    t("freeFeatContent"),
    t("freeFeatImages"),
  ]
  const proFeatures = [
    t("perkBusinesses"),
    t("perkDiscovery"),
    t("perkContent"),
    t("perkImages"),
    t("perkOutreach"),
  ]

  return (
    <section id="pricing" className="relative px-6 py-24" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-medium text-white">{t("pricingHeading")}</h2>
          <p className="mt-3 text-zinc-400">{t("pricingSubtitle")}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7">
            <h3 className="text-lg font-medium text-white">{t("freePlan")}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold text-white">{t("freePrice")}</span>
              <span className="text-sm text-zinc-500">{t("perMonth")}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">{t("freeTagline")}</p>
            <ul className="mt-6 space-y-2.5">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <TrackedLink
              href="/signup"
              eventName="signup_start"
              eventParams={{ placement: "homepage_pricing_free" }}
              className="mt-7 block w-full text-center px-5 py-2.5 rounded-lg border border-zinc-700 text-zinc-100 font-medium hover:bg-zinc-800/60 transition-colors text-sm"
            >
              {t("ctaStartFree")}
            </TrackedLink>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.04] p-7 shadow-[0_0_60px_-30px_rgba(16,185,129,0.6)]">
            <span className="absolute -top-3 left-7 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[11px] font-semibold">
              <Zap className="w-3 h-3" />
              {t("proPlan")}
            </span>
            <h3 className="text-lg font-medium text-white">{t("proPlan")}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold text-white">{t("proPrice")}</span>
              <span className="text-sm text-zinc-500">{t("perMonth")}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{t("proTagline")}</p>
            <ul className="mt-6 space-y-2.5">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-200">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <TrackedLink
              href="/signup"
              eventName="signup_start"
              eventParams={{ placement: "homepage_pricing_pro" }}
              className="mt-7 block w-full text-center px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-sm"
            >
              {t("ctaGetPro")}
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  )
}
