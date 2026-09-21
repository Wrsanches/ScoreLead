import manifest from "./image-manifest.json"

/**
 * Generated cover art for blog posts, written by `bun run blog:images`.
 * The manifest is the source of truth for which slugs have files, so a post
 * without art falls back to the typographic visual instead of a broken image.
 */
export type BlogImageEntry = {
  /** Versioned basename (slug + content hash) shared by the .webp and .jpg files. */
  file: string
  width: number
  height: number
  model: string
  generatedAt: string
  prompt: string
}

const entries = manifest as Record<string, BlogImageEntry>

export const BLOG_HERO_SIZE = { width: 1600, height: 832 } as const
export const BLOG_OG_SIZE = { width: 1200, height: 630 } as const

export function getBlogImage(slug: string) {
  const entry = entries[slug]
  if (!entry) return null
  // Regenerated covers get a new hashed filename, so browsers, the image
  // optimizer, and CDNs never serve a stale copy under an old URL.
  return {
    /** Wide hero, WebP, shown on the card and article header. */
    hero: `/images/blog/${entry.file}.webp`,
    heroWidth: entry.width,
    heroHeight: entry.height,
    /** Social preview, JPEG at the standard 1200x630. */
    og: `/images/blog/${entry.file}.jpg`,
    ogWidth: BLOG_OG_SIZE.width,
    ogHeight: BLOG_OG_SIZE.height,
  }
}
