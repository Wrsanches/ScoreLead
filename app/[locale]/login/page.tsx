"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Mail, Lock } from "lucide-react"
import { getPathname, Link } from "@/i18n/routing"
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
  GoogleButton,
  OrDivider,
  PasswordToggle,
  authLinkClass,
} from "@/components/auth-layout"
import { authClient } from "@/lib/auth-client"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"

export default function LoginPage() {
  const t = useTranslations("auth")
  const locale = useLocale()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  const [unverifiedNotice, setUnverifiedNotice] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginValues) {
    setServerError("")
    setUnverifiedNotice(false)

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    })

    if (error) {
      // Unverified accounts get a 403; better-auth re-sends the
      // verification email automatically on this attempt.
      if (error.status === 403) {
        setUnverifiedNotice(true)
        return
      }
      setServerError(error.message || t("loginError"))
      return
    }

    window.location.href = getPathname({ locale, href: "/admin" })
  }

  async function handleGoogleSignIn() {
    setServerError("")
    const loginPath = getPathname({ locale, href: "/login" })
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: getPathname({ locale, href: "/admin" }),
      errorCallbackURL: loginPath,
    })

    if (error) setServerError(error.message || t("loginError"))
  }

  return (
    <AuthLayout
      brandingHeading={t("brandingHeadingLogin")}
      brandingDescription={t("brandingDescLogin")}
    >
      <AuthCard>
        <AuthHeader title={t("loginTitle")} subtitle={t("loginSubtitle")} />

        <GoogleButton onClick={handleGoogleSignIn} />

        <OrDivider label={t("orContinueWith")} />

        {serverError && <AuthAlert tone="error">{serverError}</AuthAlert>}
        {unverifiedNotice && <AuthAlert tone="success">{t("emailNotVerified")}</AuthAlert>}

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

          <AuthField
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            label={t("password")}
            icon={Lock}
            placeholder="••••••••"
            error={errors.password?.message}
            action={
              <Link
                href="/forgot-password"
                className="text-xs text-zinc-500 transition-colors duration-150 hover:text-emerald-400 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                {t("forgotPassword")}
              </Link>
            }
            trailing={
              <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            }
          />

          <AuthSubmitButton loading={isSubmitting}>{t("loginButton")}</AuthSubmitButton>
        </form>
      </AuthCard>

      <AuthFooterLine>
        {t("noAccount")}{" "}
        <Link href="/signup" className={authLinkClass}>
          {t("signUpLink")}
        </Link>
      </AuthFooterLine>
    </AuthLayout>
  )
}
