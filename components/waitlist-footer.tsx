"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SocialIcon } from "./admin/social-icon";
import { ScoreLeadLogo } from "./scorelead-logo";

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
      ],
    },
    {
      title: t("useCases"),
      links: [
        { href: "/use-cases/agencies" as const, label: t("agencies") },
        { href: "/use-cases/b2b-sales-teams" as const, label: t("salesTeams") },
        { href: "/use-cases/b2b-startups" as const, label: t("startups") },
        { href: "/use-cases/b2b-companies" as const, label: t("b2bCompanies") },
      ],
    },
    {
      title: t("resources"),
      links: [
        { href: "/blog" as const, label: t("blog") },
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
      title: t("company"),
      links: [
        { href: "/case-studies/ceramik" as const, label: t("customers") },
        { href: "/about" as const, label: t("about") },
        { href: "/pricing" as const, label: t("pricing") },
        { href: "/security" as const, label: t("security") },
        { href: "/editorial-policy" as const, label: t("editorialPolicy") },
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
    <footer className="border-t border-zinc-800/70 bg-[#09090B] px-6">
      <div className="mx-auto max-w-6xl py-12 sm:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
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
            <div className="mt-4 flex flex-col items-start gap-2">
              <a
                href="mailto:hello@scorelead.io"
                className="rounded-sm text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                hello@scorelead.io
              </a>
              <div className="flex items-center gap-2 mt-3">
                <a
                  href="https://x.com/scorelead_"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label={t("twitter")}
                  title={t("twitter")}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-500 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  <SocialIcon platform="x" className="size-4" />
                </a>
                <a
                  href="https://www.instagram.com/scorelead.io/"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label={t("instagram")}
                  title={t("instagram")}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-500 transition-colors hover:border-pink-500/40 hover:bg-pink-500/10 hover:text-pink-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  <SocialIcon platform="instagram" className="size-4" />
                </a>
              </div>
            </div>
          </div>

          <nav
            aria-label={t("navigation")}
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5"
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

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-zinc-800/70 pt-6 sm:mt-16 sm:flex-row sm:items-center">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} ScoreLead. {t("rights")}
          </p>
          <p className="text-xs text-zinc-600">{t("builtFor")}</p>
        </div>
      </div>
    </footer>
  );
}
