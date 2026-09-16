"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { motion, MotionConfig } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";
import { ScoreLeadLogo } from "@/components/scorelead-logo";
import { PublicSiteLink } from "@/components/public-site-link";

/*
 * Auth surfaces follow the site's glass system the way Apple frames it: the
 * form is a functional layer and sits on Liquid Glass; the branding column is
 * content and sits on quieter standard material. Motion is a single eased
 * entrance per column, honouring reduced-motion.
 */

const EASE = [0.23, 1, 0.32, 1] as [number, number, number, number];

const avatars = [
  "/images/avatars/team-1.jpg",
  "/images/avatars/team-2.jpg",
  "/images/avatars/team-3.jpg",
  "/images/avatars/team-4.jpg",
  "/images/avatars/team-5.jpg",
];

function AvatarStack({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2.5">
        {avatars.map((src, i) => (
          <Image
            key={i}
            src={src}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-[#09090b] outline outline-1 -outline-offset-1 outline-white/10"
          />
        ))}
      </div>
      <span className="ml-1 text-sm leading-snug text-zinc-300">{label}</span>
    </div>
  );
}

function BrandingSide({
  heading,
  description,
  joinLabel,
  stats,
}: {
  heading: string;
  description: string;
  joinLabel: string;
  stats: { value: string; label: string }[];
}) {
  return (
    <div className="hidden lg:flex lg:w-[31rem] lg:shrink-0 items-center justify-end">
      <motion.div
        className="max-w-md px-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <PublicSiteLink href="/" className="mb-10 flex items-center gap-3">
          <ScoreLeadLogo className="h-9 w-9 text-white" />
          <span className="text-2xl font-semibold tracking-tight text-white">ScoreLead</span>
        </PublicSiteLink>

        <h2
          className="mb-4 whitespace-pre-line text-[2.25rem] text-white"
          style={{
            letterSpacing: "-0.0325em",
            fontVariationSettings: '"opsz" 28',
            fontWeight: 538,
            lineHeight: 1.1,
          }}
        >
          {heading}
        </h2>
        <p className="mb-10 max-w-sm text-base leading-relaxed text-zinc-300">{description}</p>

        <AvatarStack label={joinLabel} />

        <div className="mt-12 grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="surface-card rounded-2xl px-4 py-3.5">
              <div className="text-lg font-semibold tracking-tight text-white">{stat.value}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Form primitives ---------- */

export function AuthCard({ children }: { children: ReactNode }) {
  return <div className="glass-strong rounded-3xl p-7 sm:p-8">{children}</div>;
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p> : null}
    </div>
  );
}

export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const styles =
    tone === "error"
      ? "bg-red-500/10 ring-red-500/25 text-red-300"
      : "bg-emerald-500/10 ring-emerald-500/25 text-emerald-300";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-4 rounded-xl px-3.5 py-3 text-sm leading-5 ring-1 ring-inset ${styles}`}
    >
      {children}
    </div>
  );
}

const inputClass =
  "peer h-11 w-full rounded-xl bg-black/20 pl-10 pr-4 text-base text-white ring-1 ring-inset ring-white/[0.08] placeholder:text-zinc-600 transition-[box-shadow,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus:bg-black/30 focus:outline-none focus:ring-emerald-500/50 aria-[invalid=true]:ring-red-500/50";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Small link or action rendered on the label row, right aligned. */
  action?: ReactNode;
  /** Control rendered inside the field on the right, e.g. a password toggle. */
  trailing?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Rendered directly under the input, above the hint (e.g. a strength meter). */
  below?: ReactNode;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, icon: Icon, action, trailing, hint, error, below, className, ...props },
  ref,
) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`${inputClass} ${trailing ? "pr-11" : ""} ${className ?? ""}`}
          {...props}
        />
        <Icon
          strokeWidth={1.75}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-150 peer-focus:text-zinc-300"
        />
        {trailing ? (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>
        ) : null}
      </div>
      {below}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export function PasswordToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("auth");
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? t("hidePassword") : t("showPassword")}
      aria-pressed={shown}
      className="press flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-[transform,color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    >
      {shown ? (
        <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}

export function AuthSubmitButton({
  loading,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading || undefined}
      className="press group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 font-semibold text-zinc-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.7)] transition-[transform,background-color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <>
          {children}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5"
            strokeWidth={2}
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
}

export function AuthSuccess({
  icon: Icon,
  title,
  description,
  footnote,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  footnote?: string;
  children?: ReactNode;
}) {
  return (
    <div className="text-center">
      {Icon ? (
        <div className="glass-pill mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-emerald-400">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
      {footnote ? <p className="mt-6 text-xs text-zinc-500">{footnote}</p> : null}
      {children}
    </div>
  );
}

export function AuthFooterLine({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-center text-sm text-zinc-500">{children}</p>;
}

export const authLinkClass =
  "font-medium text-emerald-400 transition-colors duration-150 hover:text-emerald-300 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-pill press flex h-11 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-medium text-zinc-200 transition-[transform,filter] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Google
    </button>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-white/[0.08]" aria-hidden="true" />
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="h-px flex-1 bg-white/[0.08]" aria-hidden="true" />
    </div>
  );
}

export function AuthLayout({
  brandingHeading,
  brandingDescription,
  children,
}: {
  brandingHeading: string;
  brandingDescription: string;
  children: ReactNode;
}) {
  const t = useTranslations("auth");

  return (
    <MotionConfig reducedMotion="user">
      <div className="marketing-canvas flex min-h-screen lg:justify-center">
        <BrandingSide
          heading={brandingHeading}
          description={brandingDescription}
          joinLabel={t("joinTeams")}
          stats={[
            { value: "AI", label: t("statScoring") },
            { value: "Free", label: t("statPricing") },
            { value: "5 min", label: t("statSetup") },
          ]}
        />

        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6 lg:w-[31rem] lg:flex-none lg:justify-start lg:pl-20">
          <motion.div
            className="relative z-10 w-full max-w-[25rem]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          >
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <PublicSiteLink href="/" className="flex items-center gap-2.5">
                <ScoreLeadLogo className="h-8 w-8 text-white" />
                <span className="text-xl font-semibold tracking-tight text-white">ScoreLead</span>
              </PublicSiteLink>
            </div>

            {children}
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
