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
        <header className="border-b border-zinc-800/70 px-6 py-12 sm:py-20 lg:py-24">
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
                <h1 className="mt-5 max-w-4xl text-balance text-4xl font-medium leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
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

            <MarketingPlatformImage page={page} locale={normalizedLocale} />
          </div>
        </header>

        <section
          className="px-6 py-14 sm:py-20"
          aria-labelledby="direct-answer"
        >
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr]">
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
            <p className="max-w-3xl text-pretty text-xl leading-9 text-zinc-300">
              {translation.answer}
            </p>
          </div>
        </section>

        <section
          className="border-y border-zinc-800/70 px-6"
          aria-labelledby="outcomes"
        >
          <div className="mx-auto max-w-6xl py-12 sm:py-16">
            <h2 id="outcomes" className="text-sm font-medium text-zinc-400">
              {ui.keyOutcomes}
            </h2>
            <ol className="mt-8 divide-y divide-zinc-800 border-y border-zinc-800">
              {translation.highlights.map((highlight, index) => (
                <li
                  key={highlight}
                  className="grid gap-3 py-6 sm:grid-cols-[60px_1fr] sm:items-start"
                >
                  <span className="font-mono text-xs text-emerald-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="max-w-3xl text-lg leading-7 text-zinc-200">
                    {highlight}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {page.group === "tools" ? (
          <section
            className="px-6 py-14 sm:py-20"
            aria-label={translation.title}
          >
            <div className="mx-auto max-w-5xl">
              <MarketingTool slug={page.slug} locale={normalizedLocale} />
            </div>
          </section>
        ) : null}

        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-14">
              {translation.sections.map((section, index) => (
                <section
                  key={section.heading}
                  aria-labelledby={`${page.slug}-section-${index}`}
                  className="grid gap-7 border-t border-zinc-800 pt-9 lg:grid-cols-[0.72fr_1.28fr]"
                >
                  <div>
                    <span className="font-mono text-xs text-emerald-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2
                      id={`${page.slug}-section-${index}`}
                      className="mt-4 max-w-sm text-2xl font-medium tracking-tight text-white sm:text-3xl"
                    >
                      {section.heading}
                    </h2>
                  </div>
                  <div>
                    <div className="space-y-5 text-base leading-8 text-zinc-400 sm:text-lg">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    {section.points ? (
                      <ul className="mt-7 grid gap-x-8 gap-y-3 border-y border-zinc-800 py-5 sm:grid-cols-2">
                        {section.points.map((point) => (
                          <li
                            key={point}
                            className="flex items-start gap-3 text-sm leading-6 text-zinc-300"
                          >
                            <span
                              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-emerald-400"
                              aria-hidden="true"
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section
          className="border-y border-emerald-500/15 bg-emerald-500/[0.035] px-6 py-14 sm:py-18"
          aria-labelledby="evidence"
        >
          <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">
                {ui.evidence}
              </p>
              <h2
                id="evidence"
                className="mt-4 text-2xl font-medium tracking-tight text-white"
              >
                {translation.proofLabel}
              </h2>
            </div>
            <div>
              <p className="max-w-3xl text-lg leading-8 text-zinc-300">
                {translation.proof}
              </p>
              {page.id === "case-study-ceramik" ? (
                <a
                  href="https://ceramik.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
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
            className="px-6 py-16 sm:py-22"
            aria-labelledby="related-guides"
          >
            <div className="mx-auto max-w-6xl">
              <div className="max-w-2xl">
                <h2
                  id="related-guides"
                  className="text-3xl font-medium tracking-tight text-white"
                >
                  {ui.relatedGuides}
                </h2>
                <p className="mt-3 leading-7 text-zinc-500">
                  {ui.relatedGuidesDescription}
                </p>
              </div>
              <div className="mt-9 divide-y divide-zinc-800 border-y border-zinc-800">
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
              href={ctaHref(page)}
              eventName="commercial_cta_click"
              eventParams={{ page_id: page.id, page_group: page.group }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
            >
              {translation.ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </TrackedLink>
          </div>
        </section>

        {page.id !== "company-editorial-policy" ? (
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
        ) : null}
      </main>

      <WaitlistFooter />
    </div>
  );
}
