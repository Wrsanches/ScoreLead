"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ScoreLeadLogo } from "@/components/scorelead-logo";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Image from "next/image";

const avatars = [
  "/images/avatars/avatar-1.jpg",
  "/images/avatars/avatar-2.jpg",
  "/images/avatars/avatar-3.jpg",
  "/images/avatars/avatar-4.jpg",
  "/images/avatars/avatar-5.jpg",
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
            className="w-8 h-8 rounded-full border-2 border-zinc-950 object-cover"
          />
        ))}
      </div>
      <span className="text-sm text-zinc-400">{label}</span>
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
    <div className="hidden lg:flex lg:w-125 lg:shrink-0 bg-zinc-950 items-center justify-end">
      <div className="max-w-md px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="flex items-center gap-3 mb-10">
            <ScoreLeadLogo className="w-10 h-10 text-white" />
            <span className="text-white font-semibold text-2xl tracking-tight">
              ScoreLead
            </span>
          </Link>

          <h2 className="text-3xl font-semibold text-white tracking-tight leading-tight mb-4 whitespace-pre-line">
            {heading}
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed mb-10">
            {description}
          </p>

          <AvatarStack label={joinLabel} />

          <div className="mt-12 pt-8 border-t border-zinc-800/60">
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-xl font-semibold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-center gap-2 py-2.5 bg-zinc-800/40 border border-zinc-700/50 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-600/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
    </motion.button>
  );
}

export function GitHubButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-center gap-2 py-2.5 bg-zinc-800/40 border border-zinc-700/50 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-600/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
      GitHub
    </motion.button>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-800/60" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-zinc-900/30 backdrop-blur-sm px-3 text-xs text-zinc-600">
          {label}
        </span>
      </div>
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
    <div className="min-h-screen flex bg-zinc-950 lg:justify-center">
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

      <div className="flex-1 lg:w-125 lg:flex-none flex items-center justify-center px-6 py-12 lg:justify-start lg:pl-20">
        <motion.div
          className="w-full max-w-100 relative z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5 mb-2">
              <ScoreLeadLogo className="w-8 h-8 text-white" />
              <span className="text-white font-semibold text-xl tracking-tight">
                ScoreLead
              </span>
            </Link>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
