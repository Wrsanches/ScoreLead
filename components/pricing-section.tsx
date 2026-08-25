"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Check, Zap } from "lucide-react"
import { Link } from "@/i18n/routing"
import { TrackedLink } from "./tracked-link"

/**
 * Homepage pricing block: all four tiers, with the full comparison table living
 * on /pricing. Free is rendered de-emphasized (no badge, muted CTA) so the eye
 * still lands on the $2.95 entry point and on Growth.
 */

type PlanId = "free" | "starter" | "growth" | "pro"

const PLANS: PlanId[] = ["free", "starter", "growth", "pro"]

export function PricingSection() {
  const t = useTranslations("billing")

  return (
    <section id="pricing" className="relative px-6 py-24" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-7xl mx-auto">
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

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {PLANS.map((id) => {
            const highlighted = id === "growth"
            const isTrial = id === "starter"
            const isFree = id === "free"
            const perks = t.raw(`planPerks.${id}`) as string[]
            return (
              <div
                key={id}
                className={
                  highlighted
                    ? "relative flex flex-col rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.04] p-6 shadow-[0_0_60px_-30px_rgba(16,185,129,0.6)]"
                    : isFree
                      ? "relative flex flex-col rounded-2xl border border-zinc-800/70 bg-zinc-900/20 p-6"
                      : "relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
                }
              >
                {(highlighted || isTrial) && (
                  <span
                    className={
                      highlighted
                        ? "absolute -top-3 left-6 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[11px] font-semibold"
                        : "absolute -top-3 left-6 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-950 text-[11px] font-semibold"
                    }
                  >
                    {highlighted && <Zap className="w-3 h-3" />}
                    {highlighted ? t("recommendedBadge") : t("trialBadge")}
                  </span>
                )}

                <h3 className="text-lg font-medium text-white">{t(`planName.${id}`)}</h3>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-white">
                    {isTrial ? t("trialPrice") : t(`planPrice.${id}`)}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {isTrial ? t("trialCadence") : t("perMonth")}
                  </span>
                </div>
                {/* Reserved on every card so the taglines stay on one baseline. */}
                <p
                  className={`mt-1 min-h-4 text-xs leading-4 ${
                    isFree ? "text-zinc-500" : "text-emerald-400/90"
                  }`}
                >
                  {isTrial
                    ? t("trialNote")
                    : isFree
                      ? t("noCreditCard")
                      : "\u00A0"}
                </p>

                <p className="mt-3 text-sm text-zinc-400 lg:min-h-10">
                  {t(`planTagline.${id}`)}
                </p>

                <ul className="mt-6 space-y-2.5">
                  {perks.map((perk) => (
                    <li
                      key={perk}
                      className={`flex items-start gap-2 text-sm ${isFree ? "text-zinc-400" : "text-zinc-300"}`}
                    >
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          highlighted
                            ? "text-emerald-400"
                            : isFree
                              ? "text-zinc-600"
                              : "text-zinc-500"
                        }`}
                      />
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                <TrackedLink
                  href="/signup"
                  eventName="signup_start"
                  eventParams={{ placement: `homepage_pricing_${id}` }}
                  className={
                    highlighted
                      ? "block w-full text-center px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-sm"
                      : isFree
                        ? "block w-full text-center px-4 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 font-medium hover:border-zinc-700 hover:text-zinc-200 transition-colors text-sm"
                        : "block w-full text-center px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-100 font-medium hover:bg-zinc-800/60 transition-colors text-sm"
                  }
                >
                  {isFree
                    ? t("ctaStartFree")
                    : isTrial
                      ? t("ctaStartTrial")
                      : t("ctaChoose", { plan: t(`planName.${id}`) })}
                </TrackedLink>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link
            href="/pricing"
            className="underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-zinc-300"
          >
            {t("seeAllPlans")}
          </Link>
        </p>
      </div>
    </section>
  )
}
