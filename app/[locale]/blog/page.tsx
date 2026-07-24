import type { Metadata } from "next"
import { ArrowRight, Clock3 } from "lucide-react"
import { setRequestLocale } from "next-intl/server"
import { BlogCard, BlogVisual } from "@/components/blog-card"
import { JsonLd } from "@/components/json-ld"
import { Navbar } from "@/components/navbar"
import { TrackedLink } from "@/components/tracked-link"
import { WaitlistFooter } from "@/components/waitlist-footer"
import { Link } from "@/i18n/routing"
import {
  blogPosts,
  getBlogTranslation,
  getBlogUi,
} from "@/lib/blog"
import {
  getLanguageAlternates,
  getLocaleConfig,
  getLocalizedUrl,
  normalizeLocale,
  siteConfig,
} from "@/lib/seo"

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(getLocaleConfig(locale).htmlLang, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const normalizedLocale = normalizeLocale(locale)
  const ui = getBlogUi(normalizedLocale)
  const canonical = getLocalizedUrl(normalizedLocale, "blog")
  const image = `${siteConfig.url}/images/blog-og.png`

  return {
    title: ui.metadataTitle,
    description: ui.metadataDescription,
    keywords: Array.from(
      new Set(
        blogPosts.flatMap((post) =>
          getBlogTranslation(post, normalizedLocale).keywords.slice(0, 2),
        ),
      ),
    ),
    alternates: {
      canonical,
      languages: getLanguageAlternates("blog"),
    },
    openGraph: {
      type: "website",
      locale: getLocaleConfig(normalizedLocale).ogLocale,
      url: canonical,
      siteName: siteConfig.name,
      title: ui.metadataTitle,
      description: ui.metadataDescription,
      images: [{ url: image, width: 1200, height: 630, alt: ui.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: ui.metadataTitle,
      description: ui.metadataDescription,
      images: [image],
    },
    robots: { index: true, follow: true },
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const normalizedLocale = normalizeLocale(locale)
  setRequestLocale(normalizedLocale)

  const ui = getBlogUi(normalizedLocale)
  const featured = blogPosts[0]
  const featuredTranslation = getBlogTranslation(featured, normalizedLocale)
  const canonical = getLocalizedUrl(normalizedLocale, "blog")
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${canonical}#blog`,
    url: canonical,
    name: ui.metadataTitle,
    description: ui.metadataDescription,
    inLanguage: getLocaleConfig(normalizedLocale).htmlLang,
    publisher: {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
    },
    blogPost: blogPosts.map((post) => {
      const translation = getBlogTranslation(post, normalizedLocale)
      return {
        "@type": "BlogPosting",
        headline: translation.title,
        description: translation.description,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        url: getLocalizedUrl(normalizedLocale, `blog/${post.slug}`),
      }
    }),
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main id="main" className="pt-16">
        <header className="relative overflow-hidden border-b border-zinc-800/70 px-6 py-20 sm:py-28">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(16,185,129,0.16),transparent_58%)]" />
          <div className="relative mx-auto max-w-6xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-400">
              {ui.eyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl text-balance text-4xl font-medium tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              {ui.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg">
              {ui.description}
            </p>
          </div>
        </header>

        <section className="px-6 py-16 sm:py-24" aria-labelledby="featured-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex items-center gap-4">
              <h2 id="featured-heading" className="text-sm font-medium text-zinc-300">
                {ui.featured}
              </h2>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/30 transition duration-300 hover:border-emerald-500/30 hover:bg-zinc-900/55 lg:grid-cols-[1.1fr_0.9fr] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
            >
              <BlogVisual post={featured} category={featuredTranslation.category} />
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="text-emerald-400">{featuredTranslation.category}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={featured.publishedAt}>
                    {formatDate(featured.publishedAt, normalizedLocale)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {featured.readingMinutes} {ui.minRead}
                  </span>
                </div>
                <h3 className="mt-5 text-balance text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  {featuredTranslation.title}
                </h3>
                <p className="mt-5 text-pretty leading-7 text-zinc-400">
                  {featuredTranslation.description}
                </p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white">
                  {ui.readArticle}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-800/70 px-6 py-16 sm:py-24" aria-labelledby="latest-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mb-9 flex items-center gap-4">
              <h2 id="latest-heading" className="text-2xl font-medium tracking-tight text-white">
                {ui.latest}
              </h2>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.slice(1).map((post) => (
                <BlogCard
                  key={post.slug}
                  post={post}
                  translation={getBlogTranslation(post, normalizedLocale)}
                  dateLabel={formatDate(post.publishedAt, normalizedLocale)}
                  readLabel={ui.minRead}
                  readArticleLabel={ui.readArticle}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 sm:pb-28">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8 sm:p-12">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
              {ui.ctaEyebrow}
            </p>
            <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="max-w-2xl text-balance text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  {ui.ctaTitle}
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-zinc-400">{ui.ctaDescription}</p>
              </div>
              <TrackedLink
                href="/signup"
                eventName="article_cta_click"
                eventParams={{ article_slug: "blog-index" }}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-emerald-400 px-5 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                {ui.ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </TrackedLink>
            </div>
          </div>
        </section>
      </main>

      <WaitlistFooter />
    </div>
  )
}
