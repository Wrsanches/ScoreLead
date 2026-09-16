"use client"

import { useState, Suspense } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Lock, CheckCircle2, ArrowLeft } from "lucide-react"
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
  PasswordToggle,
  authLinkClass,
} from "@/components/auth-layout"
import { authClient } from "@/lib/auth-client"
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth"

function ResetPasswordForm() {
  const t = useTranslations("auth")
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  // better-auth redirects here with ?error=INVALID_TOKEN when the link is bad.
  const linkError = searchParams.get("error")
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onSubmit(data: ResetPasswordValues) {
    if (!token) return
    setServerError("")

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    })

    if (error) {
      setServerError(error.message || t("resetPasswordError"))
      return
    }

    setDone(true)
  }

  const invalidLink = !token || linkError

  return (
    <AuthLayout
      brandingHeading={t("brandingHeadingLogin")}
      brandingDescription={t("brandingDescLogin")}
    >
      <AuthCard>
        {done ? (
          <AuthSuccess
            icon={CheckCircle2}
            title={t("resetPasswordDoneTitle")}
            description={t("resetPasswordDoneDesc")}
          />
        ) : invalidLink ? (
          <AuthSuccess title={t("resetPasswordInvalidTitle")} description={t("resetPasswordInvalidDesc")}>
            <Link
              href="/forgot-password"
              className="press mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-emerald-500 font-semibold text-zinc-950 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
            >
              {t("resetPasswordRequestNew")}
            </Link>
          </AuthSuccess>
        ) : (
          <>
            <AuthHeader title={t("resetPasswordTitle")} subtitle={t("resetPasswordSubtitle")} />

            {serverError && <AuthAlert tone="error">{serverError}</AuthAlert>}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <AuthField
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                label={t("newPassword")}
                icon={Lock}
                placeholder="••••••••"
                hint={t("passwordHint")}
                error={errors.password?.message}
                trailing={
                  <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                }
              />

              <AuthSubmitButton loading={isSubmitting}>{t("resetPasswordButton")}</AuthSubmitButton>
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
