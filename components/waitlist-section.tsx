"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Mail, Send } from "lucide-react"

type ContactForm = {
  email: string
}

export function WaitlistSection() {
  const t = useTranslations("waitlist")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>()

  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })
      if (!res.ok) throw new Error("Failed")
      setSubmitted(true)
    } catch {
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="waitlist" className="relative py-32 px-6 overflow-hidden" style={{ backgroundColor: "#09090B" }}>
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1000px",
          height: "700px",
          background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 40%, transparent 70%)",
        }}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("badge")}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium text-white tracking-tight mb-6"
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
          className="text-zinc-400 text-lg mb-12 max-w-md mx-auto"
        >
          {t("description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="max-w-md mx-auto">
            <div role="status" aria-live="polite">
              {submitted ? (
                <div className="flex items-center justify-center gap-3 py-5 px-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  </div>
                  <span className="text-zinc-200 text-sm">{t("success")}</span>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit(onSubmit)} className="flex items-stretch gap-2 p-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50">
                    <label htmlFor="contact-email" className="sr-only">{t("placeholder")}</label>
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder={t("placeholder")}
                        aria-describedby={errors.email || error ? "contact-error" : undefined}
                        {...register("email", {
                          required: t("emailRequired"),
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: t("emailInvalid"),
                          },
                          onChange: () => { if (error) setError("") },
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-lg transition-colors text-sm shrink-0 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? t("sending") : t("ctaSales")}
                      {!loading && <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                  {(errors.email || error) && (
                    <p id="contact-error" role="alert" className="text-red-400 text-xs mt-2">
                      {errors.email?.message || error}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
