"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  ArrowUpRight,
  AtSign,
  Globe,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
} from "lucide-react";

const reveal = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
};
const revealEase = [0.23, 1, 0.32, 1] as [number, number, number, number];

export function AISection() {
  const t = useTranslations("ai");

  const enrichmentFields = [
    { icon: Globe, label: t("website"), value: "sunsetyoga.com", color: "text-sky-400" },
    { icon: Mail, label: t("email"), value: "hello@sunsetyoga.com", color: "text-zinc-200" },
    { icon: Phone, label: t("phone"), value: "(415) 555-0142", color: "text-zinc-200" },
    { icon: Users, label: t("teamSize"), value: t("teamSizeValue"), color: "text-zinc-200" },
    { icon: Star, label: t("rating"), value: t("ratingValue"), color: "text-amber-400" },
    { icon: AtSign, label: t("social"), value: "@sunsetyogasf · 2.4k", color: "text-zinc-200" },
    { icon: MapPin, label: t("location"), value: "San Francisco, CA", color: "text-zinc-200" },
  ];

  const signals = [
    { label: t("onlineReach"), value: 5, color: "bg-emerald-500" },
    { label: t("trustworthiness"), value: 4, color: "bg-emerald-500" },
    { label: t("marketFit"), value: 5, color: "bg-emerald-500" },
    { label: t("engagement"), value: 4, color: "bg-sky-500" },
    { label: t("readiness"), value: 3, color: "bg-amber-500" },
  ];

  const steps = [
    { n: 1, label: t("outreachStep1Label"), subject: t("outreachStep1Subject"), body: t("outreachStep1Body"), tone: "bg-sky-500/15 text-sky-300" },
    { n: 2, label: t("outreachStep2Label"), subject: t("outreachStep2Subject"), body: t("outreachStep2Body"), tone: "bg-amber-500/15 text-amber-300" },
    { n: 3, label: t("outreachStep3Label"), subject: t("outreachStep3Subject"), body: t("outreachStep3Body"), tone: "bg-emerald-500/15 text-emerald-300" },
  ];

  return (
    <section id="ai" className="relative z-20 py-32 sm:py-40">
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6">
        <motion.div {...reveal} transition={{ duration: 0.6, ease: revealEase }} className="max-w-3xl">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white"
            style={{
              letterSpacing: "-0.0325em",
              fontVariationSettings: '"opsz" 28',
              fontWeight: 538,
              lineHeight: 1.1,
            }}
          >
            {t("heading")}
          </h2>
          <p className="mt-6 max-w-lg text-zinc-300 leading-relaxed">{t("description")}</p>
          <Link
            href="/features/lead-enrichment"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            {t("cta")}
            <ArrowUpRight
              strokeWidth={1.75}
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </motion.div>

        {/* Tilted enrichment panel: a glass sheet of label / value rows */}
        <motion.div
          {...reveal}
          transition={{ duration: 0.8, delay: 0.2, ease: revealEase }}
          className="mt-16 flex justify-center md:mt-20"
        >
          <div
            className="w-full max-w-[92%] md:max-w-3xl"
            style={{ perspective: "1100px", userSelect: "none", WebkitUserSelect: "none", position: "relative" }}
          >
            <div
              className="relative scale-95 md:scale-100"
              style={{
                transformOrigin: "top",
                willChange: "transform",
                transform: "rotateX(24deg) scale(1.08)",
              }}
            >
              {/* Specular sheen over the whole sheet */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 rounded-3xl"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "linear-gradient(rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 45%, transparent 100%)",
                  boxShadow: "inset 0 1.5px 5px rgba(255,255,255,0.05), inset 0 -0.75px 0.75px rgba(255,255,255,0.1)",
                }}
              />
              {/* Soft fade at the far edge so the sheet recedes into the canvas */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[-120px] bottom-[-2px] z-20 h-[22%]"
                style={{ background: "linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.75) 100%)" }}
              />

              <div className="surface-card overflow-hidden rounded-3xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-sm font-medium text-zinc-200">{t("enrichmentTitle")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[t("sourceMaps"), t("sourceWeb"), t("sourceAI")].map((source) => (
                      <span
                        key={source}
                        className="glass-pill rounded-full px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="py-2">
                  {enrichmentFields.map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center gap-4 px-6 py-2.5 transition-colors hover:bg-white/[0.04]"
                    >
                      <field.icon className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
                      <span className="w-24 shrink-0 text-sm text-zinc-500">{field.label}</span>
                      <span className={`truncate text-sm ${field.color}`}>{field.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-6 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] text-zinc-500">{t("servicesDetected")}</span>
                    {[t("serviceYoga"), t("servicePilates"), t("serviceMeditation"), t("serviceWorkshops")].map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-emerald-400">{t("confidence")}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scoring and outreach as two glass cards */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 md:mt-16">
          <motion.div
            {...reveal}
            transition={{ duration: 0.6, delay: 0.1, ease: revealEase }}
            className="surface-card flex flex-col rounded-3xl p-7"
          >
            <h3 className="text-xl font-medium text-zinc-100">{t("scoringTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{t("scoringDesc")}</p>

            <div className="mt-7 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-inset ring-white/[0.06]">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">Sunset Yoga Studio</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold text-emerald-400">4.5</span>
                  <span className="text-xs text-zinc-500">/5</span>
                </div>
              </div>
              <div className="space-y-3">
                {signals.map((signal) => (
                  <div key={signal.label} className="flex items-center gap-3">
                    <span className="w-28 text-xs text-zinc-500">{signal.label}</span>
                    <div className="flex flex-1 gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-sm ${i < signal.value ? signal.color : "bg-white/[0.07]"}`}
                        />
                      ))}
                    </div>
                    <span className="w-6 text-right text-xs text-zinc-400">{signal.value}/5</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-3">
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">{t("highOpportunity")}</span>
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">{t("openMarket")}</span>
                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">{t("growingDemand")}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...reveal}
            transition={{ duration: 0.6, delay: 0.2, ease: revealEase }}
            className="surface-card flex flex-col rounded-3xl p-7"
          >
            <h3 className="text-xl font-medium text-zinc-100">{t("outreachTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{t("outreachDesc")}</p>

            <div className="mt-7 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-inset ring-white/[0.06]">
              <ol className="space-y-4">
                {steps.map((step) => (
                  <li key={step.n} className="flex gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${step.tone}`}>
                      {step.n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-400">{step.label}</p>
                      <div className="mt-1.5 rounded-lg bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.06]">
                        <p className="text-xs text-zinc-500">
                          {t("subject")} <span className="text-zinc-200">{step.subject}</span>
                        </p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">{step.body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-3">
                {["EN", "ES", "PT", "FR", "DE", "+12"].map((lang) => (
                  <span
                    key={lang}
                    className={`rounded-md px-2 py-0.5 text-[10px] ${
                      lang === "EN" ? "bg-sky-500/15 text-sky-300" : "bg-white/[0.06] text-zinc-400"
                    }`}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
