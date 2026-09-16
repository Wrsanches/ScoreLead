"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { SocialIcon } from "./admin/social-icon";
import { ScoreLeadLogo } from "./scorelead-logo";
import { TrackedLink } from "./tracked-link";

export function WaitlistFooter() {
  const t = useTranslations("footer");

  const linkGroups = [
    {
      title: t("product"),
      links: [
        {
          href: "/features/ai-lead-discovery" as const,
          label: t("leadDiscovery"),
        },
        { href: "/features/lead-scoring" as const, label: t("leadScoring") },
        {
          href: "/features/lead-enrichment" as const,
          label: t("leadEnrichment"),
        },
        {
          href: "/features/outreach-automation" as const,
          label: t("outreachAutomation"),
        },
        { href: "/features/sales-pipeline" as const, label: t("pipeline") },
        {
          href: "/features/ai-content-creation" as const,
          label: t("contentCreation"),
        },
      ],
    },
    {
      title: t("resources"),
      links: [
        { href: "/blog" as const, label: t("blog") },
        { href: "/use-cases/agencies" as const, label: t("agencies") },
        { href: "/tools/icp-worksheet" as const, label: t("icpWorksheet") },
        {
          href: "/tools/lead-scoring-calculator" as const,
          label: t("scoringCalculator"),
        },
        {
          href: "/tools/enrichment-checklist" as const,
          label: t("enrichmentChecklist"),
        },
        {
          href: "/tools/lead-research-roi-calculator" as const,
          label: t("roiCalculator"),
        },
      ],
    },
    {
      title: t("compare"),
      links: [
        {
          href: "/compare/sales-prospecting-software" as const,
          label: t("salesProspectingSoftware"),
        },
        {
          href: "/compare/best-lead-scoring-software" as const,
          label: t("leadScoringSoftware"),
        },
        {
          href: "/compare/b2b-lead-enrichment-tools" as const,
          label: t("leadEnrichmentTools"),
        },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/case-studies/ceramik" as const, label: t("customers") },
        { href: "/about" as const, label: t("about") },
        { href: "/pricing" as const, label: t("pricing") },
        { href: "/security" as const, label: t("security") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/contact" as const, label: t("contactUs") },
        { href: "/privacy" as const, label: t("privacy") },
        { href: "/terms" as const, label: t("terms") },
        { href: "/data-deletion" as const, label: t("dataDeletion") },
      ],
    },
  ];

  return (
    <footer className="relative z-20 px-3 pb-3 sm:px-6 sm:pb-6">
      {/* The footer floats as one glass slab, echoing the admin sidebar. */}
      <div className="glass-card mx-auto max-w-7xl overflow-hidden rounded-3xl">
        {/* Closing call to action */}
        <div className="flex flex-col gap-6 border-b border-white/[0.08] px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-12">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-white sm:text-3xl">
              {t("ctaTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400 sm:text-base">{t("ctaBody")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <TrackedLink
              href="/signup"
              eventName="signup_start"
              eventParams={{ placement: "footer_cta" }}
              className="press rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.5)] hover:bg-zinc-100 transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
            >
              {t("ctaAction")}
            </TrackedLink>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
            >
              {t("contactUs")}
              <ArrowRight strokeWidth={1.75} className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-3">
              <Link
                href="/"
                className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                <ScoreLeadLogo className="size-7 text-white" />
                <span className="text-lg font-semibold tracking-tight text-zinc-100">
                  ScoreLead
                </span>
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-500">
                {t("tagline")}
              </p>
              <div className="mt-6 flex items-center gap-2">
                <a
                  href="https://x.com/scorelead_"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label={t("twitter")}
                  title={t("twitter")}
                  className="glass-pill inline-flex size-9 items-center justify-center rounded-full text-zinc-400 hover:brightness-125 transition-[filter,color] ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  <SocialIcon platform="x" className="size-4" />
                </a>
                <a
                  href="https://www.instagram.com/scorelead.io/"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label={t("instagram")}
                  title={t("instagram")}
                  className="glass-pill inline-flex size-9 items-center justify-center rounded-full text-zinc-400 hover:brightness-125 transition-[filter,color] ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-pink-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  <SocialIcon platform="instagram" className="size-4" />
                </a>
              </div>
            </div>

            <nav
              aria-label={t("navigation")}
              className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:col-span-9 xl:grid-cols-5 xl:gap-x-12"
            >
              {linkGroups.map((group) => (
                <div key={group.title}>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
                    {group.title}
                  </h2>
                  <ul className="mt-5 space-y-3.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="rounded-sm text-sm text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/[0.08] pt-6 sm:mt-16 sm:flex-row sm:items-center">
            <p className="text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} ScoreLead. {t("rights")}
            </p>
            <p className="text-xs text-zinc-600">{t("builtFor")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
