import { ArrowUpRight, Clock3 } from "lucide-react"
import { Link } from "@/i18n/routing"
import type { BlogPost, BlogTranslation } from "@/lib/blog"

const accentStyles = {
  emerald: {
    border: "group-hover:border-emerald-500/35",
    text: "text-emerald-400",
    glow: "bg-emerald-400",
    line: "bg-emerald-400/50",
  },
  cyan: {
    border: "group-hover:border-cyan-500/35",
    text: "text-cyan-400",
    glow: "bg-cyan-400",
    line: "bg-cyan-400/50",
  },
  violet: {
    border: "group-hover:border-violet-500/35",
    text: "text-violet-400",
    glow: "bg-violet-400",
    line: "bg-violet-400/50",
  },
  amber: {
    border: "group-hover:border-amber-500/35",
    text: "text-amber-400",
    glow: "bg-amber-400",
    line: "bg-amber-400/50",
  },
  rose: {
    border: "group-hover:border-rose-500/35",
    text: "text-rose-400",
    glow: "bg-rose-400",
    line: "bg-rose-400/50",
  },
} as const

export function BlogVisual({
  post,
  category,
  compact = false,
}: {
  post: BlogPost
  category: string
  compact?: boolean
}) {
  const accent = accentStyles[post.accent]

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden border-b border-zinc-800 bg-zinc-950 ${
        compact ? "h-44" : "min-h-72 sm:min-h-80"
      }`}
    >
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className={`absolute -right-16 -top-20 size-64 rounded-full blur-[90px] opacity-15 ${accent.glow}`} />
      <div className="absolute inset-x-7 bottom-7 top-7 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${accent.text}`}>
            ScoreLead / Insights
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            {post.publishedAt.slice(0, 7)}
          </span>
        </div>
        <div>
          <div className={`mb-4 h-px w-14 ${accent.line}`} />
          <p className="max-w-xs text-balance text-xl font-medium leading-tight text-zinc-200">
            {category}
          </p>
        </div>
      </div>
    </div>
  )
}

export function BlogCard({
  post,
  translation,
  dateLabel,
  readLabel,
  readArticleLabel,
}: {
  post: BlogPost
  translation: BlogTranslation
  dateLabel: string
  readLabel: string
  readArticleLabel: string
}) {
  const accent = accentStyles[post.accent]

  return (
    <article className="h-full">
      <Link
        href={`/blog/${post.slug}`}
        className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/35 transition duration-300 hover:-translate-y-1 hover:bg-zinc-900/60 ${accent.border} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400`}
      >
        <BlogVisual post={post} category={translation.category} compact />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-500">
            <span className={accent.text}>{translation.category}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.publishedAt}>{dateLabel}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {post.readingMinutes} {readLabel}
            </span>
          </div>
          <h3 className="mt-4 text-xl font-medium leading-snug tracking-tight text-zinc-100 transition-colors group-hover:text-white">
            {translation.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
            {translation.description}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
            <span className="transition-colors group-hover:text-white">{readArticleLabel}</span>
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}
