"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ContentShowcase } from "./content-showcase";
import { TrackedLink } from "./tracked-link";

export function ContentSection() {
  const t = useTranslations("contentSection");

  return (
    <section
      id="content"
      aria-labelledby="content-heading"
      className="relative z-20 marketing-section"
    >
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400">
            <Image
              src="/images/integrations/instagram.svg"
              alt=""
              width={20}
              height={20}
              unoptimized
              className="size-5 shrink-0 object-contain"
            />
            {t("label")}
          </p>
          <h2
            id="content-heading"
            className="text-balance text-3xl leading-[1.1] tracking-[-0.0325em] text-white sm:text-4xl md:text-5xl lg:text-[56px]"
            style={{ fontVariationSettings: '"opsz" 28', fontWeight: 538 }}
          >
            {t("heading")}
            <span className="mt-1 block">{t("headingAccent")}</span>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-300 sm:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="-mx-6 mt-8 sm:mx-0 sm:mt-10">
          <ContentShowcase />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-start gap-x-6 gap-y-4">
          <TrackedLink
            href="/signup"
            eventName="signup_start"
            eventParams={{ placement: "homepage_content" }}
            className="press inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.5)] transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            {t("cta")}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </TrackedLink>
          <a
            href="#pricing"
            className="rounded-sm text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            {t("plans")}
          </a>
        </div>
      </div>
    </section>
  );
}
