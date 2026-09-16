"use client"

import { useState, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { ScoreLeadLogo } from "./scorelead-logo"
import { LanguageSwitcher } from "./language-switcher"
import { Link } from "@/i18n/routing"
import { authClient } from "@/lib/auth-client"
import { TrackedLink } from "./tracked-link"
import { getAppLinkHref } from "@/lib/site-urls"
import { useCurrentOrigin } from "@/lib/use-current-origin"

function UserAvatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  if (image) {
    return (
      <span className="relative block w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/[0.14]">
        <Image
          src={image}
          alt=""
          fill
          sizes="32px"
          className="object-cover"
          unoptimized
        />
      </span>
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
      <span className="text-xs font-semibold text-emerald-400">{initials}</span>
    </div>
  )
}

export function Navbar() {
  const t = useTranslations("nav")
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const origin = useCurrentOrigin()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const appHref = (path: string) => getAppLinkHref(path, locale, origin)

  useEffect(() => {
    if (!open) return
    const handleScroll = () => setOpen(false)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [open])

  const links = [
    { href: "/#customers" as const, label: t("results") },
    { href: "/#features" as const, label: t("features") },
    { href: "/#ai" as const, label: t("ai") },
    { href: "/#pipeline" as const, label: t("pipeline") },
    { href: "/#pricing" as const, label: t("pricing") },
  ]

  const isLoggedIn = !!session?.user

  return (
    <nav className="fixed top-3 inset-x-3 sm:inset-x-6 z-50 flex justify-center">
      <div className="glass-strong w-full max-w-4xl rounded-[20px]">
        <div className="flex items-center justify-between px-4 sm:px-5 h-14">
          <Link
            href="/#hero"
            className="-ml-2 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.06]"
          >
            <ScoreLeadLogo className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">ScoreLead</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {sessionPending ? (
              <div className="w-24 h-8 rounded-lg bg-white/[0.07] animate-pulse" aria-hidden="true" />
            ) : isLoggedIn ? (
              <a
                href={appHref("/admin")}
                className="flex items-center gap-2.5 text-sm text-zinc-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.06]"
              >
                <UserAvatar name={session.user.name || ""} image={session.user.image} />
                <span className="font-medium">{t("dashboard")}</span>
              </a>
            ) : (
              <>
                <a
                  href={appHref("/login")}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {t("login")}
                </a>
                <TrackedLink
                  href="/signup"
                  eventName="signup_start"
                  eventParams={{ placement: "navbar_desktop" }}
                  className="press transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3.5 py-1.5 rounded-lg font-medium"
                >
                  {t("signUp")}
                </TrackedLink>
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
        <div className="md:hidden border-t border-white/[0.08] px-5 pb-6 pt-4">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <LanguageSwitcher />
              {sessionPending ? (
                <div className="w-28 h-8 rounded-lg bg-white/[0.07] animate-pulse" aria-hidden="true" />
              ) : isLoggedIn ? (
                <a
                  href={appHref("/admin")}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  <UserAvatar name={session.user.name || ""} image={session.user.image} />
                  <span className="font-medium">{t("dashboard")}</span>
                </a>
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href={appHref("/login")}
                    onClick={() => setOpen(false)}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {t("login")}
                  </a>
                  <TrackedLink
                    href="/signup"
                    eventName="signup_start"
                    eventParams={{ placement: "navbar_mobile" }}
                    onClick={() => setOpen(false)}
                    className="press transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3.5 py-1.5 rounded-lg font-medium"
                  >
                    {t("signUp")}
                  </TrackedLink>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
