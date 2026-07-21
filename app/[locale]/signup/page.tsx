"use client"

import { useState, useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2, MailCheck } from "lucide-react"
import { Link } from "@/i18n/routing"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AuthLayout, GoogleButton, OrDivider } from "@/components/auth-layout"
import { authClient } from "@/lib/auth-client"
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth"

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

  if (!password) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-2"
    >
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.level ? strength.color : "bg-zinc-800"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-zinc-500">{strength.label}</span>
    </motion.div>
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

    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      // Where the email verification link lands after verifying.
      callbackURL: locale === "en" ? "/onboarding" : `/${locale}/onboarding`,
    })

    if (error) {
      setServerError(error.message || t("signUpError"))
      return
    }

    // Email verification is required, so there's no session yet. Show the
    // check-your-inbox state instead of redirecting.
    setVerificationSentTo(data.email)
  }

  function handleGoogleSignIn() {
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding",
    })
  }

  if (verificationSentTo) {
    return (
      <AuthLayout
        brandingHeading={t("brandingHeadingSignup")}
        brandingDescription={t("brandingDescSignup")}
      >
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-8 shadow-2xl shadow-black/20 relative overflow-hidden">
          <div className="absolute inset-0 rounded-xl bg-linear-to-b from-zinc-800/10 to-transparent pointer-events-none" />
          <div className="relative text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <MailCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">
              {t("verifyEmailTitle")}
            </h1>
            <p className="text-zinc-500 text-sm mt-3">
              {t("verifyEmailDesc", { email: verificationSentTo })}
            </p>
            <p className="text-zinc-600 text-xs mt-6">{t("verifyEmailSpam")}</p>
          </div>
        </div>
        <p className="text-center text-sm text-zinc-500 mt-6">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-medium"
          >
            {t("loginLink")}
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      brandingHeading={t("brandingHeadingSignup")}
      brandingDescription={t("brandingDescSignup")}
    >
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-8 shadow-2xl shadow-black/20 relative overflow-hidden">
        <div className="absolute inset-0 rounded-xl bg-linear-to-b from-zinc-800/10 to-transparent pointer-events-none" />

        <div className="relative">
          <div className="mb-8">
            <h1 className="text-white text-2xl font-semibold tracking-tight">
              {t("signUpTitle")}
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              {t("signUpSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6 w-full">
            <GoogleButton onClick={handleGoogleSignIn} />
          </div>

          <OrDivider label={t("orContinueWith")} />

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm text-zinc-400 mb-1.5 font-medium"
              >
                {t("name")}
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors duration-200 group-focus-within:text-zinc-400" />
                <input
                  {...register("name")}
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder={t("namePlaceholder")}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-base text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm text-zinc-400 mb-1.5 font-medium"
              >
                {t("email")}
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors duration-200 group-focus-within:text-zinc-400" />
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-base text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm text-zinc-400 mb-1.5 font-medium"
              >
                {t("password")}
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors duration-200 group-focus-within:text-zinc-400" />
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="--------"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-base text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <PasswordStrength password={password} />
              <p className="text-xs text-zinc-600 mt-1.5">
                {t("passwordHint")}
              </p>
            </div>

            <div>
              <label
                htmlFor="terms"
                className="flex items-start gap-2.5 cursor-pointer"
              >
                <input
                  {...register("terms")}
                  id="terms"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-700/50 bg-zinc-800/30 accent-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                />
                <span className="text-xs text-zinc-500">
                  {t.rich("agreeTerms", {
                    terms: (chunks) => (
                      <Link
                        href="/terms"
                        target="_blank"
                        className="rounded-sm text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                      >
                        {chunks}
                      </Link>
                    ),
                    privacy: (chunks) => (
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="rounded-sm text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-400 text-xs mt-1.5">
                  {t("agreeTermsRequired")}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={isSubmitting ? {} : { scale: 1.01 }}
              whileTap={isSubmitting ? {} : { scale: 0.99 }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/10"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t("signUpButton")}
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>

      <p className="text-center text-sm text-zinc-500 mt-6">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-medium"
        >
          {t("loginLink")}
        </Link>
      </p>
    </AuthLayout>
  )
}
