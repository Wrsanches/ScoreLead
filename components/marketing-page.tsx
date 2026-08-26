import { ArrowRight, ExternalLink } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { MarketingPlatformImage } from "@/components/marketing-platform-image";
import { MarketingTool } from "@/components/marketing-tool";
import { Navbar } from "@/components/navbar";
import { TrackedLink } from "@/components/tracked-link";
import { WaitlistFooter } from "@/components/waitlist-footer";
import { Link } from "@/i18n/routing";
import { getBlogPost, getBlogTranslation } from "@/lib/blog";
import {
  getMarketingPlatformImage,
  getMarketingPageByPath,
  getMarketingTranslation,
  getMarketingUi,
  type MarketingPage,
} from "@/lib/marketing";
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

function ctaHref(page: MarketingPage) {
  if (
    page.id === "company-security" ||
    page.id === "company-editorial-policy"
  ) {
    return "/contact" as const;
  }
  if (page.id === "author-scorelead-editorial") {
    return "/blog" as const;
  }
  return "/signup" as const;
}

export function MarketingPageView({
  page,
  locale,
}: {
  page: MarketingPage;
  locale: string;
}) {
  const normalizedLocale = normalizeLocale(locale);
  const translation = getMarketingTranslation(page, normalizedLocale);
  const ui = getMarketingUi(normalizedLocale);
  const canonical = getLocalizedUrl(normalizedLocale, page.pathname);
  const platformImage = getMarketingPlatformImage(page.id);
  const platformImageUrl = `${siteConfig.url}${platformImage.src}`;
  const relatedPosts = page.relatedBlogSlugs
    .map((slug) => getBlogPost(slug))
    .filter((post) => post !== undefined);
  const relatedPages = (page.relatedMarketingPaths ?? [])
    .map((pathname) => getMarketingPageByPath(pathname))
    .filter((relatedPage) => relatedPage !== undefined);

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

  const mainEntity =
    page.group === "tools"
      ? {
          "@type": "WebApplication",
          "@id": `${canonical}#tool`,
          name: translation.title,
          description: translation.description,
          url: canonical,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          browserRequirements: "A modern web browser",
          isAccessibleForFree: true,
          inLanguage: getLocaleConfig(normalizedLocale).htmlLang,
          author: { "@id": `${siteConfig.url}/#organization` },
          offers: {
            "@type": "Offer",
            price: 0,
            priceCurrency: "USD",
          },
        }
      : page.group === "case-studies"
        ? {
            "@type": "Article",
            "@id": `${canonical}#article`,
            headline: translation.title,
            description: translation.description,
            url: canonical,
            datePublished: page.updatedAt,
            dateModified: page.updatedAt,
            inLanguage: getLocaleConfig(normalizedLocale).htmlLang,
            author: { "@id": `${siteConfig.url}/#organization` },
            publisher: { "@id": `${siteConfig.url}/#organization` },
            mainEntityOfPage: canonical,
          }
        : {
            "@type": page.id === "company-about" ? "AboutPage" : "WebPage",
            "@id": `${canonical}#webpage`,
            name: translation.title,
            description: translation.description,
            url: canonical,
            dateModified: page.updatedAt,
            inLanguage: getLocaleConfig(normalizedLocale).htmlLang,
            isPartOf: { "@id": `${siteConfig.url}/#website` },
            about: { "@id": `${siteConfig.url}/#software` },
            author: { "@id": `${siteConfig.url}/#organization` },
          };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...mainEntity,
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
        {/* ── Hero ─────────────────────────────────────────────
            One asymmetric stack. The emerald eyebrow is the only
            accent above the fold; review metadata sits on a quiet
            baseline row instead of a competing bordered rail. */}
        <header className="px-6 pb-16 pt-10 sm:pb-24 sm:pt-14">
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

            <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-400">
              {translation.eyebrow}
            </p>
            <h1 className="mt-6 max-w-[19ch] text-balance text-[2.5rem] font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl sm:leading-[0.98] lg:text-[4.25rem]">
              {translation.title}
            </h1>
            <p className="mt-8 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
              {translation.description}
            </p>

            <div className="mt-9 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
              <span className="flex items-center gap-2">
                {ui.lastReviewed}
                <time
                  dateTime={page.updatedAt}
                  className="font-mono text-zinc-400"
                >
                  {formatDate(page.updatedAt, normalizedLocale)}
                </time>
              </span>
              <span aria-hidden="true" className="hidden text-zinc-700 sm:inline">
                /
              </span>
              <Link
                href="/authors/scorelead-editorial"
                className="rounded-sm text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-white hover:decoration-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                ScoreLead Editorial
              </Link>
            </div>

            <MarketingPlatformImage page={page} locale={normalizedLocale} />
          </div>
        </header>

        {/* ── Lede / direct answer ─────────────────────────────
            Marginal label rail + one oversized paragraph. Fixed
            narrow label column, so it reads as an editorial
            side-note rather than another 2-column content block. */}
        <section
          className="border-t border-zinc-900 px-6 py-16 sm:py-24"
          aria-labelledby="direct-answer"
        >
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-12">
            <h2
              id="direct-answer"
              className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 lg:pt-3"
            >
              {ui.overview}
            </h2>
            <p className="max-w-3xl text-pretty text-[1.375rem] leading-[1.55] text-zinc-200 sm:text-[1.75rem] sm:leading-[1.5]">
              {translation.answer}
            </p>
          </div>
        </section>

        {/* ── What you can do ──────────────────────────────────
            Deliberately a different shape from every other block:
            a 3-up grid of rule-topped items, no numbering. */}
        <section
          className="border-t border-zinc-900 px-6 py-16 sm:py-20"
          aria-labelledby="outcomes"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="outcomes"
              className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
            >
              {ui.keyOutcomes}
            </h2>
            <ul className="mt-10 grid gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {translation.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="border-t border-zinc-800 pt-5 text-[1.0625rem] leading-7 text-zinc-300"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {page.group === "tools" ? (
          <section
            className="border-t border-zinc-900 px-6 py-16 sm:py-20"
            aria-label={translation.title}
          >
            <div className="mx-auto max-w-5xl">
              <MarketingTool slug={page.slug} locale={normalizedLocale} />
            </div>
          </section>
        ) : null}

        {/* ── Body sections ────────────────────────────────────
            The only place a number appears, and it hangs beside
            the heading rather than stacking above it. */}
        <section className="border-t border-zinc-900 px-6 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-16 sm:gap-20">
            {translation.sections.map((section, index) => (
              <section
                key={section.heading}
                aria-labelledby={`${page.slug}-section-${index}`}
                className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16"
              >
                <div className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-[0.4rem] font-mono text-xs tabular-nums text-zinc-600"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    id={`${page.slug}-section-${index}`}
                    className="text-[1.5rem] font-medium leading-[1.2] tracking-[-0.02em] text-white sm:text-[1.625rem]"
                  >
                    {section.heading}
                  </h2>
                </div>
                <div>
                  <div className="space-y-5 text-lg leading-8 text-zinc-400">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.points ? (
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {section.points.map((point) => (
                        <li
                          key={point}
                          className="rounded-full border border-zinc-800 px-3.5 py-1.5 text-[0.8125rem] leading-5 text-zinc-400"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </section>

        {/* ── Evidence and limits ──────────────────────────────
            An inset panel, not a tinted full-bleed band. The shape
            is what marks it as an aside. */}
        <section className="px-6 pb-16 sm:pb-24" aria-labelledby="evidence">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/25 p-8 sm:p-12">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {ui.evidence}
              </p>
              <h2
                id="evidence"
                className="mt-5 max-w-2xl text-[1.375rem] font-medium leading-[1.25] tracking-[-0.02em] text-white sm:text-2xl"
              >
                {translation.proofLabel}
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
                {translation.proof}
              </p>
              {page.id === "case-study-ceramik" ? (
                <a
                  href="https://ceramik.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-zinc-300 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-white hover:decoration-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  Ceramik
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {relatedPosts.length ? (
          <section
            className="border-t border-zinc-900 px-6 py-16 sm:py-20"
            aria-labelledby="related-guides"
          >
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2
                  id="related-guides"
                  className="text-[1.75rem] font-medium tracking-[-0.025em] text-white"
                >
                  {ui.relatedGuides}
                </h2>
                <p className="max-w-sm text-sm leading-6 text-zinc-500">
                  {ui.relatedGuidesDescription}
                </p>
              </div>
              <div className="mt-10 border-t border-zinc-800">
                {relatedPosts.map((post) => {
                  const postTranslation = getBlogTranslation(
                    post,
                    normalizedLocale,
                  );
                  return (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group grid gap-3 border-b border-zinc-800 py-6 transition-colors hover:bg-zinc-900/40 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 sm:px-4"
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          {postTranslation.category}
                        </p>
                        <h3 className="mt-2.5 text-lg font-medium leading-7 text-zinc-200 transition-colors group-hover:text-white">
                          {postTranslation.title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors group-hover:text-zinc-200">
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

        {relatedPages.length ? (
          <section
            className="border-t border-zinc-900 px-6 py-16 sm:py-20"
            aria-labelledby="related-solutions"
          >
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2
                  id="related-solutions"
                  className="text-[1.75rem] font-medium tracking-[-0.025em] text-white"
                >
                  {ui.relatedSolutions}
                </h2>
                <p className="max-w-sm text-sm leading-6 text-zinc-500">
                  {ui.relatedSolutionsDescription}
                </p>
              </div>
              <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900 sm:grid-cols-2">
                {relatedPages.map((relatedPage) => {
                  const relatedTranslation = getMarketingTranslation(
                    relatedPage,
                    normalizedLocale,
                  );
                  return (
                    <Link
                      key={relatedPage.pathname}
                      href={`/${relatedPage.pathname}`}
                      className="group flex flex-col bg-[#09090B] p-7 transition-colors hover:bg-zinc-900/60"
                    >
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        {relatedTranslation.eyebrow}
                      </p>
                      <h3 className="mt-3 text-lg font-medium leading-7 text-zinc-200 transition-colors group-hover:text-white">
                        {relatedTranslation.title}
                      </h3>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors group-hover:text-zinc-200">
                        {ui.viewPage}
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

        {/* ── Closing CTA ──────────────────────────────────────
            The second and last emerald on the page, so it lands. */}
        <section className="border-t border-zinc-900 px-6 py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
            <div>
              <h2 className="max-w-3xl text-balance text-[2rem] font-medium leading-[1.08] tracking-[-0.04em] text-white sm:text-[2.75rem]">
                {translation.ctaTitle}
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
                {translation.ctaDescription}
              </p>
            </div>
            <TrackedLink
              href={ctaHref(page)}
              eventName="commercial_cta_click"
              eventParams={{ page_id: page.id, page_group: page.group }}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
            >
              {translation.ctaLabel}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </TrackedLink>
          </div>
        </section>

        {page.id !== "company-editorial-policy" ? (
          <aside
            className="border-t border-zinc-900 px-6 py-10"
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
                className="group inline-flex shrink-0 items-center gap-2 rounded-sm text-sm font-medium text-zinc-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                {ui.editorialPolicy}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </aside>
        ) : null}
      </main>

      <WaitlistFooter />
    </div>
  );
}
