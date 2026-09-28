"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { ScoreLeadLogo } from "./scorelead-logo";
import { LanguageSwitcher } from "./language-switcher";
import { Link } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { TrackedLink } from "./tracked-link";
import { getAppLinkHref } from "@/lib/site-urls";
import { useCurrentOrigin } from "@/lib/use-current-origin";
import styles from "./navbar.module.css";
import { useNavContrast } from "./use-nav-contrast";

function UserAvatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

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
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
      <span className="text-xs font-semibold text-emerald-400">{initials}</span>
    </div>
  );
}

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  useNavContrast(navRef);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const origin = useCurrentOrigin();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const appHref = (path: string) => getAppLinkHref(path, locale, origin);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    function handlePointer(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (
        !navRef.current?.contains(target) &&
        !target.closest('[data-slot="select-content"]')
      )
        setOpen(false);
    }
    const desktop = window.matchMedia("(min-width: 1280px)");
    const handleResize = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);
    desktop.addEventListener("change", handleResize);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
      desktop.removeEventListener("change", handleResize);
    };
  }, [open]);

  const links = [
    { href: "/#customers" as const, label: t("results") },
    { href: "/#features" as const, label: t("features") },
    { href: "/#ai" as const, label: t("ai") },
    { href: "/#pipeline" as const, label: t("pipeline") },
    { href: "/#pricing" as const, label: t("pricing") },
  ];

  const isLoggedIn = !!session?.user;

  return (
    <nav
      ref={navRef}
      aria-label={t("navigation")}
      className="marketing-nav fixed top-3 inset-x-3 sm:inset-x-6 z-50 flex justify-center"
    >
      <div className="glass-strong relative w-full min-w-0 max-w-6xl rounded-[20px]">
        <div className="relative flex h-16 items-center justify-between gap-2 px-3 sm:px-5">
          <Link
            href="/#hero"
            data-nav-contrast="dark"
            onClick={() => setOpen(false)}
            className={`${styles.adaptive} flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400`}
          >
            <ScoreLeadLogo className={`w-5 h-5 ${styles.ink}`} />
            <span className={`${styles.ink} font-semibold`}>ScoreLead</span>
          </Link>

          <div className="hidden xl:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-nav-contrast="dark"
                className={`${styles.adaptive} inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm transition-colors`}
              >
                <span className={styles.ink}>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              data-nav-contrast="dark"
              className={`${styles.adaptive} hidden md:block`}
            >
              <LanguageSwitcher className={styles.languageSwitcher} />
            </div>
            <div className="hidden xl:flex items-center gap-3">
              {sessionPending ? (
                <div
                  className="w-24 h-8 rounded-lg bg-white/[0.07] animate-pulse"
                  aria-hidden="true"
                />
              ) : isLoggedIn ? (
                <a
                  href={appHref("/admin")}
                  data-nav-contrast="dark"
                  className={`${styles.adaptive} flex min-h-11 items-center gap-2.5 text-sm transition-colors px-3 py-1.5 rounded-lg`}
                >
                  <UserAvatar
                    name={session.user.name || ""}
                    image={session.user.image}
                  />
                  <span className={`${styles.ink} font-medium`}>
                    {t("dashboard")}
                  </span>
                </a>
              ) : (
                <>
                  <a
                    href={appHref("/login")}
                    data-nav-contrast="dark"
                    className={`${styles.adaptive} inline-flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400`}
                  >
                    <span className={styles.ink}>{t("login")}</span>
                  </a>
                  <TrackedLink
                    href="/signup"
                    eventName="signup_start"
                    eventParams={{ placement: "navbar_desktop" }}
                    className="press transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] text-sm bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-3.5 py-2.5 min-h-11 inline-flex items-center justify-center rounded-lg font-medium"
                  >
                    {t("signUp")}
                  </TrackedLink>
                </>
              )}
            </div>

            <button
              ref={menuButtonRef}
              type="button"
              data-nav-contrast="dark"
              onClick={() => setOpen(!open)}
              className={`${styles.adaptive} inline-flex size-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 xl:hidden`}
              aria-label={open ? t("closeMenu") : t("openMenu")}
              aria-expanded={open}
              aria-controls="marketing-mobile-menu"
            >
              {open ? (
                <X className={`w-5 h-5 ${styles.ink}`} />
              ) : (
                <Menu className={`w-5 h-5 ${styles.ink}`} />
              )}
            </button>
          </div>
        </div>

        {open && (
          <div
            id="marketing-mobile-menu"
            className="relative max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-b-[20px] bg-zinc-950/95 border-t border-white/[0.08] px-3 pb-4 pt-3 sm:px-5 xl:hidden"
          >
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/[0.08] px-3 pt-4 md:hidden">
                <span className="text-sm text-zinc-400">{t("language")}</span>
                <LanguageSwitcher />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.08] px-3 pt-4">
                {sessionPending ? (
                  <div
                    className="w-28 h-8 rounded-lg bg-white/[0.07] animate-pulse"
                    aria-hidden="true"
                  />
                ) : isLoggedIn ? (
                  <a
                    href={appHref("/admin")}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center gap-2.5 text-sm text-zinc-300 hover:text-white transition-colors"
                  >
                    <UserAvatar
                      name={session.user.name || ""}
                      image={session.user.image}
                    />
                    <span className="font-medium">{t("dashboard")}</span>
                  </a>
                ) : (
                  <div className="flex w-full flex-wrap items-center gap-3">
                    <a
                      href={appHref("/login")}
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
                    >
                      {t("login")}
                    </a>
                    <TrackedLink
                      href="/signup"
                      eventName="signup_start"
                      eventParams={{ placement: "navbar_mobile" }}
                      onClick={() => setOpen(false)}
                      className="press transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] text-sm bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-3.5 py-2.5 min-h-11 inline-flex items-center justify-center rounded-lg font-medium"
                    >
                      {t("signUp")}
                    </TrackedLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
