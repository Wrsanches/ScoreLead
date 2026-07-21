"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, ArrowRight, Check, ChevronDown, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import {
  createContactSchema,
  inquiryTypes,
  type ContactFormValues,
  type ContactSubmission,
} from "@/lib/validations/contact"

const inputClassName =
  "w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-3.5 py-3 text-base text-zinc-100 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-zinc-600 hover:border-zinc-700 focus:border-emerald-500/60 focus:bg-zinc-900/70 focus:ring-3 focus:ring-emerald-500/10 aria-invalid:border-red-400/60 aria-invalid:ring-3 aria-invalid:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"

const MESSAGE_MAX_LENGTH = 5_000

const defaultValues = {
  name: "",
  email: "",
  company: "",
  subject: "",
  message: "",
  website: "",
} satisfies Partial<ContactFormValues>

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null

  return (
    <p id={id} role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

export function ContactForm() {
  const t = useTranslations("contact")
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState("")

  const schema = useMemo(
    () => createContactSchema({
      nameRequired: t("validation.nameRequired"),
      nameTooLong: t("validation.nameTooLong"),
      emailInvalid: t("validation.emailInvalid"),
      companyTooLong: t("validation.companyTooLong"),
      inquiryRequired: t("validation.inquiryRequired"),
      subjectTooShort: t("validation.subjectTooShort"),
      subjectTooLong: t("validation.subjectTooLong"),
      messageTooShort: t("validation.messageTooShort"),
      messageTooLong: t("validation.messageTooLong"),
    }),
    [t],
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues, undefined, ContactSubmission>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  })

  const inquiryValue = watch("inquiryType")
  const messageLength = (watch("message") ?? "").length

  const inquiryOptions = [
    { value: "sales", title: t("salesTitle"), description: t("salesDescription") },
    { value: "support", title: t("supportTitle"), description: t("supportDescription") },
    { value: "partnership", title: t("partnershipTitle"), description: t("partnershipDescription") },
  ] satisfies { value: (typeof inquiryTypes)[number]; title: string; description: string }[]

  async function onSubmit(values: ContactSubmission) {
    setServerError("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        setServerError(response.status === 429 ? t("rateLimited") : t("sendError"))
        return
      }

      reset(defaultValues)
      setSubmitted(true)
    } catch {
      setServerError(t("sendError"))
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {t("inquiriesTitle")}
        </h2>

        <div className="mt-4 border-y border-zinc-800/60" role="group" aria-label={t("inquiryType")}>
          {inquiryOptions.map((option) => {
            const active = inquiryValue === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setValue("inquiryType", option.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className="group flex w-full items-start justify-between gap-4 border-b border-zinc-800/60 py-5 text-left last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400"
              >
                <span>
                  <span
                    className={`block text-sm font-medium transition-colors ${
                      active ? "text-white" : "text-zinc-300 group-hover:text-zinc-100"
                    }`}
                  >
                    {option.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-zinc-500">
                    {option.description}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2 shrink-0 rounded-full transition-all duration-200 ${
                    active
                      ? "bg-emerald-400 ring-4 ring-emerald-400/15"
                      : "ring-1 ring-inset ring-zinc-700 group-hover:ring-zinc-500"
                  }`}
                />
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          <a
            href="mailto:hello@scorelead.io"
            className="rounded-sm text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            hello@scorelead.io
          </a>
          <p className="mt-1.5 text-xs text-zinc-600">{t("responseTime")}</p>
        </div>
      </aside>

      {submitted ? (
        <div role="status" className="py-2 sm:py-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            <Check className="size-3.5" aria-hidden="true" />
            {t("sentLabel")}
          </p>
          <div className="mt-6 max-w-md">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              {t("successTitle")}
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-400">
              {t("successDescription")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-zinc-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#09090B]"
          >
            {t("sendAnother")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-9">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
              {t("formTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {t("formDescription")}
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-md border border-red-500/25 bg-red-500/8 p-3.5 text-sm leading-5 text-red-200"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-zinc-300">
                  {t("name")} <span className="text-emerald-400" aria-hidden="true">*</span>
                </label>
                <input
                  {...register("name")}
                  id="contact-name"
                  type="text"
                  required
                  autoComplete="name"
                  enterKeyHint="next"
                  placeholder={t("namePlaceholder")}
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  className={inputClassName}
                />
                <FieldError id="contact-name-error" message={errors.name?.message} />
              </div>

              <div>
                <label htmlFor="contact-company" className="mb-2 block text-sm font-medium text-zinc-300">
                  {t("company")} <span className="font-normal text-zinc-600">{t("optional")}</span>
                </label>
                <input
                  {...register("company")}
                  id="contact-company"
                  type="text"
                  autoComplete="organization"
                  enterKeyHint="next"
                  placeholder={t("companyPlaceholder")}
                  aria-invalid={errors.company ? "true" : "false"}
                  aria-describedby={errors.company ? "contact-company-error" : undefined}
                  className={inputClassName}
                />
                <FieldError id="contact-company-error" message={errors.company?.message} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-zinc-300">
                  {t("email")} <span className="text-emerald-400" aria-hidden="true">*</span>
                </label>
                <input
                  {...register("email")}
                  id="contact-email"
                  type="email"
                  inputMode="email"
                  required
                  autoComplete="email"
                  enterKeyHint="next"
                  placeholder={t("emailPlaceholder")}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  className={inputClassName}
                />
                <FieldError id="contact-email-error" message={errors.email?.message} />
              </div>

              <div>
                <label htmlFor="contact-inquiry" className="mb-2 block text-sm font-medium text-zinc-300">
                  {t("inquiryType")} <span className="text-emerald-400" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register("inquiryType")}
                    id="contact-inquiry"
                    required
                    defaultValue=""
                    aria-invalid={errors.inquiryType ? "true" : "false"}
                    aria-describedby={errors.inquiryType ? "contact-inquiry-error" : undefined}
                    className={`${inputClassName} appearance-none pr-10 ${inquiryValue ? "" : "text-zinc-600"}`}
                  >
                    <option value="" disabled>{t("chooseType")}</option>
                    <option value="sales">{t("sales")}</option>
                    <option value="support">{t("support")}</option>
                    <option value="partnership">{t("partnership")}</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                    aria-hidden="true"
                  />
                </div>
                <FieldError id="contact-inquiry-error" message={errors.inquiryType?.message} />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium text-zinc-300">
                {t("subject")} <span className="text-emerald-400" aria-hidden="true">*</span>
              </label>
              <input
                {...register("subject")}
                id="contact-subject"
                type="text"
                required
                maxLength={160}
                enterKeyHint="next"
                placeholder={t("subjectPlaceholder")}
                aria-invalid={errors.subject ? "true" : "false"}
                aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                className={inputClassName}
              />
              <FieldError id="contact-subject-error" message={errors.subject?.message} />
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-300">
                  {t("message")} <span className="text-emerald-400" aria-hidden="true">*</span>
                </label>
                {messageLength > 0 && (
                  <span
                    aria-hidden="true"
                    className={`font-mono text-[11px] tabular-nums ${
                      messageLength > MESSAGE_MAX_LENGTH - 250 ? "text-amber-400/90" : "text-zinc-600"
                    }`}
                  >
                    {messageLength.toLocaleString()} / {MESSAGE_MAX_LENGTH.toLocaleString()}
                  </span>
                )}
              </div>
              <textarea
                {...register("message")}
                id="contact-message"
                required
                maxLength={MESSAGE_MAX_LENGTH}
                rows={7}
                enterKeyHint="send"
                placeholder={t("messagePlaceholder")}
                aria-invalid={errors.message ? "true" : "false"}
                aria-describedby={errors.message ? "contact-message-error contact-privacy" : "contact-privacy"}
                className={`${inputClassName} min-h-44 resize-y leading-6`}
              />
              <FieldError id="contact-message-error" message={errors.message?.message} />
            </div>

            <div className="absolute -left-[9999px] top-auto size-px overflow-hidden" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                {...register("website")}
                id="contact-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col-reverse gap-4 border-t border-zinc-800/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p id="contact-privacy" className="max-w-xs text-xs leading-5 text-zinc-600">
                {t("privacy")}
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-zinc-950 transition-[background-color,transform] hover:bg-emerald-300 active:translate-y-px disabled:cursor-wait disabled:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-3 focus-visible:ring-offset-[#09090B]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    {t("submit")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
