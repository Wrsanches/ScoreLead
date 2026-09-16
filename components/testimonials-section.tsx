"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function TestimonialsSection() {
  const t = useTranslations("testimonials");

  return (
    <section
      id="customers"
      aria-labelledby="testimonials-heading"
      className="relative z-20 overflow-hidden bg-white/[0.02] px-6 py-32 sm:py-40"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.08]" />

      <div className="mx-auto w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
        >
          <h2
            id="testimonials-heading"
            className="max-w-3xl text-3xl leading-[1.08] font-medium tracking-[-0.0325em] text-zinc-50 sm:text-4xl md:text-5xl lg:text-[56px]"
          >
            {t("heading")}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
          className="surface-card mt-14 grid overflow-hidden rounded-3xl lg:mt-20 lg:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <blockquote className="relative flex flex-col justify-between px-8 py-12 lg:min-h-[31rem] lg:px-12 lg:py-16">
            <Quote
              className="mb-8 h-9 w-9 text-emerald-400"
              strokeWidth={1.5}
              aria-hidden="true"
            />

            <p className="max-w-3xl text-xl leading-[1.45] tracking-[-0.015em] text-zinc-100 sm:text-2xl lg:text-[1.9rem]">
              {t("quote")}
            </p>

            <footer className="mt-12 flex flex-col gap-7 border-t border-white/[0.08] pt-7 sm:flex-row sm:items-center sm:justify-between">
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

          <aside className="flex flex-col gap-3 border-t border-white/[0.08] p-3 lg:border-t-0 lg:border-l lg:p-4">
            <div className="flex flex-1 flex-col justify-between rounded-xl bg-emerald-400 px-7 py-8 text-emerald-950">
              <p className="text-xs font-semibold tracking-[0.14em] text-emerald-950/70 uppercase">
                {t("resultEyebrow")}
              </p>
              <div className="py-10">
                <p className="text-7xl leading-none font-semibold tracking-[-0.06em]">
                  {t("resultValue")}
                </p>
                <p className="mt-4 max-w-48 text-base leading-relaxed font-medium">
                  {t("resultLabel")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-pill rounded-xl px-5 py-5">
                <p className="text-3xl font-semibold tracking-tight tabular-nums text-zinc-50">
                  {t("metricLeadsValue")}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                  {t("metricLeadsLabel")}
                </p>
              </div>
              <div className="glass-pill rounded-xl px-5 py-5">
                <p className="text-3xl font-semibold tracking-tight tabular-nums text-zinc-50">
                  {t("metricTimeValue")}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                  {t("metricTimeLabel")}
                </p>
              </div>
            </div>
          </aside>
        </motion.div>
      </div>
    </section>
  );
}
