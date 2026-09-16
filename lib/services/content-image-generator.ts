import OpenAI, { toFile } from "openai";
import { unlink, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ContentPillar, ContentPostType } from "@/lib/content-pillars";
import type { ProductImage, ReferenceImagePref } from "@/lib/product-images";
import { OPENAI_IMAGE_MODEL, OPENAI_TEXT_MODEL } from "@/lib/models";
import {
  buildKey,
  deleteObject,
  getObjectBase64,
  isManagedUrl,
  keyFromUrl,
  putObject,
} from "@/lib/s3";

// Legacy filesystem location for images created before the S3 migration.
const LEGACY_PREFIX = "/generated/content-images/";

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export interface ImageGenBusiness {
  name: string | null;
  description: string | null;
  category: string | null;
  field: string | null;
  persona: string | null;
  clientPersona: string | null;
  services: string | null;
  brandStyle: string | null;
  brandColorPrimary: string | null;
  brandColorSecondary: string | null;
  brandFonts: string[] | null;
  language: string | null;
  productImages: ProductImage[] | null;
}

export interface ImageGenPost {
  id: string;
  postType: ContentPostType;
  pillar: ContentPillar | null;
  caption: string;
  visualIdea: string | null;
  callToAction: string | null;
  referenceImagePref: ReferenceImagePref | null;
}

export interface GeneratedSlide {
  url: string;
  headline: string;
  prompt: string;
}

export interface SlideFailure {
  index: number;
  reason: string;
}

export interface GeneratePostImagesResult {
  slides: GeneratedSlide[];
  failures: SlideFailure[];
}

interface GeneratePostImagesOptions {
  beforeGenerate?: (plannedImageCount: number) => Promise<void>;
  /** One-off reference uploaded specifically for this generation. */
  referenceImageUrl?: string;
}

interface PillarDirection {
  intent: string;
  subjectPriority: string;
  typography: string;
}

const PILLAR_DIRECTION: Record<ContentPillar, PillarDirection> = {
  educate: {
    intent:
      "Make one idea instantly understandable through a concrete visual metaphor. Clarity comes from the subject and composition, not from diagrams or extra explanatory copy.",
    subjectPriority:
      "Choose one memorable object, gesture, or comparison that embodies the lesson. Keep the hierarchy unmistakable and leave a calm area for the headline.",
    typography:
      "One short, plain-spoken headline in a clean sans-serif. The visual teaches; the type names the idea in as few words as possible.",
  },
  showcase: {
    intent:
      "Make the real product, service artifact, or result unmistakably desirable. The featured subject is specific to this business, never a generic category substitute.",
    subjectPriority:
      "Give the product a decisive hero moment. Preserve recognizable details and use scale, framing, or context to make its value felt.",
    typography:
      "A confident, understated headline set apart from the product so nothing covers its defining details.",
  },
  story: {
    intent:
      "Create a lived-in narrative moment with a sense of before and after. It should feel observed, personal, and particular to the business.",
    subjectPriority:
      "Show a meaningful gesture, place, tool, or trace of human activity. Favor emotional specificity over a polished generic scene.",
    typography:
      "A quieter headline, placed like an editorial caption or opening title so the scene can carry the emotion.",
  },
  proof: {
    intent:
      "Turn evidence, a result, or a customer truth into the hero. The frame should feel credible and earned rather than like a decorative testimonial template.",
    subjectPriority:
      "Show the proof in context: a real artifact, a product in use, a meaningful detail, or a human reaction. Never invent metrics, logos, or customer identities.",
    typography:
      "Treat the headline like a magazine pull-quote or evidence statement, with generous margins and a strong reading order.",
  },
  engagement: {
    intent:
      "Create an immediate visual question, tension, or playful surprise that invites a response without relying on engagement-bait graphics.",
    subjectPriority:
      "Use an unexpected juxtaposition, expressive gesture, bold crop, or tactile interaction. The image should reward a second look.",
    typography:
      "Still restrained: one line, one weight, maybe one word set heavier. Energy comes from the image and the crop, not from loud type.",
  },
};

export interface CreativeDirection {
  id: string;
  name: string;
  medium: string;
  composition: string;
  lightAndTexture: string;
  typography: string;
}

