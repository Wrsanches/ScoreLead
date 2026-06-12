"use client"

import { useState, Suspense } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { Link } from "@/i18n/routing"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AuthLayout } from "@/components/auth-layout"
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
    formState: { isSubmitting },
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
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-8 shadow-2xl shadow-black/20 relative overflow-hidden">
        <div className="absolute inset-0 rounded-xl bg-linear-to-b from-zinc-800/10 to-transparent pointer-events-none" />

        <div className="relative">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h1 className="text-white text-2xl font-semibold tracking-tight">
                {t("resetPasswordDoneTitle")}
              </h1>
              <p className="text-zinc-500 text-sm mt-3">
                {t("resetPasswordDoneDesc")}
              </p>
            </div>
          ) : invalidLink ? (
            <div className="text-center">
              <h1 className="text-white text-2xl font-semibold tracking-tight">
                {t("resetPasswordInvalidTitle")}
              </h1>
              <p className="text-zinc-500 text-sm mt-3">
                {t("resetPasswordInvalidDesc")}
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center gap-2 mt-6 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg transition-all duration-200"
              >
                {t("resetPasswordRequestNew")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-white text-2xl font-semibold tracking-tight">
                  {t("resetPasswordTitle")}
                </h1>
                <p className="text-zinc-500 text-sm mt-2">
                  {t("resetPasswordSubtitle")}
                </p>
              </div>

              {serverError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {serverError}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm text-zinc-400 mb-1.5 font-medium"
                  >
                    {t("newPassword")}
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
                  <p className="text-xs text-zinc-600 mt-1.5">
                    {t("passwordHint")}
                  </p>
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
                      {t("resetPasswordButton")}
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-zinc-500 mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("backToLogin")}
        </Link>
      </p>
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
