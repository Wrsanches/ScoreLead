"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { ArrowUpRight, Check, CreditCard, RefreshCw, ShieldCheck, Zap } from "lucide-react"
import { Link } from "@/i18n/routing"
import { TrackedLink } from "./tracked-link"

/**
 * Homepage pricing block: all four tiers, with the full comparison table living
 * on /pricing. Growth is the hero card - heavier glass, emerald ring, raised on
 * desktop - so the eye lands there first, then on the $2.95 entry point.
 */

type PlanId = "free" | "starter" | "growth" | "pro"

const PLANS: PlanId[] = ["free", "starter", "growth", "pro"]

const revealEase = [0.23, 1, 0.32, 1] as [number, number, number, number]
const reveal = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
}

export function PricingSection() {
  const t = useTranslations("billing")

  return (
    <section id="pricing" className="relative z-20 px-6 py-32 sm:py-40">
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        {/* Header: left-aligned like the other sections, with the compare link on the right */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between mb-14">
          <motion.div {...reveal} transition={{ duration: 0.6, ease: revealEase }}>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white max-w-xl"
              style={{
                letterSpacing: "-0.0325em",
                fontVariationSettings: '"opsz" 28',
                fontWeight: 538,
                lineHeight: 1.1,
              }}
            >
              {t("pricingHeading")}
            </h2>
          </motion.div>
          <motion.div
            {...reveal}
            transition={{ duration: 0.6, delay: 0.1, ease: revealEase }}
            className="flex flex-col items-start gap-4 lg:items-end lg:text-right"
          >
            <p className="max-w-sm text-zinc-300">{t("pricingSubtitle")}</p>
            <Link
              href="/pricing"
              className="glass-pill press group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-200 hover:brightness-125 transition-[transform,filter] ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
            >
              {t("seeAllPlans")}
              <ArrowUpRight strokeWidth={1.75} className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
          {PLANS.map((id, index) => {
            const highlighted = id === "growth"
            const isTrial = id === "starter"
            const isFree = id === "free"
            const perks = t.raw(`planPerks.${id}`) as string[]
            return (
              <motion.div
                key={id}
                {...reveal}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.06, ease: revealEase }}
                className={
                  highlighted
                    ? "surface-card relative flex flex-col rounded-3xl p-6 ring-1 ring-emerald-500/40 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.6)] lg:-my-4 lg:p-7"
                    : "surface-card relative flex flex-col rounded-3xl p-6 lg:p-7"
                }
              >
                {highlighted && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-3xl bg-gradient-to-b from-emerald-500/[0.12] to-transparent"
                  />
                )}

                <div className="relative flex items-center justify-between gap-3">
                  <h3 className={`text-lg font-medium ${isFree ? "text-zinc-300" : "text-white"}`}>
                    {t(`planName.${id}`)}
                  </h3>
                  {highlighted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-zinc-950">
                      <Zap className="h-3 w-3" aria-hidden="true" />
                      {t("recommendedBadge")}
                    </span>
                  ) : isTrial ? (
                    <span className="glass-pill inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-zinc-200">
                      {t("trialBadge")}
                    </span>
                  ) : null}
                </div>

                <div className="relative mt-6 flex items-baseline gap-1.5">
                  <span className={`text-5xl font-semibold tracking-tight tabular-nums ${isFree ? "text-zinc-200" : "text-white"}`}>
                    {isTrial ? t("trialPrice") : t(`planPrice.${id}`)}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {isTrial ? t("trialCadence") : t("perMonth")}
                  </span>
                </div>
                {/* Reserved on every card so the taglines stay on one baseline. */}
                <p className={`relative mt-2 min-h-4 text-xs leading-4 ${isFree ? "text-zinc-500" : "text-emerald-400/90"}`}>
                  {isTrial ? t("trialNote") : isFree ? t("noCreditCard") : " "}
                </p>

                <p className="relative mt-4 text-sm leading-6 text-zinc-400 lg:min-h-12">
                  {t(`planTagline.${id}`)}
                </p>

                <div className="relative my-6 h-px bg-white/[0.08]" />

                <ul className="relative space-y-3">
                  {perks.map((perk) => (
                    <li
                      key={perk}
                      className={`flex items-start gap-2.5 text-sm leading-5 ${isFree ? "text-zinc-400" : "text-zinc-300"}`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          highlighted
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/[0.07] text-zinc-400"
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="relative mt-auto pt-8">
                  <TrackedLink
                    href="/signup"
                    eventName="signup_start"
                    eventParams={{ placement: `homepage_pricing_${id}` }}
                    className={
                      highlighted
                        ? "press block w-full rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-zinc-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.8)] hover:bg-emerald-400 transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)]"
                        : isFree
                          ? "press block w-full rounded-xl px-4 py-3 text-center text-sm font-medium text-zinc-400 ring-1 ring-inset ring-white/[0.08] hover:text-zinc-200 hover:ring-white/[0.16] transition-[transform,color,box-shadow] ease-[cubic-bezier(0.23,1,0.32,1)]"
                          : "glass-pill press block w-full rounded-xl px-4 py-3 text-center text-sm font-medium text-zinc-100 hover:brightness-125 transition-[transform,filter] ease-[cubic-bezier(0.23,1,0.32,1)]"
                    }
                  >
                    {isFree
                      ? t("ctaStartFree")
                      : isTrial
                        ? t("ctaStartTrial")
                        : t("ctaChoose", { plan: t(`planName.${id}`) })}
                  </TrackedLink>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Quiet trust strip */}
        <motion.ul
          {...reveal}
          transition={{ duration: 0.6, delay: 0.5, ease: revealEase }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-zinc-500"
        >
          <li className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-600" aria-hidden="true" />
            {t("noCreditCard")}
          </li>
          <li className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-zinc-600" aria-hidden="true" />
            {t("pricingNoteCancel")}
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-zinc-600" aria-hidden="true" />
            {t("pricingNoteSecure")}
          </li>
        </motion.ul>
      </div>
    </section>
  )
}