const CREATIVE_DIRECTIONS: CreativeDirection[] = [
  {
    id: "seamless-hero",
    name: "Seamless studio hero",
    medium:
      "Premium product photography on a pure white or pure black seamless backdrop, in the manner of an Apple product page. Real materials, flawless finish, no set dressing.",
    composition:
      "One hero subject occupying roughly a third of the frame, placed with deliberate asymmetry or exact centering. Everything else is empty. The negative space is the design.",
    lightAndTexture:
      "Soft wraparound studio light with one crisp specular highlight along the subject's edge, a faint soft contact shadow, and perfectly clean tonal gradation on the backdrop.",
    typography:
      "One short headline in a clean geometric sans-serif, tight letter-spacing, medium weight, black on white or white on black, aligned to a clear margin. Nothing else.",
  },
  {
    id: "macro-material",
    name: "Macro material detail",
    medium:
      "An extreme close-up of the product, tool, or material, photographed like a premium hardware reveal: edges, seams, grain, finish, and machining fill the frame.",
    composition:
      "Crop in hard so the subject becomes an abstract landscape of texture and edge. One sharp plane of focus, the rest falling into smooth defocus. Leave one calm region for the headline.",
    lightAndTexture:
      "Raking directional light that reveals micro-texture, controlled specular highlights, deep but clean shadows, and true material color. No grain, no haze, no filters.",
    typography:
      "A quiet headline in a clean sans-serif set small and precise in the calm region, sentence case, one weight. The detail is the hero; the type is a caption.",
  },
  {
    id: "keynote-type",
    name: "Keynote typography",
    medium:
      "A keynote-style frame: a solid black or near-black field, one large headline, and at most one small product or object placed with precision. Designed, not illustrated.",
    composition:
      "The headline is the composition. Set it large, left-aligned or centered, with generous margins. Any subject is small, isolated, and placed to balance the type.",
    lightAndTexture:
      "Matte black field with a barely visible soft vignette or a single soft spotlight on the subject. Zero clutter, zero decoration, no gradients that call attention to themselves.",
    typography:
      "Large clean geometric sans-serif, tight tracking, semibold or medium, white on black, with perfect kerning. One line if possible, two at most.",
  },
  {
    id: "quiet-lifestyle",
    name: "Quiet lifestyle editorial",
    medium:
      "Understated lifestyle photography in the style of an Apple campaign: a real environment, a person's hands or partial figure interacting with the product, and honest natural light.",
    composition:
      "One gesture, one subject, and a calm background with shallow depth of field. Off-center placement with a clear pocket of empty space for the headline.",
    lightAndTexture:
      "Soft window light or open-shade daylight, muted natural palette, gentle contrast, true skin and material tones, and crisp focus on the point of contact.",
    typography:
      "A short, warm headline in a clean sans-serif, set in the empty space, one weight, unobtrusive, aligned to a margin. It should read like a whisper, not a banner.",
  },
  {
    id: "color-field",
    name: "Monochrome color field",
    medium:
      "A single flat or softly graded field of the brand's primary color filling the frame, with the product or subject rendered in tonal harmony or as one sharp contrasting accent.",
    composition:
      "One subject, generous margins, exact placement. Use scale or a single diagonal for tension. No secondary props, no patterns, no shapes.",
    lightAndTexture:
      "Smooth, even color with a soft studio shadow anchoring the subject. Materials stay believable and premium. No noise, no texture overlays, no glossy plastic sheen.",
    typography:
      "One headline in a clean sans-serif, in white or the darkest tone of the field, tight tracking, medium weight, aligned to a clear grid line.",
  },
  {
    id: "floating-still",
    name: "Floating precision still",
    medium:
      "Product photography with the subject, or a few of its parts, suspended in mid-air on a seamless backdrop, arranged with engineering precision like an exploded view.",
    composition:
      "A calm, exact arrangement: components aligned on one axis or a gentle arc, evenly spaced, with a clear focal element and open space around the whole group.",
    lightAndTexture:
      "Clean studio light, crisp edges, soft ground shadows that make the levitation believable, and precise material rendering. Nothing dramatic, everything controlled.",
    typography:
      "A short headline in a clean geometric sans-serif set in the open space, one weight, aligned to the arrangement's axis. Sentence case, no punctuation flourishes.",
  },
];

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Avalanche the low bits too. We take a small modulo below, and raw FNV-1a
  // low bits cluster for sequential post ids such as post-1, post-2, ...
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

function directionIdFromPrompt(prompt?: string): string | null {
  if (!prompt) return null;
  return prompt.match(/== CREATIVE DIRECTION: ([a-z-]+) ==/)?.[1] ?? null;
}

/**
 * Chooses a repeatable direction for a new post and rotates away from the
 * previous direction on regeneration. Refinements preserve the current look.
 */
export function selectCreativeDirection(
  seed: string,
  previousPrompt?: string,
  preservePrevious = false,
): CreativeDirection {
  const previousId = directionIdFromPrompt(previousPrompt);
  const previousIndex = CREATIVE_DIRECTIONS.findIndex(
    (direction) => direction.id === previousId,
  );
  if (previousIndex >= 0) {
    return CREATIVE_DIRECTIONS[
      preservePrevious
        ? previousIndex
        : (previousIndex + 1) % CREATIVE_DIRECTIONS.length
    ];
  }
  return CREATIVE_DIRECTIONS[stableHash(seed) % CREATIVE_DIRECTIONS.length];
}

const POST_TYPE_ASPECT: Record<ContentPostType, "4:5" | "9:16" | "1:1"> = {
  single: "4:5",
  carousel: "4:5",
  reel: "9:16",
  story: "9:16",
};

/**
 * Exact output sizes for GPT Image. Both dimensions must be divisible by 16
 * and the aspect must sit between 1:3 and 3:1. These map 1:1 onto Instagram's
 * 4:5 feed crop and 9:16 reel/story canvas at roughly 2K.
 */
const POST_TYPE_SIZE: Record<ContentPostType, string> = {
  single: "1280x1600",
  carousel: "1280x1600",
  reel: "1152x2048",
  story: "1152x2048",
};

