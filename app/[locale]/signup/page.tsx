"use client"

import { useState, useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Mail, Lock, User, MailCheck } from "lucide-react"
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
  GoogleButton,
  OrDivider,
  PasswordToggle,
  authLinkClass,
} from "@/components/auth-layout"
import { PublicSiteLink } from "@/components/public-site-link"
import { authClient } from "@/lib/auth-client"
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth"
import { trackMarketingEvent } from "@/lib/analytics-events"

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: "", color: "" }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    const levels = [
      { level: 1, label: "Weak", color: "bg-red-500" },
      { level: 2, label: "Fair", color: "bg-amber-500" },
      { level: 3, label: "Good", color: "bg-emerald-400" },
      { level: 4, label: "Strong", color: "bg-emerald-500" },
    ]
    return levels[score - 1] || { level: 0, label: "", color: "" }
  }, [password])

  // Always reserve the row so the form does not jump when typing starts.
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i <= strength.level ? strength.color : "bg-white/[0.07]"
            }`}
          />
        ))}
      </div>
      <span className="min-w-12 text-right text-xs text-zinc-500">{strength.label}</span>
    </div>
  )
}

export default function SignUpPage() {
  const t = useTranslations("auth")
  const locale = useLocale()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  const [verificationSentTo, setVerificationSentTo] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  })

  const password = watch("password", "")

  async function onSubmit(data: SignUpValues) {
    setServerError("")
    trackMarketingEvent("signup_start", {
      signup_method: "email",
      placement: "signup_form",
    })
    const onboardingPath =
      locale === "en" ? "/onboarding" : `/${locale}/onboarding`

    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      // Where the email verification link lands after verifying.
      callbackURL: `${onboardingPath}?signup=email`,
    })

    if (error) {
      setServerError(error.message || t("signUpError"))
      return
    }

    // Email verification is required, so there's no session yet. Show the
    // check-your-inbox state instead of redirecting.
    trackMarketingEvent("signup_submitted", { signup_method: "email" })
    setVerificationSentTo(data.email)
  }

  async function handleGoogleSignIn() {
    setServerError("")
    trackMarketingEvent("signup_start", { signup_method: "google" })
    const onboardingPath =
      locale === "en" ? "/onboarding" : `/${locale}/onboarding`
    const signupPath = locale === "en" ? "/signup" : `/${locale}/signup`
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${onboardingPath}?signup=google`,
      errorCallbackURL: signupPath,
    })

    if (error) setServerError(error.message || t("signUpError"))
  }

  const footer = (
    <AuthFooterLine>
      {t("hasAccount")}{" "}
      <Link href="/login" className={authLinkClass}>
        {t("loginLink")}
      </Link>
    </AuthFooterLine>
  )

  if (verificationSentTo) {
    return (
      <AuthLayout
        brandingHeading={t("brandingHeadingSignup")}
        brandingDescription={t("brandingDescSignup")}
      >
        <AuthCard>
          <AuthSuccess
            icon={MailCheck}
            title={t("verifyEmailTitle")}
            description={t("verifyEmailDesc", { email: verificationSentTo })}
            footnote={t("verifyEmailSpam")}
          />
        </AuthCard>
        {footer}
      </AuthLayout>
    )
  }

  const legalLinkClass =
    "rounded-sm text-zinc-300 underline decoration-white/20 underline-offset-2 transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"

  return (
    <AuthLayout
      brandingHeading={t("brandingHeadingSignup")}
      brandingDescription={t("brandingDescSignup")}
    >
      <AuthCard>
        <AuthHeader title={t("signUpTitle")} subtitle={t("signUpSubtitle")} />

        <GoogleButton onClick={handleGoogleSignIn} />

        <OrDivider label={t("orContinueWith")} />

        {serverError && <AuthAlert tone="error">{serverError}</AuthAlert>}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <AuthField
            {...register("name")}
            id="name"
            type="text"
            autoComplete="name"
            label={t("name")}
            icon={User}
            placeholder={t("namePlaceholder")}
            error={errors.name?.message}
          />

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

          <AuthField
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            label={t("password")}
            icon={Lock}
            placeholder="••••••••"
            hint={t("passwordHint")}
            error={errors.password?.message}
            trailing={
              <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            }
            below={<PasswordStrength password={password} />}
          />

          <div>
            <label htmlFor="terms" className="flex cursor-pointer items-start gap-2.5">
              <input
                {...register("terms")}
                id="terms"
                type="checkbox"
                aria-invalid={errors.terms ? true : undefined}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-black/20 accent-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              />
              <span className="text-xs leading-5 text-zinc-400">
                {t.rich("agreeTerms", {
                  terms: (chunks) => (
                    <PublicSiteLink href="/terms" target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
                      {chunks}
                    </PublicSiteLink>
                  ),
                  privacy: (chunks) => (
                    <PublicSiteLink href="/privacy" target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
                      {chunks}
                    </PublicSiteLink>
                  ),
                })}
              </span>
            </label>
            {errors.terms && (
              <p role="alert" className="mt-1.5 text-xs text-red-400">
                {t("agreeTermsRequired")}
              </p>
            )}
          </div>

          <AuthSubmitButton loading={isSubmitting}>{t("signUpButton")}</AuthSubmitButton>
        </form>
      </AuthCard>

      {footer}
    </AuthLayout>
  )
}
