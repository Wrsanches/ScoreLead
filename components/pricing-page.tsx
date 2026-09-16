import { ArrowRight, Check, Minus } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { TrackedLink } from "@/components/tracked-link";
import { WaitlistFooter } from "@/components/waitlist-footer";
import { Link } from "@/i18n/routing";
import {
  getMarketingPlatformImage,
  getMarketingTranslation,
  getMarketingUi,
  type MarketingPage,
} from "@/lib/marketing";
import {
  getPricingUi,
  type PricingCell,
  type PricingPlanCopy,
  type PricingUi,
} from "@/lib/marketing/pricing";
import {
  getLocaleConfig,
  getLocalizedUrl,
  normalizeLocale,
  siteConfig,
} from "@/lib/seo";


/* ── Plan card ─────────────────────────────────────────────────────────
   Price, one line of positioning, four bullets, one button. The full
   matrix lives in the comparison table below, so the cards stay short. */
function PlanCard({
  plan,
  page,
  highlighted,
  footnote,
}: {
  plan: PricingPlanCopy;
  page: MarketingPage;
  highlighted?: boolean;
  footnote: string;
}) {
  return (
    <article
      className={`relative flex flex-col rounded-3xl p-6 sm:p-7 ${
        highlighted
          ? "glass-strong ring-1 ring-emerald-500/40 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.6)]"
          : "glass-card"
      }`}
    >
      {highlighted ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-3xl bg-gradient-to-b from-emerald-500/[0.12] to-transparent"
        />
      ) : null}

      <div className="relative flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-white">{plan.name}</h3>
        {plan.badge ? (
          <span
            className={
              highlighted
                ? "inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-zinc-950"
                : "glass-pill inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-zinc-200"
            }
          >
            {plan.badge}
          </span>
        ) : null}
      </div>

      <p className="relative mt-6 flex flex-wrap items-baseline gap-x-2">
        <span className="text-5xl font-semibold tabular-nums tracking-tight text-white">
          {plan.price}
        </span>
        <span className="text-sm text-zinc-500">{plan.cadence}</span>
      </p>
      {/* Reserved on every card so the taglines share a baseline. */}
      <p className="relative mt-2 min-h-4 text-xs leading-4 text-emerald-400/90">
        {plan.priceNote ?? " "}
      </p>

      <p className="relative mt-4 text-pretty text-sm leading-6 text-zinc-400 lg:min-h-18">
        {plan.tagline}
      </p>

      <div className="relative my-6 h-px bg-white/[0.08]" />

      <ul className="relative space-y-3">
        {plan.perks.map((perk) => (
          <li
            key={perk}
            className="flex items-start gap-2.5 text-sm leading-5 text-zinc-300"
          >
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
                highlighted
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-white/[0.07] text-zinc-400"
              }`}
            >
              <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <p className="relative mt-5 text-xs leading-5 text-zinc-600">{footnote}</p>

      <div className="relative mt-auto pt-6">
        <TrackedLink
          href="/signup"
          eventName="commercial_cta_click"
          eventParams={{
            page_id: page.id,
            page_group: page.group,
            plan: plan.id,
          }}
          className={
            highlighted
              ? "press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-medium text-zinc-950 transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              : "glass-pill press inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-zinc-100 transition-[transform,filter] ease-[cubic-bezier(0.23,1,0.32,1)] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          }
        >
          {plan.cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </TrackedLink>
      </div>
    </article>
  );
}

/* ── Comparison table ─────────────────────────────────────────────────
   One row per capability, one column per plan. "Included" renders as a
   check and "Not included" as a dash so the eye can scan the matrix. */
function CompareCell({
  cell,
  pricing,
  highlighted,
}: {
  cell: PricingCell;
  pricing: PricingUi;
  highlighted: boolean;
}) {
  if (cell.muted) {
    return (
      <span className="inline-flex items-center justify-center text-zinc-700">
        <Minus className="size-4" aria-hidden="true" />
        <span className="sr-only">{pricing.notIncludedLabel}</span>
      </span>
    );
  }
  if (cell.value === pricing.includedLabel) {
    return (
      <span
        className={`inline-flex size-6 items-center justify-center rounded-full ${
          highlighted
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-white/[0.07] text-zinc-200"
        }`}
      >
        <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
        <span className="sr-only">{pricing.includedLabel}</span>
      </span>
    );
  }
  return (
    <span className="block">
      <span className="text-sm tabular-nums text-zinc-100">{cell.value}</span>
      {cell.note ? (
        <span className="mt-0.5 block text-[11px] leading-4 text-zinc-500">
          {cell.note}
        </span>
      ) : null}
    </span>
  );
}

function ComparisonTable({ pricing }: { pricing: PricingUi }) {
  return (
    <div className="glass-card overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th scope="col" className="w-[30%] px-5 py-5 sm:px-7">
                <span className="sr-only">{pricing.compareHeading}</span>
              </th>
              {pricing.plans.map((plan) => {
                const highlighted = plan.id === "growth";
                return (
                  <th
                    key={plan.id}
                    scope="col"
                    className={`px-4 py-5 text-center align-bottom ${
                      highlighted ? "bg-emerald-500/[0.06]" : ""
                    }`}
                  >
                    <span className="block text-sm font-medium text-white">
                      {plan.name}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {plan.price}{" "}
                      <span className="text-zinc-600">{plan.cadence}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {pricing.rows.map((row) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className="px-5 py-4 text-sm font-normal text-zinc-300 sm:px-7"
                >
                  {row.label}
                </th>
                {pricing.plans.map((plan) => {
                  const highlighted = plan.id === "growth";
                  return (
                    <td
                      key={plan.id}
                      className={`px-4 py-4 text-center align-middle ${
                        highlighted ? "bg-emerald-500/[0.06]" : ""
                      }`}
                    >
                      <div className="flex justify-center">
                        <CompareCell
                          cell={row.values[plan.id]}
                          pricing={pricing}
                          highlighted={highlighted}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PricingPageView({
  page,
  locale,
}: {
  page: MarketingPage;
  locale: string;
}) {
  const normalizedLocale = normalizeLocale(locale);
  const translation = getMarketingTranslation(page, normalizedLocale);
  const ui = getMarketingUi(normalizedLocale);
  const pricing = getPricingUi(normalizedLocale);
  const canonical = getLocalizedUrl(normalizedLocale, page.pathname);
  const platformImage = getMarketingPlatformImage(page.id);
  const platformImageUrl = `${siteConfig.url}${platformImage.src}`;

  const breadcrumbs = [
    { name: ui.home, item: getLocalizedUrl(normalizedLocale) },
    { name: translation.title, item: canonical },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        name: translation.title,
        description: translation.description,
        url: canonical,
        dateModified: page.updatedAt,
        inLanguage: getLocaleConfig(normalizedLocale).htmlLang,
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        about: { "@id": `${siteConfig.url}/#software` },
        author: { "@id": `${siteConfig.url}/#organization` },
        image: platformImageUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((breadcrumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: breadcrumb.name,
          item: breadcrumb.item,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        mainEntity: pricing.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="marketing-canvas min-h-screen text-zinc-100">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main id="main" className="relative pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_70%_60%_at_40%_0%,rgba(16,185,129,0.11),transparent_72%)]"
        />

        {/* ── Hero ────────────────────────────────────────────── */}
        <header className="relative px-6 pt-12 sm:pt-20">
          <div className="mx-auto max-w-6xl">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs text-zinc-600"
            >
              <Link
                href="/"
                className="rounded-sm transition-colors hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                {ui.home}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="truncate text-zinc-400">{translation.title}</span>
            </nav>

            <div className="mt-10">
              <h1 className="max-w-3xl text-balance text-4xl font-medium leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl">
                {translation.title}
              </h1>
              <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
                {translation.description}
              </p>
            </div>
          </div>
        </header>

        {/* ── Plan cards ───────────────────────────────────────── */}
        <section
          className="relative px-6 pb-16 pt-14 sm:pb-20"
          aria-label={pricing.plansHeading}
        >
          <div className="mx-auto grid max-w-7xl items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pricing.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                page={page}
                highlighted={plan.id === "growth"}
                footnote={
                  plan.id === "free"
                    ? pricing.freeMeterNote
                    : pricing.paidMeterNote
                }
              />
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-7xl text-center text-xs text-zinc-600">
            {pricing.noCreditCard}
          </p>
        </section>

        {/* ── Comparison ──────────────────────────────────────── */}
        <section
          className="border-t border-white/[0.06] px-6 py-16 sm:py-20"
          aria-labelledby="compare-plans"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2
                id="compare-plans"
                className="text-2xl font-medium tracking-tight text-white sm:text-3xl"
              >
                {pricing.compareHeading}
              </h2>
              <p className="mt-3 text-pretty text-base leading-7 text-zinc-400">
                {pricing.compareIntro}
              </p>
            </div>
            <div className="mt-10">
              <ComparisonTable pricing={pricing} />
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section
          className="border-t border-white/[0.06] px-6 py-16 sm:py-20"
          aria-labelledby="pricing-faq"
        >
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-16">
            <div>
              <h2
                id="pricing-faq"
                className="text-2xl font-medium tracking-tight text-white sm:text-3xl"
              >
                {pricing.faqHeading}
              </h2>
              <p className="mt-3 text-pretty text-base leading-7 text-zinc-400">
                {pricing.faqIntro}
              </p>
            </div>
            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {pricing.faq.map((item) => (
                <details key={item.question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg px-1 py-4 text-left text-[0.9375rem] font-medium text-zinc-200 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="glass-pill relative inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-transform group-open:rotate-45"
                    >
                      <span className="absolute h-px w-3 bg-current" />
                      <span className="absolute h-3 w-px bg-current" />
                    </span>
                  </summary>
                  <p className="px-1 pb-5 text-pretty text-sm leading-7 text-zinc-400">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] px-6 py-16 sm:py-22">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-3xl text-balance text-3xl font-medium tracking-tight text-white sm:text-5xl">
                {translation.ctaTitle}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
                {translation.ctaDescription}
              </p>
            </div>
            <TrackedLink
              href="/signup"
              eventName="commercial_cta_click"
              eventParams={{ page_id: page.id, page_group: page.group }}
              className="press inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-medium text-zinc-950 transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
            >
              {translation.ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </TrackedLink>
          </div>
        </section>
      </main>

      <WaitlistFooter />
    </div>
  );
}
