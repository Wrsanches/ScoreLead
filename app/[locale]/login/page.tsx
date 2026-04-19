"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { Link } from "@/i18n/routing"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AuthLayout, GoogleButton, OrDivider } from "@/components/auth-layout"
import { authClient } from "@/lib/auth-client"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"

export default function LoginPage() {
  const t = useTranslations("auth")
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginValues) {
    setServerError("")

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError(error.message || t("loginError"))
      return
    }

    window.location.href = "/admin"
  }

  function handleGoogleSignIn() {
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/admin",
    })
  }

  return (
    <AuthLayout
      brandingHeading={t("brandingHeadingLogin")}
      brandingDescription={t("brandingDescLogin")}
    >
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-8 shadow-2xl shadow-black/20 relative overflow-hidden">
        <div className="absolute inset-0 rounded-xl bg-linear-to-b from-zinc-800/10 to-transparent pointer-events-none" />

        <div className="relative">
          <div className="mb-8">
            <h1 className="text-white text-2xl font-semibold tracking-tight">
              {t("loginTitle")}
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              {t("loginSubtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
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
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm text-zinc-400 font-medium"
                >
                  {t("password")}
                </label>
                <button
                  type="button"
                  className="text-xs text-zinc-500 hover:text-emerald-400 cursor-pointer transition-colors duration-200"
                >
                  {t("forgotPassword")}
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors duration-200 group-focus-within:text-zinc-400" />
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
                  {t("loginButton")}
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>

      <p className="text-center text-sm text-zinc-500 mt-6">
        {t("noAccount")}{" "}
        <Link
          href="/signup"
          className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-medium"
        >
          {t("signUpLink")}
        </Link>
      </p>
    </AuthLayout>
  )
}
