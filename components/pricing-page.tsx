import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { TrackedLink } from "@/components/tracked-link";
import { WaitlistFooter } from "@/components/waitlist-footer";
import { Link } from "@/i18n/routing";
import { getBlogPost, getBlogTranslation } from "@/lib/blog";
import {
  getMarketingPlatformImage,
  getMarketingTranslation,
  getMarketingUi,
  type MarketingPage,
} from "@/lib/marketing";
import {
  getPricingUi,
  type PricingPlanCopy,
  type PricingRow,
} from "@/lib/marketing/pricing";
import {
  getLocaleConfig,
  getLocalizedUrl,
  normalizeLocale,
  siteConfig,
} from "@/lib/seo";

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(getLocaleConfig(locale).htmlLang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function PlanCard({
  plan,
  page,
  rows,
  highlighted,
  footnote,
  className,
}: {
  plan: PricingPlanCopy;
  page: MarketingPage;
  rows: PricingRow[];
  highlighted?: boolean;
  footnote?: string;
  className?: string;
}) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 ${
        highlighted
          ? "border-emerald-400/40 bg-emerald-500/4"
          : "border-zinc-800 bg-zinc-900/30"
      }${className ? ` ${className}` : ""}`}
    >
      {plan.badge ? (
        <p className="absolute -top-3 left-6 rounded-full bg-emerald-400 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-950 sm:left-7">
          {plan.badge}
        </p>
      ) : null}

      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
        {plan.name}
      </h3>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span className="text-4xl font-medium tracking-[-0.03em] text-white">
          {plan.price}
        </span>
        <span className="text-sm text-zinc-500">{plan.cadence}</span>
      </p>
      {/* Reserve the line on every card so the price rows stay aligned. */}
      <p className="mt-1 min-h-4 text-xs leading-4 text-emerald-400/90">
        {plan.priceNote ?? "\u00A0"}
      </p>
      <p className="mt-3 text-pretty text-sm leading-6 text-zinc-400 lg:min-h-24">
        {plan.tagline}
      </p>

      <dl className="mt-6 divide-y divide-zinc-800/80 border-t border-zinc-800">
        {rows.map((row) => {
          const cell = row.values[plan.id];
          return (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3 py-3"
            >
              <dt className="text-xs leading-5 text-zinc-400">{row.label}</dt>
              <dd className="shrink-0 text-right">
                <span
                  className={
                    cell.muted
                      ? "font-mono text-xs text-zinc-600"
                      : "font-mono text-xs text-zinc-100"
                  }
                >
                  {cell.value}
                </span>
                {cell.note ? (
                  <span className="block text-[11px] leading-4 text-zinc-500">
                    {cell.note}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>

      {footnote ? (
        <p className="mt-3 text-xs leading-5 text-zinc-600">{footnote}</p>
      ) : null}

      <div className="mt-auto pt-8">
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
              ? "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          }
        >
          {plan.cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </TrackedLink>
      </div>
    </article>
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
  const termsSection = translation.sections.at(-1);
  const relatedPosts = page.relatedBlogSlugs
    .map((slug) => getBlogPost(slug))
    .filter((post) => post !== undefined);

  const breadcrumbs = [
    {
      name: ui.home,
      item: getLocalizedUrl(normalizedLocale),
    },
    {
      name: translation.eyebrow,
      item: canonical,
    },
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
    ],
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main id="main" className="pt-16">
        <header className="px-6 pt-12 sm:pt-20">
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
              <span className="text-zinc-400">{translation.eyebrow}</span>
            </nav>

            <div className="mt-10 grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
                  {translation.eyebrow}
                </p>
                <h1 className="mt-5 max-w-4xl text-balance text-4xl font-medium leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl">
                  {translation.title}
                </h1>
                <p className="mt-7 max-w-3xl text-pretty text-lg leading-8 text-zinc-400">
                  {translation.description}
                </p>
              </div>
              <div className="border-y border-zinc-800 py-5 lg:border-y-0 lg:border-l lg:py-2 lg:pl-8">
                <p className="text-xs uppercase tracking-[0.15em] text-zinc-600">
                  {ui.lastReviewed}
                </p>
                <time
                  dateTime={page.updatedAt}
                  className="mt-2 block text-sm font-medium text-zinc-300"
                >
                  {formatDate(page.updatedAt, normalizedLocale)}
                </time>
                <Link
                  href="/authors/scorelead-editorial"
                  className="mt-5 inline-block rounded-sm text-sm text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  ScoreLead Editorial
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section
          className="px-6 pb-16 pt-14 sm:pb-20"
          aria-label={pricing.plansHeading}
        >
          <div className="mx-auto grid max-w-7xl items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pricing.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                page={page}
                rows={pricing.rows}
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

        <section
          className="border-y border-zinc-800/70 px-6 py-14 sm:py-16"
          aria-labelledby="direct-answer"
        >
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">
                {ui.overview}
              </p>
              <h2
                id="direct-answer"
                className="mt-4 text-2xl font-medium tracking-tight text-white"
              >
                {translation.title}
              </h2>
            </div>
            <p className="max-w-3xl text-pretty text-lg leading-8 text-zinc-300">
              {translation.answer}
            </p>
          </div>
        </section>

        <section
          className="px-6 py-12 sm:py-14"
          aria-labelledby="pricing-terms"
        >
          <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2">
            {termsSection ? (
              <div>
                <h2
                  id="pricing-terms"
                  className="text-sm font-medium text-zinc-300"
                >
                  {termsSection.heading}
                </h2>
                {termsSection.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3 max-w-xl text-sm leading-6 text-zinc-500"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            <div>
              <h2 className="text-sm font-medium text-zinc-300">
                {translation.proofLabel}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                {translation.proof}
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-800/70 px-6 py-16 sm:py-22">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">
                ScoreLead
              </p>
              <h2 className="mt-4 max-w-3xl text-balance text-3xl font-medium tracking-tight text-white sm:text-5xl">
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
            >
              {translation.ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </TrackedLink>
          </div>
        </section>

        {relatedPosts.length ? (
          <section
            className="border-t border-zinc-800/70 px-6 py-14 sm:py-16"
            aria-labelledby="related-guides"
          >
            <div className="mx-auto max-w-6xl">
              <h2
                id="related-guides"
                className="text-sm font-medium text-zinc-400"
              >
                {ui.relatedGuides}
              </h2>
              <div className="mt-6 divide-y divide-zinc-800 border-y border-zinc-800">
                {relatedPosts.map((post) => {
                  const postTranslation = getBlogTranslation(
                    post,
                    normalizedLocale,
                  );
                  return (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group grid gap-4 py-6 transition-colors hover:bg-zinc-900/35 sm:grid-cols-[1fr_auto] sm:items-center sm:px-4"
                    >
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
                          {postTranslation.category}
                        </p>
                        <h3 className="mt-2 text-lg font-medium text-zinc-200 transition-colors group-hover:text-white">
                          {postTranslation.title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm text-zinc-500 group-hover:text-zinc-200">
                        {ui.readGuide}
                        <ArrowRight
                          className="size-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <aside
          className="border-t border-zinc-800/70 px-6 py-10"
          aria-labelledby="methodology"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="methodology"
                className="text-sm font-medium text-zinc-300"
              >
                {ui.methodology}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {ui.methodologyDescription}
              </p>
            </div>
            <Link
              href="/editorial-policy"
              className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
            >
              {ui.editorialPolicy}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </main>

      <WaitlistFooter />
    </div>
  );
}