function extractHook(caption: string): string {
  const firstLine = caption.split("\n")[0]?.trim();
  if (firstLine && firstLine.length > 0) return firstLine;
  return caption.slice(0, 100).trim();
}

interface SlidePlan {
  headline: string;
  role: "cover" | "body" | "cta";
  sceneNote?: string;
}

async function planCarouselSlides(
  caption: string,
  pillar: ContentPillar | null,
  language: string | null,
): Promise<SlidePlan[]> {
  const openaiClient = getOpenAI();
  if (openaiClient) {
    try {
      const system = `You are an Instagram carousel designer. Given the full caption a user wrote for a carousel post, split it into 4-7 slide-headlines for a swipeable Instagram carousel.

RULES:
- Slide 1 is the COVER. The headline must be the hook that stops the scroll. Usually the first line of the caption. Under 60 characters.
- Slides 2 through N-1 are BODY slides. Each one covers a single idea from the caption body. Each headline is under 50 characters and must stand alone. If the caption has a numbered list, extract each item as its own slide.
- Last slide (optional) is a CTA slide with a short call to action if the caption ends with one.
- Do NOT invent content the caption does not contain.
- Keep each "sceneNote" to one sentence describing what the slide's photograph should show: one concrete real-world object, product detail, or gesture relevant to the headline, shot as clean minimal product photography with lots of empty space (think Apple product pages, not stock photos).
- All headlines and sceneNotes must be in the language of the caption${language ? ` (detected: ${language})` : ""}.
- Pillar: ${pillar ?? "educate"} - let this inform the photographic mood.

Return ONLY JSON of this shape:
{"slides":[{"headline":"...","role":"cover"|"body"|"cta","sceneNote":"..."}]}`;

      const response = await openaiClient.chat.completions.create({
        model: OPENAI_TEXT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: caption },
        ],
        max_completion_tokens: 1200,
      });
      const content = response.choices[0]?.message?.content;
      if (content) {
        const data = JSON.parse(content) as { slides?: unknown };
        if (Array.isArray(data.slides)) {
          const plans: SlidePlan[] = [];
          for (const raw of data.slides as Array<Record<string, unknown>>) {
            const headline = raw.headline;
            const role = raw.role;
            if (typeof headline !== "string") continue;
            plans.push({
              headline: headline.slice(0, 120),
              role:
                role === "cover" || role === "cta" || role === "body"
                  ? role
                  : "body",
              sceneNote:
                typeof raw.sceneNote === "string" ? raw.sceneNote : undefined,
            });
          }
          if (plans.length >= 2) {
            const clamped = plans.slice(0, 8);
            if (clamped[0].role !== "cover") clamped[0].role = "cover";
            return clamped;
          }
        }
      }
    } catch (err) {
      console.error(
        "[content-image] slide planning failed, falling back:",
        err,
      );
    }
  }

  return fallbackSlideSplit(caption);
}

/**
 * Fallback slide splitter used when OpenAI is unavailable.
 * Tries: numbered-list extraction first, then paragraph split, then single-slide fallback.
 */
function fallbackSlideSplit(caption: string): SlidePlan[] {
  const normalized = caption.trim();
  const numberedMatches = [
    ...normalized.matchAll(/(^|\n)\s*\d+[.)-]\s+([^\n]+)/g),
  ];
  if (numberedMatches.length >= 3) {
    const cover = extractHook(caption);
    const bodies: SlidePlan[] = numberedMatches
      .slice(0, 6)
      .map((m) => ({ headline: m[2].trim().slice(0, 120), role: "body" }));
    const hasCta = /save|share|dm|comment|follow/i.test(
      normalized.split("\n").pop() ?? "",
    );
    const plans: SlidePlan[] = [{ headline: cover, role: "cover" }, ...bodies];
    if (hasCta) {
      plans.push({
        headline: normalized.split("\n").pop()!.slice(0, 120),
        role: "cta",
      });
    }
    return plans;
  }

  const blocks = normalized
    .split(/\n{2,}|\r{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 6);
  const plans: SlidePlan[] = blocks.map((b, i) => ({
    headline: b.split("\n")[0]?.slice(0, 120) ?? b.slice(0, 120),
    role:
      i === 0
        ? "cover"
        : i === blocks.length - 1 && /save|share|dm|comment|follow/i.test(b)
          ? "cta"
          : "body",
  }));
  if (plans.length === 0) {
    plans.push({ headline: extractHook(caption), role: "cover" });
  }
  return plans;
}

/**
 * Decides which of the business's product images (if any) should be used as a
 * reference image for this post's generation. Honors the post's explicit pref
 * ("none" / "specific"); in "auto" mode asks OpenAI to match the post against
 * the image descriptions, with a conservative keyword-overlap fallback.
 * Returns null when no image should be referenced.
 */
