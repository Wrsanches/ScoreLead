"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Menu, X, LayoutDashboard } from "lucide-react"
import { ScoreLeadLogo } from "./scorelead-logo"
import { LanguageSwitcher } from "./language-switcher"
import { Link } from "@/i18n/routing"
import { authClient } from "@/lib/auth-client"

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
      <span className="text-xs font-semibold text-emerald-400">{initials}</span>
    </div>
  )
}

export function Navbar() {
  const t = useTranslations("nav")
  const [open, setOpen] = useState(false)
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!open) return
    const handleScroll = () => setOpen(false)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [open])

  const links = [
    { id: "customers", label: t("results") },
    { id: "features", label: t("features") },
    { id: "ai", label: t("ai") },
    { id: "pipeline", label: t("pipeline") },
  ]

  const isLoggedIn = !!session?.user

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-[#09090B]/80 backdrop-blur-md">
      <div className="w-full flex justify-center px-6 py-4">
        <div className="w-full max-w-4xl flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2">
            <ScoreLeadLogo className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">ScoreLead</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a key={link.id} href={`#${link.id}`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {isPending ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-4 w-14 rounded bg-zinc-800" />
                <div className="h-8 w-24 rounded-md bg-zinc-800" />
              </div>
            ) : isLoggedIn ? (
              <Link
                href="/admin"
                className="flex items-center gap-2.5 text-sm text-zinc-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/50"
              >
                <UserAvatar name={session.user.name || ""} />
                <span className="font-medium">{t("dashboard")}</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3.5 py-1.5 rounded-md transition-colors font-medium"
                >
                  {t("signUp")}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="md:hidden text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-[#09090B]/95 backdrop-blur-md px-6 pb-6 pt-4">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
              <LanguageSwitcher />
              {isPending ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="h-4 w-14 rounded bg-zinc-800" />
                  <div className="h-8 w-20 rounded-md bg-zinc-800" />
                </div>
              ) : isLoggedIn ? (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  <UserAvatar name={session.user.name || ""} />
                  <span className="font-medium">{t("dashboard")}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3.5 py-1.5 rounded-md transition-colors font-medium"
                  >
                    {t("signUp")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
