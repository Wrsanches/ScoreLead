"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { TrackedLink } from "./tracked-link";
import { ReportingChart, ReportingFlow } from "./reporting-visuals";
import { ScoreLeadLogo } from "./scorelead-logo";

const examples = ["traffic", "search", "pages"] as const;
type Example = (typeof examples)[number];
const reportSources: Record<Example, ("ga4" | "search")[]> = {
  traffic: ["ga4"],
  search: ["search"],
  pages: ["ga4", "search"],
};

function SourceLabel({ source }: { source: "ga4" | "search" }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-300">
      <Image
        src={`/images/integrations/${source === "ga4" ? "google-analytics.svg" : "google-search-console.png"}`}
        alt=""
        width={20}
        height={20}
        unoptimized
        className="size-5 shrink-0 object-contain"
      />
      {source === "ga4" ? "Google Analytics 4" : "Search Console"}
    </span>
  );
}

export function ReportingSection() {
  const t = useTranslations("reportingSection");
  const [selected, setSelected] = useState<Example>("traffic");

  return (
    <section
      id="reporting"
      aria-labelledby="reporting-heading"
      className="relative z-20 marketing-section"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/5 bg-linear-to-b from-white/5 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400">
            <span
              className="inline-flex shrink-0 items-center gap-2"
              aria-hidden="true"
            >
              <Image
                src="/images/integrations/google-analytics.svg"
                alt=""
                width={20}
                height={20}
                unoptimized
                className="size-5 object-contain"
              />
              <span className="text-xs text-zinc-500">+</span>
              <Image
                src="/images/integrations/google-search-console.png"
                alt=""
                width={20}
                height={20}
                unoptimized
                className="size-5 object-contain"
              />
            </span>
            {t("label")}
          </p>
          <h2
            id="reporting-heading"
            className="whitespace-pre-line text-balance text-3xl leading-[1.1] tracking-[-0.0325em] text-white sm:text-4xl md:text-5xl lg:text-[56px]"
            style={{ fontVariationSettings: '"opsz" 28', fontWeight: 538 }}
          >
            {t("heading")}
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-300 sm:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div>
            <p
              id="reporting-questions"
              className="mb-4 text-sm font-medium text-zinc-400"
            >
              {t("choose")}
            </p>
            <div
              className="space-y-2"
              role="group"
              aria-labelledby="reporting-questions"
            >
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  aria-pressed={selected === example}
                  aria-controls="reporting-example"
                  onClick={() => setSelected(example)}
                  className={`group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 active:bg-white/[0.08] ${
                    selected === example
                      ? "border-emerald-400/30 bg-emerald-400/[0.06]"
                      : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`mb-2 block text-xs font-medium ${selected === example ? "text-emerald-400" : "text-zinc-400"}`}
                    >
                      {t(`examples.${example}.label`)}
                    </span>
                    <span className="block text-sm leading-relaxed text-zinc-200">
                      {t(`examples.${example}.question`)}
                    </span>
                  </span>
                  {selected === example ? (
                    <Check
                      className="mt-1 size-4 shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-zinc-500 group-hover:text-zinc-300"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              {t("access")}
            </p>
            <div className="hidden lg:block">
              <ReportingFlow selected={selected} />
            </div>
          </div>

          <div className="surface-card min-w-0 overflow-hidden rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-5 py-4 sm:px-6">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-200">
                <span aria-hidden="true">
                  <ScoreLeadLogo className="size-6 text-white" />
                </span>
                ScoreLead MCP
              </span>
              <span className="text-xs text-zinc-400">{t("preview")}</span>
            </div>
            <div
              id="reporting-example"
              aria-live="polite"
              aria-atomic="true"
              className="grid p-5 sm:p-6"
            >
              {/* Stack examples to reserve the tallest response and keep controls stable. */}
              {examples.map((example) => (
                <div
                  key={example}
                  aria-hidden={selected !== example}
                  className={`col-start-1 row-start-1 min-w-0 ${selected !== example ? "invisible" : ""}`}
                >
                  <p className="flex items-center gap-2 text-xs text-zinc-400">
                    <Image
                      src="/images/showcase/mora-casa.webp"
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                      className="rounded-full"
                    />
                    {t("business")}
                  </p>
                  <h3 className="mt-5 text-sm font-medium text-emerald-400">
                    {t("answer")}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                    {t(`examples.${example}.summary`)}
                  </p>
                  <ReportingChart
                    example={example}
                    active={selected === example}
                  />
                  <table className="sr-only">
                    <caption className="sr-only">
                      {t(`examples.${example}.question`)}
                    </caption>
                    <thead className="text-zinc-400">
                      <tr className="border-b border-white/10">
                        <th scope="col" className="w-1/2 pb-3 pr-3 font-normal">
                          {t(`examples.${example}.column`)}
                        </th>
                        <th
                          scope="col"
                          className="pb-3 pr-2 text-right font-normal"
                        >
                          {t(`examples.${example}.metric`)}
                        </th>
                        <th scope="col" className="pb-3 text-right font-normal">
                          {t(`examples.${example}.context`)}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0, 1, 2].map((row) => (
                        <tr key={row} className="border-b border-white/[0.06]">
                          <th
                            scope="row"
                            className="break-words py-3 pr-3 font-normal leading-relaxed text-zinc-300"
                          >
                            {t(`examples.${example}.rows.${row}.name`)}
                          </th>
                          <td className="py-3 pr-2 text-right font-mono tabular-nums text-zinc-200">
                            {t(`examples.${example}.rows.${row}.value`)}
                          </td>
                          <td className="py-3 text-right font-mono tabular-nums text-zinc-200">
                            {t(`examples.${example}.rows.${row}.detail`)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-xs leading-relaxed text-zinc-400">
                    {t(`examples.${example}.note`)}
                  </p>
                  <div
                    aria-label={t("sources")}
                    className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3"
                  >
                    {reportSources[example].map((source) => (
                      <SourceLabel key={source} source={source} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="border-t border-white/[0.08] px-5 py-4 text-xs leading-relaxed text-zinc-400 sm:px-6">
              {t("footnote")}
            </p>
          </div>
          <div className="lg:hidden">
            <ReportingFlow selected={selected} />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <TrackedLink
            href="/signup"
            eventName="signup_start"
            eventParams={{ placement: "homepage_reporting" }}
            className="press inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.5)] transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            {t("cta")}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </TrackedLink>
          <p className="max-w-sm text-xs leading-relaxed text-zinc-400">
            {t("setup")}
          </p>
        </div>
      </div>
    </section>
  );
}