async function selectProductReferenceImage(
  business: ImageGenBusiness,
  post: ImageGenPost,
): Promise<ProductImage | null> {
  const images = (business.productImages ?? []).filter((img) => img.url);
  if (images.length === 0) return null;

  const pref = post.referenceImagePref;
  if (pref?.mode === "none") return null;
  if (pref?.mode === "specific") {
    // A pinned-but-deleted image degrades to no reference (predictable),
    // never silently to auto.
    return images.find((img) => img.id === pref.imageId) ?? null;
  }

  const postText = [post.caption, post.visualIdea ?? ""]
    .filter(Boolean)
    .join("\n\n");

  const openaiClient = getOpenAI();
  if (openaiClient) {
    try {
      const system = `You decide whether an Instagram post's image should feature one of the brand's real product photos. You are given the post's caption and visual idea, and a numbered list of product-image descriptions.

Pick the single most relevant image ONLY if the post is genuinely about the business's own product or service shown in that image. If the post is generic (tips, engagement question, industry story, behind-the-scenes) return null.

Return ONLY JSON: {"selectedIndex": <zero-based number or null>}`;

      const user = `POST:\n${postText}\n\nPRODUCT IMAGES:\n${images
        .map(
          (img, i) =>
            `${i}. ${img.description.trim() || "(no description)"}`,
        )
        .join("\n")}`;

      const response = await openaiClient.chat.completions.create({
        model: OPENAI_TEXT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_completion_tokens: 100,
      });
      const content = response.choices[0]?.message?.content;
      if (content) {
        const data = JSON.parse(content) as { selectedIndex?: unknown };
        const idx = data.selectedIndex;
        if (typeof idx === "number" && Number.isInteger(idx)) {
          const chosen = images[idx] ?? null;
          console.log(
            `[content-image] product reference auto-select: ${
              chosen ? `image ${idx}` : "none"
            } for post ${post.id}`,
          );
          return chosen;
        }
        return null;
      }
    } catch (err) {
      console.error(
        "[content-image] product reference selection failed, falling back:",
        err,
      );
    }
  }

  return fallbackReferenceMatch(postText, images);
}

/**
 * Keyword-overlap heuristic used when OpenAI is unavailable. Biased toward
 * "no reference" - a wrong product photo is worse than none.
 */
