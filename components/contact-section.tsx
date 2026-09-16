"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { ContactForm } from "@/components/contact-form"

export function ContactSection() {
  const t = useTranslations("contact")

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 flex items-center gap-3"
      >
        <span className="h-px w-8 bg-zinc-500" aria-hidden="true" />
        <span className="text-sm text-zinc-400">{t("eyebrow")}</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-3xl text-4xl text-white sm:text-5xl lg:text-[56px]"
        style={{
          letterSpacing: "-0.0325em",
          fontVariationSettings: '"opsz" 28',
          fontWeight: 538,
          lineHeight: 1.05,
        }}
      >
        {t("title")}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8"
      >
        {t("description")}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-12 border-t border-white/[0.08] pt-10 sm:mt-16 sm:pt-12"
      >
        <ContactForm />
      </motion.div>
    </section>
  )
}
