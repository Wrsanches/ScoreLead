"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Mail, MailCheck, ArrowLeft } from "lucide-react"
import { Link } from "@/i18n/routing"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthFooterLine,
  AuthHeader,
  AuthLayout,
  AuthSubmitButton,
  AuthSuccess,
  authLinkClass,
} from "@/components/auth-layout"
import { authClient } from "@/lib/auth-client"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth"

export default function ForgotPasswordPage() {
  const t = useTranslations("auth")
  const locale = useLocale()
  const [sentTo, setSentTo] = useState("")
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordValues) {
    setServerError("")

    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo:
        locale === "en" ? "/reset-password" : `/${locale}/reset-password`,
    })

    if (error) {
      setServerError(error.message || t("forgotPasswordError"))
      return
    }

    // Always show success - don't reveal whether the email exists.
    setSentTo(data.email)
  }

  return (
    <AuthLayout
      brandingHeading={t("brandingHeadingLogin")}
      brandingDescription={t("brandingDescLogin")}
    >
      <AuthCard>
        {sentTo ? (
          <AuthSuccess
            icon={MailCheck}
            title={t("forgotPasswordSentTitle")}
            description={t("forgotPasswordSentDesc", { email: sentTo })}
            footnote={t("verifyEmailSpam")}
          />
        ) : (
          <>
            <AuthHeader title={t("forgotPasswordTitle")} subtitle={t("forgotPasswordSubtitle")} />

            {serverError && <AuthAlert tone="error">{serverError}</AuthAlert>}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <AuthField
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                label={t("email")}
                icon={Mail}
                placeholder={t("emailPlaceholder")}
                error={errors.email?.message}
              />

              <AuthSubmitButton loading={isSubmitting}>{t("forgotPasswordButton")}</AuthSubmitButton>
            </form>
          </>
        )}
      </AuthCard>

      <AuthFooterLine>
        <Link href="/login" className={`inline-flex items-center gap-1.5 ${authLinkClass}`}>
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          {t("backToLogin")}
        </Link>
      </AuthFooterLine>
    </AuthLayout>
  )
}
