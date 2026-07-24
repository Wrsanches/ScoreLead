import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BlogCard, BlogVisual } from "@/components/blog-card";
import { JsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { TrackedLink } from "@/components/tracked-link";
import { WaitlistFooter } from "@/components/waitlist-footer";
import { Link } from "@/i18n/routing";
import {
  blogPosts,
  getBlogPost,
  getBlogTranslation,
  getBlogUi,
} from "@/lib/blog";
import {
  getLanguageAlternates,
  getLocaleConfig,
  getLocalizedUrl,
  normalizeLocale,
  siteConfig,
} from "@/lib/seo";

type PageParams = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(getLocaleConfig(locale).htmlLang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function firstSentence(value: string) {
  const match = value.match(/^.*?[.!?](?:\s|$)/);
  return match?.[0]?.trim() ?? value;
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const normalizedLocale = normalizeLocale(locale);
  const translation = getBlogTranslation(post, normalizedLocale);
  const canonical = getLocalizedUrl(normalizedLocale, `blog/${post.slug}`);
  const image = `${siteConfig.url}/images/blog-og.png`;

  return {
    title: translation.title,
    description: translation.description,
    keywords: translation.keywords,
    authors: [
      {
        name: "ScoreLead Editorial",
        url: getLocalizedUrl(normalizedLocale, "authors/scorelead-editorial"),
      },
    ],
    creator: siteConfig.creator,
    publisher: siteConfig.name,
    alternates: {
      canonical,
      languages: getLanguageAlternates(`blog/${post.slug}`),
    },
    openGraph: {
      type: "article",
      locale: getLocaleConfig(normalizedLocale).ogLocale,
      url: canonical,
      siteName: siteConfig.name,
      title: translation.title,
      description: translation.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [
        getLocalizedUrl(normalizedLocale, "authors/scorelead-editorial"),
      ],
      tags: translation.keywords,
      images: [
        { url: image, width: 1200, height: 630, alt: translation.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: translation.title,
      description: translation.description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const normalizedLocale = normalizeLocale(locale);
  setRequestLocale(normalizedLocale);

  const translation = getBlogTranslation(post, normalizedLocale);
  const ui = getBlogUi(normalizedLocale);
  const canonical = getLocalizedUrl(normalizedLocale, `blog/${post.slug}`);
  const image = `${siteConfig.url}/images/blog-og.png`;
  const related = blogPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .slice(0, 3);
  const checklist = translation.sections.flatMap(
    (section) => section.points ?? [],
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        headline: translation.title,
        description: translation.description,
        image: [image],
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        inLanguage: getLocaleConfig(normalizedLocale).htmlLang,
        mainEntityOfPage: canonical,
        author: {
          "@type": "Organization",
          "@id": `${siteConfig.url}/#organization`,
          name: "ScoreLead Editorial",
          url: getLocalizedUrl(normalizedLocale, "authors/scorelead-editorial"),
        },
        editor: {
          "@type": "Organization",
          "@id": `${siteConfig.url}/#product-team`,
          name: ui.reviewerName,
          url: getLocalizedUrl(normalizedLocale, "editorial-policy"),
        },
        publisher: {
          "@type": "Organization",
          "@id": `${siteConfig.url}/#organization`,
          name: siteConfig.name,
          logo: {
            "@type": "ImageObject",
            url: `${siteConfig.url}/images/scorelead-logo-512.png`,
          },
        },
        keywords: translation.keywords.join(", "),
        articleSection: translation.category,
        citation: post.sources.map((source) => source.url),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteConfig.name,
            item: getLocalizedUrl(normalizedLocale),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: getLocalizedUrl(normalizedLocale, "blog"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: translation.title,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main id="main" className="pt-16">
        <article>
          <header className="border-b border-zinc-800/70 px-6 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-sm text-sm text-zinc-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {ui.backToBlog}
              </Link>
              <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.08fr_0.92fr]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
                    {translation.category}
                  </p>
                  <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                    {translation.title}
                  </h1>
                  <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg">
                    {translation.description}
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                    <span>
                      {ui.published}{" "}
                      <time dateTime={post.publishedAt}>
                        {formatDate(post.publishedAt, normalizedLocale)}
                      </time>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      {post.readingMinutes} {ui.minRead}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {ui.updated}{" "}
                      <time dateTime={post.updatedAt}>
                        {formatDate(post.updatedAt, normalizedLocale)}
                      </time>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {ui.authoredBy}{" "}
                      <Link
                        href="/authors/scorelead-editorial"
                        className="rounded-sm text-zinc-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                      >
                        ScoreLead Editorial
                      </Link>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {ui.reviewedBy}{" "}
                      <Link
                        href="/editorial-policy"
                        className="rounded-sm text-zinc-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                      >
                        {ui.reviewerName}
                      </Link>
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-zinc-800">
                  <BlogVisual post={post} category={translation.category} />
                </div>
              </div>
            </div>
          </header>

          <div className="px-6 py-14 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <section
                aria-labelledby="quick-answer"
                className="mb-12 border-y border-emerald-500/20 bg-emerald-500/4 px-5 py-6 sm:px-7"
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">
                  {ui.quickAnswer}
                </p>
                <h2 id="quick-answer" className="sr-only">
                  {ui.quickAnswer}
                </h2>
                <p className="mt-3 text-lg leading-8 text-zinc-200">
                  {post.quickAnswers[normalizedLocale]}
                </p>
              </section>

              <div className="space-y-6 text-[1.05rem] leading-8 text-zinc-300">
                {translation.introduction.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <section className="mt-14" aria-labelledby="decision-framework">
                <h2
                  id="decision-framework"
                  className="text-2xl font-medium tracking-tight text-white sm:text-3xl"
                >
                  {ui.decisionTable}
                </h2>
                <div className="mt-6 overflow-x-auto border-y border-zinc-800">
                  <table className="w-full min-w-155 border-collapse text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.14em] text-zinc-500">
                        <th scope="col" className="w-2/5 px-4 py-4 font-medium">
                          {ui.decision}
                        </th>
                        <th scope="col" className="px-4 py-4 font-medium">
                          {ui.whatToCheck}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {translation.sections.map((section) => (
                        <tr key={section.heading}>
                          <th
                            scope="row"
                            className="px-4 py-5 align-top text-sm font-medium text-zinc-200"
                          >
                            {section.heading}
                          </th>
                          <td className="px-4 py-5 text-sm leading-6 text-zinc-400">
                            {firstSentence(section.paragraphs[0])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="mt-14 space-y-14">
                {translation.sections.map((section, sectionIndex) => (
                  <section
                    key={section.heading}
                    aria-labelledby={`section-${sectionIndex}`}
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <span className="font-mono text-xs text-emerald-400">
                        {String(sectionIndex + 1).padStart(2, "0")}
                      </span>
                      <div className="h-px w-8 bg-emerald-500/40" />
                    </div>
                    <h2
                      id={`section-${sectionIndex}`}
                      className="text-balance text-2xl font-medium tracking-tight text-white sm:text-3xl"
                    >
                      {section.heading}
                    </h2>
                    <div className="mt-5 space-y-5 text-base leading-8 text-zinc-400 sm:text-[1.05rem]">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    {section.points && (
                      <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                        {section.points.map((point) => (
                          <li
                            key={point}
                            className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm leading-6 text-zinc-300"
                          >
                            <span
                              className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400"
                              aria-hidden="true"
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              {checklist.length ? (
                <section
                  className="mt-16"
                  aria-labelledby="practical-checklist"
                >
                  <h2
                    id="practical-checklist"
                    className="text-2xl font-medium tracking-tight text-white sm:text-3xl"
                  >
                    {ui.practicalChecklist}
                  </h2>
                  <ul className="mt-6 divide-y divide-zinc-800 border-y border-zinc-800">
                    {checklist.map((point, index) => (
                      <li
                        key={point}
                        className="grid gap-3 py-4 text-sm leading-6 text-zinc-300 sm:grid-cols-[38px_1fr]"
                      >
                        <span className="font-mono text-xs text-emerald-400">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section
                className="mt-16 border-y border-zinc-800 py-7"
                aria-labelledby="first-party-product-note"
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">
                  {ui.fieldNote}
                </p>
                <h2 id="first-party-product-note" className="sr-only">
                  {ui.fieldNote}
                </h2>
                <p className="mt-4 text-base leading-8 text-zinc-300 sm:text-[1.05rem]">
                  {post.fieldNotes[normalizedLocale]}
                </p>
              </section>

              <section className="mt-16 rounded-2xl border border-emerald-500/20 bg-emerald-500/6 p-7 sm:p-9">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
                  {ui.takeaway}
                </p>
                <h2 className="mt-4 text-2xl font-medium tracking-tight text-white">
                  {translation.conclusion.heading}
                </h2>
                <div className="mt-4 space-y-4 leading-7 text-zinc-400">
                  {translation.conclusion.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <Link
                  href={`/${post.relatedMarketingPath}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  {ui.productGuide}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </section>

              <section
                className="mt-16 border-t border-zinc-800 pt-9"
                aria-labelledby="article-sources"
              >
                <h2
                  id="article-sources"
                  className="text-2xl font-medium tracking-tight text-white"
                >
                  {ui.sources}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {ui.sourcesDescription}
                </p>
                <ol className="mt-6 divide-y divide-zinc-800 border-y border-zinc-800">
                  {post.sources.map((source, index) => (
                    <li
                      key={source.url}
                      className="grid gap-2 py-5 sm:grid-cols-[38px_1fr]"
                    >
                      <span className="font-mono text-xs text-zinc-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                      >
                        <span className="block text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
                          {source.title}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-600">
                          {source.publisher}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
                <Link
                  href="/editorial-policy"
                  className="mt-6 inline-flex items-center gap-2 rounded-sm text-sm text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  {ui.editorialPolicy}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </section>
            </div>
          </div>
        </article>

        <section
          className="border-y border-zinc-800/70 px-6 py-16 sm:py-20"
          aria-labelledby="related-heading"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="related-heading"
              className="text-3xl font-medium tracking-tight text-white"
            >
              {ui.relatedTitle}
            </h2>
            <p className="mt-3 text-zinc-500">{ui.relatedDescription}</p>
            <div className="mt-9 grid gap-6 md:grid-cols-3">
              {related.map((relatedPost) => (
                <BlogCard
                  key={relatedPost.slug}
                  post={relatedPost}
                  translation={getBlogTranslation(
                    relatedPost,
                    normalizedLocale,
                  )}
                  dateLabel={formatDate(
                    relatedPost.publishedAt,
                    normalizedLocale,
                  )}
                  readLabel={ui.minRead}
                  readArticleLabel={ui.readArticle}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
              {ui.ctaEyebrow}
            </p>
            <h2 className="mt-4 text-balance text-3xl font-medium tracking-tight text-white sm:text-5xl">
              {ui.ctaTitle}
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-zinc-400">
              {ui.ctaDescription}
            </p>
            <TrackedLink
              href="/signup"
              eventName="article_cta_click"
              eventParams={{ article_slug: post.slug }}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
            >
              {ui.ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </TrackedLink>
          </div>
        </section>
      </main>

      <WaitlistFooter />
    </div>
  );
}
