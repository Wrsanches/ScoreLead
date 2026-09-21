/**
 * Generate cover art for every blog post with the GPT Image model and write
 * it to public/images/blog plus a manifest the site reads at build time.
 *
 *   bun --env-file=.env.local run scripts/generate-blog-images.ts            # missing only
 *   bun --env-file=.env.local run scripts/generate-blog-images.ts --force    # regenerate all
 *   bun --env-file=.env.local run scripts/generate-blog-images.ts <slug>...  # specific posts
 *
 * Covers are editorial photographs of people at work (one scene per post).
 * Each post gets one 1600x832 WebP hero and a 1200x630 JPEG for social cards,
 * both derived from a single generation so they match.
 */
import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import OpenAI from "openai"
import sharp from "sharp"
import { blogPosts } from "../lib/blog"
import type { BlogAccent } from "../lib/blog/types"
import { OPENAI_IMAGE_MODEL } from "../lib/models"

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, "public", "images", "blog")
const MANIFEST = path.join(ROOT, "lib", "blog", "image-manifest.json")
const HERO = { width: 1600, height: 832 }
const OG = { width: 1200, height: 630 }

/** One scene per article so covers read as real work, not stock filler. */
const SCENES: Record<string, string> = {
  "ai-lead-generation-guide":
    "a small B2B sales team of three reviewing a shortlist of target companies together on a laptop at a bright office table, one person pointing at the screen while another takes notes",
  "b2b-lead-scoring-model":
    "a sales analyst at a standing desk comparing a printed one-page scorecard against a laptop, coffee nearby, colleague blurred in the background",
  "ideal-customer-profile-guide":
    "two founders mapping their ideal customer on a glass wall with sticky notes and a marker, morning light from a window",
  "lead-enrichment-guide":
    "a researcher at a desk cross-checking a company's website on a laptop with a notebook of handwritten notes open beside it",
  "sales-prospecting-automation":
    "a sales operations lead presenting a workflow sketch on a whiteboard to two teammates in a small meeting room",
  "b2b-prospecting-guide":
    "a salesperson on a phone call at a window desk with a laptop and a short handwritten list of companies, city softly out of focus behind",
  "personalized-b2b-outreach":
    "a person carefully writing an email on a laptop at a quiet cafe table, a printed company brief beside the keyboard",
  "manual-lead-research-vs-automation":
    "side by side at one long desk, one colleague working through a stack of printed lists with a highlighter while another works from a laptop dashboard",
  "b2b-sales-pipeline-guide":
    "a weekly pipeline review, four people around a table looking at a kanban board of cards on the wall, one moving a card",
  "crm-data-quality-guide":
    "an operations manager at a desk tidying spreadsheet rows on a large monitor, a mug and a plant on the desk, calm focused expression",
  "multilingual-b2b-prospecting":
    "a diverse team in a video call, one person speaking, laptop screens showing colleagues, a world map poster on the wall behind",
}

/** One consistent photographic direction so the blog index reads as a set. */
function buildPrompt(input: { slug: string; title: string; category: string; accent: BlogAccent }) {
  const scene = SCENES[input.slug] ?? "a small B2B team working together at a laptop in a bright modern office"
  return [
    `Editorial documentary photograph for a business article about ${input.category.toLowerCase()} ("${input.title}").`,
    `Scene: ${scene}.`,
    "Photography: candid, natural, unposed moment; real people of varied ages and backgrounds in smart-casual clothing; shot on a 35mm lens at eye level with shallow depth of field; soft natural window light; true-to-life skin tones.",
    "Look: modern, calm, understated premium. Neutral palette of warm greys, off-whites, wood, and charcoal with muted, natural colors. Light film grain, gentle contrast, no heavy filters, no HDR, no neon.",
    "Composition: wide landscape frame with the people weighted toward the right two thirds and quiet negative space on the left for text overlays.",
    "Strict rules: any laptop, phone, or monitor screen must show only soft, unreadable blurred shapes; no legible text anywhere, no letters, no numbers, no logos, no brand marks, no watermarks, no captions.",
  ].join("\n")
}

async function readManifest(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(MANIFEST, "utf8"))
  } catch {
    return {}
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required")
  const args = process.argv.slice(2)
  const force = args.includes("--force")
  const requested = new Set(args.filter((a) => !a.startsWith("--")))

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  await mkdir(OUT_DIR, { recursive: true })
  const manifest = await readManifest()

  const targets = blogPosts.filter((post) => {
    if (requested.size > 0) return requested.has(post.slug)
    return force || !manifest[post.slug]
  })
  if (targets.length === 0) {
    console.log("Nothing to do. Pass --force to regenerate.")
    return
  }
  console.log(`Generating ${targets.length} cover(s) with ${OPENAI_IMAGE_MODEL}...`)

  for (const post of targets) {
    const en = post.translations.en
    const prompt = buildPrompt({
      slug: post.slug,
      title: en.title,
      category: en.category,
      accent: post.accent,
    })
    const started = Date.now()
    process.stdout.write(`- ${post.slug} ... `)
    try {
      const result = await openai.images.generate({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size: `${HERO.width}x${HERO.height}` as "1024x1024",
        quality: "high",
        output_format: "png",
        moderation: "low",
      })
      const b64 = result.data?.[0]?.b64_json
      if (!b64) throw new Error("model returned no image data")
      const png = Buffer.from(b64, "base64")

      // Content-hashed basename: a regenerated cover is a new URL everywhere.
      const file = `${post.slug}-${createHash("sha256").update(png).digest("hex").slice(0, 8)}`
      await sharp(png)
        .resize(HERO.width, HERO.height, { fit: "cover" })
        .webp({ quality: 82 })
        .toFile(path.join(OUT_DIR, `${file}.webp`))
      await sharp(png)
        .resize(OG.width, OG.height, { fit: "cover", position: "centre" })
        .jpeg({ quality: 86, mozjpeg: true })
        .toFile(path.join(OUT_DIR, `${file}.jpg`))
      for (const stale of await readdir(OUT_DIR)) {
        const base = stale.replace(/\.(webp|jpg)$/, "")
        if (base !== file && (base === post.slug || base.startsWith(`${post.slug}-`))) {
          await unlink(path.join(OUT_DIR, stale)).catch(() => {})
        }
      }

      manifest[post.slug] = {
        file,
        width: HERO.width,
        height: HERO.height,
        model: OPENAI_IMAGE_MODEL,
        generatedAt: new Date().toISOString(),
        prompt,
      }
      await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n")
      console.log(`done in ${Math.round((Date.now() - started) / 1000)}s`)
    } catch (error) {
      console.log(`FAILED: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST)} (${Object.keys(manifest).length} posts with art)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
