"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowUpRight, Quote } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"

export function TestimonialsSection() {
  const t = useTranslations("testimonials")

  return (
    <section
      id="customers"
      aria-labelledby="testimonials-heading"
      className="relative z-20 overflow-hidden bg-[#0c0c0f] px-6 py-32 sm:py-40"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-zinc-800/70" />

      <div className="mx-auto w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12"
        >
          <div className="flex items-center gap-3 self-start pt-2">
            <span className="h-px w-8 bg-emerald-400" aria-hidden="true" />
            <p className="text-sm text-zinc-400">{t("label")}</p>
          </div>

          <h2
            id="testimonials-heading"
            className="max-w-3xl text-3xl leading-[1.08] font-medium tracking-[-0.0325em] text-zinc-50 sm:text-4xl md:text-5xl lg:text-[56px]"
          >
            {t("heading")}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, delay: 0.12 }}
          className="mt-14 grid border-y border-zinc-800 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_18rem]"
        >
          <blockquote className="relative flex flex-col justify-between py-12 lg:min-h-[31rem] lg:py-16 lg:pr-16">
            <Quote
              className="mb-8 h-9 w-9 text-emerald-400"
              strokeWidth={1.5}
              aria-hidden="true"
            />

            <p className="max-w-3xl text-2xl leading-[1.35] tracking-[-0.02em] text-zinc-100 sm:text-3xl lg:text-[2.45rem]">
              {t("quote")}
            </p>

            <footer className="mt-12 flex flex-col gap-7 border-t border-zinc-800 pt-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/ceramik-logo.png"
                  alt={t("company")}
                  width={44}
                  height={44}
                  className="rounded-lg"
                />
                <div>
                  <cite className="not-italic font-medium text-zinc-100">
                    {t("company")}
                  </cite>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {t("companyDesc")}
                  </p>
                </div>
              </div>

              <Link
                href="/case-studies/ceramik"
                className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-50 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                {t("readMore")}
                <ArrowUpRight
                  className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </footer>
          </blockquote>

          <aside className="flex flex-col justify-between bg-emerald-400 px-8 py-10 text-emerald-950 lg:px-9 lg:py-12">
            <p className="text-xs font-semibold tracking-[0.14em] text-emerald-950/70 uppercase">
              {t("resultEyebrow")}
            </p>

            <div className="py-14 lg:py-10">
              <p className="text-7xl leading-none font-semibold tracking-[-0.06em]">
                {t("resultValue")}
              </p>
              <p className="mt-5 max-w-48 text-base leading-relaxed font-medium">
                {t("resultLabel")}
              </p>
            </div>

            <p className="border-t border-emerald-950/20 pt-5 text-xs leading-relaxed text-emerald-950/70">
              {t("resultDisclosure")}
            </p>
          </aside>
        </motion.div>
      </div>
    </section>
  )
}