function fallbackReferenceMatch(
  postText: string,
  images: ProductImage[],
): ProductImage | null {
  const tokenize = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((tok) => tok.length >= 4),
    );
  const postTokens = tokenize(postText);
  let best: ProductImage | null = null;
  let bestScore = 0;
  for (const img of images) {
    let score = 0;
    for (const tok of tokenize(img.description)) {
      if (postTokens.has(tok)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = img;
    }
  }
  return bestScore >= 2 ? best : null;
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function mimeFromUrl(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "image/png";
}

/** Reads a selected product image into the shape runSlideGeneration expects. */
async function loadProductReference(
  img: ProductImage,
): Promise<ImageReference | undefined> {
  const key = keyFromUrl(img.url);
  const base64 = key ? await getObjectBase64(key) : null;
  if (!base64) return undefined;
  return {
    base64,
    mimeType: mimeFromUrl(img.url),
    description: img.description,
    kind: "product",
  };
}

async function loadUserReference(
  url: string,
): Promise<ImageReference | undefined> {
  const base64 = await readPublicImageAsBase64(url);
  if (!base64) return undefined;
  return {
    base64,
    mimeType: mimeFromUrl(url),
    description: "User-attached visual reference",
    kind: "user",
  };
}

function buildSlidePrompt(
  business: ImageGenBusiness,
  post: ImageGenPost,
  slide: SlidePlan,
  slideIndex: number,
  totalSlides: number,
  creativeDirection: CreativeDirection = selectCreativeDirection(
    `${post.id}:${post.caption}`,
  ),
): string {
  const aspect = POST_TYPE_ASPECT[post.postType];
  const direction = post.pillar
    ? PILLAR_DIRECTION[post.pillar]
    : PILLAR_DIRECTION.educate;
  const primary = business.brandColorPrimary || "#111111";
  const secondary = business.brandColorSecondary || "#f5f5f7";
  const font = business.brandFonts?.[0] || "SF Pro Display";
  const brandName = business.name || "the brand";
  const brandVoice = business.persona || business.brandStyle || "";
  const category = business.category || business.field || "";
  const audience =
    business.clientPersona || "the brand's most likely Instagram customer";
  const offering =
    business.services || business.description || category || "the offering";
  const captionContext = post.caption.replace(/\s+/g, " ").trim().slice(0, 1000);

  const roleLine =
    slide.role === "cover"
      ? `This is the COVER slide (slide 1 of ${totalSlides}). It has to stop the scroll with confidence, not volume: one subject, one line of type, and space around both.`
      : slide.role === "cta"
        ? `This is the final CTA slide (slide ${slideIndex + 1} of ${totalSlides}). Quieter than the cover. The headline is a plain, direct invitation.`
        : `This is body slide ${slideIndex + 1} of ${totalSlides}. Same medium, backdrop, light, palette, and type system as the cover, with a fresh composition that matches this slide's idea.`;

  const sceneLine = slide.sceneNote
    ? `\nSCENE FOR THIS SLIDE: ${slide.sceneNote}`
    : "";

  const visualLine = post.visualIdea
    ? `\nCAMPAIGN NOTE (applies to every slide): ${post.visualIdea}`
    : "";

  const variationHint =
    post.postType === "carousel" && totalSlides > 1
      ? carouselVariationForIndex(slideIndex, totalSlides)
      : null;

  return `You are a senior Instagram creative director who trained in Apple's marketing studio. Your work is defined by restraint: one subject, one idea, one line of type, and generous empty space. Create a premium organic Instagram asset for ${brandName}${category ? ` (${category})` : ""} that looks like it belongs on a product-launch page, not in a template library.

Deliver ONE ${aspect} image for an Instagram ${post.postType}. It must read in under 1.5 seconds on a phone, feel calm and expensive, and make the viewer trust the brand before they read a word of the caption.

${roleLine}

== DESIGN PHILOSOPHY (Apple-style) ==
- Restraint over decoration. If an element does not carry the idea, remove it.
- One hero subject, rendered with obsessive material realism, sitting in abundant negative space. The subject usually occupies a third of the frame or less.
- Backgrounds are simple: pure white, pure black, a seamless studio sweep, one soft gradient, or a single flat brand color. Never a busy scene behind the subject.
- Light is soft, controlled, and flattering, with one crisp specular edge and a faint contact shadow. No dramatic haze, lens flare, or grain.
- Typography is quiet and exact: a clean geometric sans-serif, tight letter-spacing, medium or semibold weight, sentence case, aligned to a real margin or to the subject. One line if possible, two at most.
- Color is mostly neutral. The brand color appears once, deliberately, as the subject, the backdrop, or a single accent, never as a gradient wash across everything.
- Composition is precise: exact centering or clear asymmetry on a grid. Nothing floats without a reason.

== INSTAGRAM STRATEGY ==
Target audience: ${audience}

Business offering: ${offering}

Caption context (strategy only, do not render this paragraph as text):
"${captionContext}"

${post.callToAction ? `Desired action after viewing: ${post.callToAction}` : "Desired action after viewing: understand the idea and want to read the caption."}

Feed rules:
- First glance reveals one hook, one focal subject, and one payoff. No competing details.
- Compose for a phone screen. Nothing essential is small.
- Keep the headline and the subject's defining edges inside a 7% safe margin on every side.
- Earn attention with stillness, scale, and contrast, not with badges, stickers, arrows, or engagement-bait decoration.
- The image creates curiosity for the caption. It never tries to say everything.

== CREATIVE DIRECTION: ${creativeDirection.id} ==
Name: ${creativeDirection.name}

Medium: ${creativeDirection.medium}

Composition: ${creativeDirection.composition}

Light and texture: ${creativeDirection.lightAndTexture}

Typography approach: ${creativeDirection.typography}

Commit fully to this direction. Other posts in the calendar deliberately receive other directions, so do not average them out into a generic look.

== THE HEADLINE ==
Render this exact headline in the image, letter for letter, with zero spelling errors and no added punctuation:
"${slide.headline}"
${sceneLine}

== CONTENT INTENT - ${post.pillar?.toUpperCase() ?? "EDITORIAL"} ==
Intent: ${direction.intent}

Subject priority: ${direction.subjectPriority}

Typography treatment: ${direction.typography}

== BRAND SYSTEM ==
Palette:
- Primary: ${primary}. Use it once and deliberately (the subject, the backdrop, or one accent).
- Secondary: ${secondary}. Supporting neutral or a single small contrast.
- Everything else stays neutral: white, black, warm grey, or the natural color of real materials.

Headline typeface: in the spirit of "${font}", or a comparable clean geometric sans-serif such as SF Pro, Inter, or Helvetica Neue. One family, one weight (two at most), tight tracking. The type must feel set by a typographer, never pasted on.

${brandVoice ? `Brand voice: ${brandVoice}\n` : ""}${visualLine}${variationHint ? `\n\n== THIS SLIDE'S VARIATION ==\n${variationHint}` : ""}

== CAROUSEL COHESION (when this is a carousel slide) ==
This is slide ${slideIndex + 1} of ${totalSlides}. Keep the medium, backdrop, light, palette, and type system identical across the carousel so it reads as one product shoot. Vary only scale, crop, and subject placement so swiping feels authored.

== QUALITY RUBRIC - grade yourself honestly ==
- Could this frame sit on an Apple product page without looking out of place?
- Is there exactly one subject and exactly one line of type, with real empty space around both?
- Is the post understandable at feed size in under 1.5 seconds?
- Does it look made for this brand, audience, and caption rather than for any business?
- Is the chosen creative direction immediately recognizable?
- Do materials, edges, and shadows look physically real and premium?
- Is the headline crisp, correctly spelled, tightly tracked, and aligned to something?
- Is everything essential inside the safe margin?
- Would a designer with taste remove anything? If yes, remove it now.

== HARD DON'TS ==
- No watermarks, invented third-party logos, Instagram UI mockups, borders, frames, slide numbers, or badges. Faithfully preserve a real brand mark that is intrinsic to an attached product reference.
- No invented text besides the headline. Text, numbers, labels, grids, and interface details intrinsic to an attached reference must remain recognizable. No fake body copy, prices, or signatures.
- No stock-photo clichés, dashboard cards, muddy gradients, decorative blobs, sparkles, emoji art, confetti, or unrelated props.
- No busy environments, no cluttered tabletops, no multiple competing subjects.
- No misspellings. Render the headline letter for letter as given.
- No recognizable real celebrities. People appear as hands, torso, side profile, or from behind only.
- No em dashes in visible text.

Final check: does this look designed by Apple's studio for ${brandName}? If it looks like a template, a collage, or an illustration, strip it back until it does.`;
}

function carouselVariationForIndex(index: number, total: number): string {
  if (total <= 1) return "A single considered hero composition.";
  if (index === 0) {
    return "COVER - the most confident frame of the carousel. One unmistakable hero subject, the most space around it, and the type set largest. It establishes the backdrop, light, and type system every following slide inherits.";
  }
  if (index === total - 1) {
    return "FINAL SLIDE - the quietest frame. A small detail or a reduced-scale subject with the most empty space of the set, so the headline lands like a considered close.";
  }
  const patterns = [
    "A macro detail: move in close on one edge, surface, or feature until material and finish become the composition.",
    "A top-down flat lay of the subject alone on the backdrop, aligned to one clean axis with even spacing.",
    "A wider frame with the subject small and off-center, leaving most of the canvas empty on one side for the headline.",
    "The subject in a single human gesture: one hand holding, placing, or touching it, cropped tight and calm.",
    "A precise three-quarter angle of the subject, exactly centered, with the type set beneath or above on the same axis.",
    "A silhouette or edge-lit profile that reduces the subject to one clean shape against the backdrop.",
  ];
  const choice = patterns[(index - 1) % patterns.length];
  return `Vary the composition from the previous slide. This slide: ${choice} Keep the medium, backdrop, palette, light, and typography identical to the cover.`;
}

/**
 * Upload a generated slide image (PNG buffer) to S3 and return its public URL.
 */
async function writeImageToPublic(
  postId: string,
  slideIndex: number,
  bytes: Buffer,
): Promise<string> {
  const key = buildKey("content-slide", { postId, slideIndex, ext: "png" });
  return putObject({ key, body: bytes, contentType: "image/png" });
}

/**
 * Best-effort cleanup of an old slide image. Deletes from S3 if the URL is one
 * we manage; falls back to unlinking legacy filesystem images. Silently ignores
 * missing objects/files.
 */
export async function removePublicImage(url: string): Promise<void> {
  if (isManagedUrl(url)) {
    const key = keyFromUrl(url);
    if (key) await deleteObject(key);
    return;
  }
  // Legacy: image stored under public/generated/content-images before S3.
  if (!url.startsWith(LEGACY_PREFIX)) return;
  try {
    const relativePath = url.replace(/^\/+/, "");
    await unlink(join(process.cwd(), "public", relativePath));
  } catch {
    // file already gone or permission issue; not worth blocking the flow
  }
}

/**
 * Reads a slide image back into a base64 string so it can be passed to the
 * Images API edit endpoint. Handles both S3-stored and legacy filesystem images. Returns null
 * if the image cannot be read.
 */
async function readPublicImageAsBase64(url: string): Promise<string | null> {
  if (isManagedUrl(url)) {
    const key = keyFromUrl(url);
    return key ? getObjectBase64(key) : null;
  }
  // Legacy filesystem image.
  if (!url.startsWith(LEGACY_PREFIX)) return null;
  try {
    const relativePath = url.replace(/^\/+/, "");
    const buffer = await readFile(join(process.cwd(), "public", relativePath));
    return buffer.toString("base64");
  } catch {
    return null;
  }
}

interface ImageReference {
  base64: string;
  mimeType: string;
  description: string;
  kind: "product" | "user";
}

interface RunSlideOptions {
  refinementPrompt?: string;
  baseImageUrl?: string;
  /** Whether an uploaded base should inspire a new composition instead of being edited in place. */
  baseImageRole?: "existing-slide" | "user-source";
  /** Product or user-supplied image to feature in the generated result. */
  reference?: ImageReference;
  creativeDirection?: CreativeDirection;
}

/**
 * Generates or edits a single slide with the OpenAI Images API.
 * - If baseImageUrl + refinementPrompt are provided and the file is readable,
 *   runs an image edit with the prior slide as the first input image.
 * - If a reference is provided, it is passed as an additional input image
 *   during both generation and refinement so the real product/source survives
 *   subsequent edits.
 * - Otherwise does a fresh text-to-image generation.
 * Tries up to 2 attempts before surfacing failure.
 */
async function runSlideGeneration(
  business: ImageGenBusiness,
  post: ImageGenPost,
  slide: SlidePlan,
  slideIndex: number,
  totalSlides: number,
  opts: RunSlideOptions = {},
): Promise<GeneratedSlide | null> {
  const openaiClient = getOpenAI();
  if (!openaiClient) return null;

  const basePrompt = buildSlidePrompt(
    business,
    post,
    slide,
    slideIndex,
    totalSlides,
    opts.creativeDirection,
  );

  const aspectRatio = POST_TYPE_ASPECT[post.postType];
  const size = POST_TYPE_SIZE[post.postType];
  const refinement =
    opts.refinementPrompt?.trim() ||
    (opts.reference?.kind === "user"
      ? "Create a new version that meaningfully incorporates the attached reference while preserving the post's message and brand system."
      : "");

  let inlineImageBase64: string | null = null;
  if (refinement && opts.baseImageUrl) {
    inlineImageBase64 = await readPublicImageAsBase64(opts.baseImageUrl);
  }

  const hasBaseImage = Boolean(refinement && inlineImageBase64);
  const userSourceMode =
    hasBaseImage && opts.baseImageRole === "user-source";
  const editMode = hasBaseImage && !userSourceMode;
  const reference = opts.reference;

  // The output size is enforced via the `size` parameter, but the prompt
  // restates it so the model composes for that canvas from the start.
  const aspectLine = `\n\n== FRAME ==\nThe canvas is exactly ${aspectRatio} (width:height). Compose for that canvas. Do not letterbox, pad, or crop text.`;

  const referenceLine = reference
    ? `\n\n== ${reference.kind === "product" ? "PRODUCT" : "USER"} REFERENCE IMAGE (attached) ==
The ${hasBaseImage ? "SECOND attached" : "attached"} reference shows ${
        reference.kind === "product"
          ? `${business.name || "the brand"}'s actual product${reference.description.trim() ? `: "${reference.description.trim()}"` : ""}`
          : "the exact visual asset the user wants featured"
      }.
- Make the attached image the hero of the composition. It must be a prominent, intentional part of the scene, not merely a source of inspiration.
- Treat the attached image as an immutable finished asset. Do not redesign, redraw, regenerate, rewrite, crop, blur, recolor, relabel, simplify, or replace it.
- Preserve the complete attached image: exact text, spelling, numbers, grid cells, markings, logo, colors, proportions, borders, and layout.
- Build the backdrop, lighting, shadows, and headline around the unchanged asset so it looks photographed in a real studio.
- If perspective or scale is needed to integrate it, keep the entire asset visible and fully legible. Do not cover it with the headline, hands, props, glare, or effects.
- For bingo cards, worksheets, packaging, screenshots, menus, flyers, and other text-heavy artwork, fidelity is the highest priority. The final viewer must recognize the attached image as the same original asset, unchanged.`
    : "";
  const freshInstructionLine =
    refinement && !hasBaseImage
      ? `\n\n== USER REQUEST FOR THIS NEW VERSION ==\n"${refinement}"`
      : "";

  const generationPrompt = editMode
    ? `${basePrompt}${aspectLine}${referenceLine}

== USER REFINEMENT ON THE PROVIDED IMAGE ==
A prior version of this slide is the FIRST attached image. Apply this change while preserving everything the user did not ask to change (message, palette, typography, and subject identity):
"${refinement}"

${reference ? "Keep the attached reference unchanged while blending it naturally into the refined composition. Do not create a second copy or alter any of its content." : ""}
Deliver the refined image at the same aspect and quality.`
    : userSourceMode
      ? `${basePrompt}${aspectLine}

== USER-UPLOADED SOURCE IMAGE ==
The FIRST attached image is a source asset, not a finished slide to retouch. Create a brand-new composition in the selected creative direction and visibly feature the exact subject from that source.
- Preserve its recognizable layout, grid, markings, colors, labels, proportions, and interface details.
- For a bingo or game card, keep the card recognizable and show it being held, played, marked, printed, displayed, or otherwise used naturally.
- Do not merely return the uploaded image with a filter or headline added.

User instruction: "${refinement}"
${referenceLine}`
      : `${basePrompt}${aspectLine}${referenceLine}${freshInstructionLine}`;

  // Input images for the edit endpoint, in the order the prompt refers to
  // them: prior slide first (when refining), then the product/user reference.
  const inputImages: Array<{ base64: string; mimeType: string; name: string }> =
    [];
  if (hasBaseImage) {
    inputImages.push({
      base64: inlineImageBase64!,
      mimeType: mimeFromUrl(opts.baseImageUrl!),
      name: "previous-slide",
    });
  }
  if (reference) {
    inputImages.push({
      base64: reference.base64,
      mimeType: reference.mimeType,
      name: `${reference.kind}-reference`,
    });
  }
  const inputFiles = await Promise.all(
    inputImages.map((img) =>
      toFile(
        Buffer.from(img.base64, "base64"),
        `${img.name}.${img.mimeType.split("/")[1] ?? "png"}`,
        { type: img.mimeType },
      ),
    ),
  );

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response =
        inputFiles.length > 0
          ? await openaiClient.images.edit({
              model: OPENAI_IMAGE_MODEL,
              image: inputFiles,
              prompt: generationPrompt,
              size,
              quality: "high",
              output_format: "png",
            })
          : await openaiClient.images.generate({
              model: OPENAI_IMAGE_MODEL,
              prompt: generationPrompt,
              size,
              quality: "high",
              output_format: "png",
            });

      const b64 = response.data?.[0]?.b64_json;
      if (b64) {
        const buffer = Buffer.from(b64, "base64");
        const url = await writeImageToPublic(post.id, slideIndex, buffer);
        return { url, headline: slide.headline, prompt: generationPrompt };
      }
      console.error(
        `[content-image] slide ${slideIndex}: model "${OPENAI_IMAGE_MODEL}" returned no image data.`,
      );
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // A wrong or not-yet-available model id fails identically on retry.
      if (
        /model/i.test(message) &&
        /does not exist|not found|unsupported|invalid/i.test(message)
      ) {
        console.error(
          `[content-image] slide ${slideIndex}: model "${OPENAI_IMAGE_MODEL}" was rejected. Check OPENAI_IMAGE_MODEL.`,
          err,
        );
        return null;
      }
      console.error(
        `[content-image] slide ${slideIndex} attempt ${attempt} failed:`,
        err,
      );
    }
  }
  return null;
}

/**
 * Plans slides for a post (carousel = N, single/reel = 1) and generates each
 * one, with automatic cleanup of any previous images on disk.
 *
 * Returns both successes and failures so the caller can surface warnings.
 */
export async function generatePostImages(
  business: ImageGenBusiness,
  post: ImageGenPost,
  previousImages: { url: string; prompt?: string }[] | null = null,
  options: GeneratePostImagesOptions = {},
): Promise<GeneratePostImagesResult> {
  let slides: SlidePlan[];
  if (post.postType === "carousel") {
    slides = await planCarouselSlides(
      post.caption,
      post.pillar,
      business.language,
    );
  } else {
    slides = [{ headline: extractHook(post.caption), role: "cover" }];
  }

  const total = slides.length;
  await options.beforeGenerate?.(total);

  // Resolved AFTER the plan gate above so blocked users never trigger the
  // OpenAI selection call. Policy: the product reference applies to the cover
  // slide only - body slides inherit the visual language via carousel
  // cohesion, and repeating the same product photo makes carousels monotonous.
  const explicitReference = options.referenceImageUrl
    ? await loadUserReference(options.referenceImageUrl)
    : undefined;
  if (options.referenceImageUrl && !explicitReference) {
    throw new Error("Could not read the uploaded generation reference");
  }
  const selectedProduct = explicitReference
    ? null
    : await selectProductReferenceImage(business, post);
  const imageReference =
    explicitReference ??
    (selectedProduct ? await loadProductReference(selectedProduct) : undefined);
  const creativeDirection = selectCreativeDirection(
    `${post.id}:${post.caption}`,
    previousImages?.[0]?.prompt,
  );

  const generated = await Promise.all(
    slides.map((s, i) =>
      runSlideGeneration(business, post, s, i, total, {
        reference: s.role === "cover" ? imageReference : undefined,
        creativeDirection,
      }),
    ),
  );

  const successes: GeneratedSlide[] = [];
  const failures: SlideFailure[] = [];
  generated.forEach((result, i) => {
    if (result) successes.push(result);
    else failures.push({ index: i, reason: "Model returned no image" });
  });

  // Clean up old files from disk if we produced at least one new slide.
  if (successes.length > 0 && previousImages) {
    await Promise.all(previousImages.map((p) => removePublicImage(p.url)));
  }

  return { slides: successes, failures };
}

/**
 * Regenerate a single slide within an existing post. Supports refinement via
 * prompt + base image. Returns the new slide or null on failure.
 */
export async function regenerateSlide(
  business: ImageGenBusiness,
  post: ImageGenPost,
  slideIndex: number,
  totalSlides: number,
  opts: {
    refinementPrompt?: string;
    baseImageUrl?: string;
    baseImageRole?: "existing-slide" | "user-source";
    referenceImageUrl?: string;
    previousUrl?: string;
    previousPrompt?: string;
  },
): Promise<GeneratedSlide | null> {
  // If we know the slide plan from the post's caption, rebuild just that slide.
  let slides: SlidePlan[];
  if (post.postType === "carousel") {
    slides = await planCarouselSlides(
      post.caption,
      post.pillar,
      business.language,
    );
  } else {
    slides = [{ headline: extractHook(post.caption), role: "cover" }];
  }
  const slide = slides[slideIndex] ?? slides[0];

  // An explicit per-refinement upload wins. Otherwise keep the configured
  // product reference attached to cover-slide refinements as well as fresh runs.
  let imageReference = opts.referenceImageUrl
    ? await loadUserReference(opts.referenceImageUrl)
    : undefined;
  if (!imageReference && slide.role === "cover") {
    const selectedProduct = await selectProductReferenceImage(business, post);
    if (selectedProduct) {
      imageReference = await loadProductReference(selectedProduct);
    }
  }

  const preserveDirection = Boolean(
    opts.refinementPrompt?.trim() || opts.referenceImageUrl,
  );
  const creativeDirection = selectCreativeDirection(
    `${post.id}:${post.caption}:${slideIndex}`,
    opts.previousPrompt,
    preserveDirection,
  );

  const result = await runSlideGeneration(
    business,
    post,
    slide,
    slideIndex,
    Math.max(totalSlides, slides.length),
    {
      refinementPrompt: opts.refinementPrompt,
      baseImageUrl: opts.baseImageUrl,
      baseImageRole: opts.baseImageRole,
      reference: imageReference,
      creativeDirection,
    },
  );

  if (result && opts.previousUrl) {
    await removePublicImage(opts.previousUrl);
  }
  return result;
}

export { planCarouselSlides, buildSlidePrompt };
