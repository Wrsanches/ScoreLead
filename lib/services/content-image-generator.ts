import { GoogleGenAI, Modality } from "@google/genai";
import OpenAI from "openai";
import { unlink, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ContentPillar, ContentPostType } from "@/lib/content-pillars";
import type { ProductImage, ReferenceImagePref } from "@/lib/product-images";
import {
  GEMINI_IMAGE_MODEL,
  OPENAI_TEXT_MODEL,
} from "@/lib/models";
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

let genai: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genai) genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return genai;
}

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
      "Clear editorial headline with disciplined alignment and strong contrast. The visual teaches; the type names the idea.",
  },
  showcase: {
    intent:
      "Make the real product, service artifact, or result unmistakably desirable. The featured subject is specific to this business, never a generic category substitute.",
    subjectPriority:
      "Give the product a decisive hero moment. Preserve recognizable details and use scale, framing, or context to make its value felt.",
    typography:
      "Confident display headline integrated into the composition without covering the product's defining details.",
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
      "Use energetic display type with one emphasized word or phrase, while keeping the exact headline readable at feed size.",
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
    id: "studio-sculptural",
    name: "Sculptural studio campaign",
    medium:
      "High-end real product photography with a deliberately built physical set, real materials, optical depth, and controlled studio light.",
    composition:
      "One hero subject, bold scale contrast, crisp silhouette, and generous but intentional negative space. Avoid the habitual centered object-on-gradient layout.",
    lightAndTexture:
      "Directional key light, tactile surfaces, convincing contact shadows, restrained highlights, and rich tonal separation.",
    typography:
      "Precise modern display type aligned to the subject or a visible grid. One family and no more than two weights.",
  },
  {
    id: "documentary-editorial",
    name: "Lived-in editorial documentary",
    medium:
      "Naturalistic editorial photography that feels observed rather than staged: a real place, human gesture, and useful environmental detail.",
    composition:
      "Layer foreground, subject, and environment. Use an off-center decisive moment, frame-within-a-frame, or close human point of view.",
    lightAndTexture:
      "Available window light or practical light, subtle film grain, honest material texture, and natural color variation.",
    typography:
      "Quiet editorial type placed like a photo-essay title, with generous margins and minimal interference with the scene.",
  },
  {
    id: "tactile-collage",
    name: "Tactile cut-paper collage",
    medium:
      "A sophisticated physical paper collage photographed from above: cut edges, layered card stock, printed fragments, tape, ink, and real cast shadows. Handcrafted, not clip-art.",
    composition:
      "Build an asymmetric arrangement with clear depth between layers and one unmistakable focal asset. Use cropping and overlap to create rhythm.",
    lightAndTexture:
      "Soft raking light reveals paper fibers, folds, embossing, and small imperfections. The result should feel physically assembled and then photographed.",
    typography:
      "Headline can be typeset cleanly or constructed from one consistent printed treatment; never ransom-note lettering or a generic scrapbook font.",
  },
  {
    id: "graphic-poster",
    name: "Bold modernist poster",
    medium:
      "A custom-designed editorial poster combining confident typography, geometric color fields, and a faithful cutout or depiction of the core subject. Designed, not templated.",
    composition:
      "Use decisive asymmetry, unusual scale, hard cropping, and one strong visual axis. Let the subject break the grid once for tension.",
    lightAndTexture:
      "Mostly graphic color with a controlled printed texture, subtle halftone, or one photographic material detail. Avoid glossy gradients and floating UI-card decoration.",
    typography:
      "Typography is the compositional engine: large, tightly spaced, and deliberately aligned. Preserve the exact headline and keep all other copy out.",
  },
  {
    id: "cinematic-narrative",
    name: "Cinematic narrative frame",
    medium:
      "A cinematic still from an implied story, photographed with realistic locations, motivated light, atmospheric depth, and a specific moment of action.",
    composition:
      "Use a low, close, over-the-shoulder, or wide establishing viewpoint. Build visual tension through foreground occlusion, leading lines, or motion just entering the frame.",
    lightAndTexture:
      "Motivated light, deep but readable shadows, restrained halation, nuanced color grade, and realistic lens behavior.",
    typography:
      "Treat the headline like a film title card integrated into available negative space, never as a social-media sticker.",
  },
  {
    id: "playful-practical-set",
    name: "Playful practical set",
    medium:
      "A witty, surreal scene built from real props, miniatures, painted surfaces, and practical effects, then photographed. Imaginative but materially believable.",
    composition:
      "Create one surprising relationship of scale or balance around the hero subject. Keep the scene simple enough that the joke reads instantly.",
    lightAndTexture:
      "Crisp stage or daylight-inspired lighting, real shadows, saturated physical color, and visible crafted materials rather than smooth CGI.",
    typography:
      "Bold, playful display type anchored to the set geometry, with disciplined spacing and no novelty-font clutter.",
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
- Keep each "sceneNote" to one sentence describing what the slide's photograph should show (a concrete real-world object/scene relevant to the headline, shot as editorial photography).
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
        temperature: 0.5,
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
 * Gemini reference for this post's image. Honors the post's explicit pref
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
        temperature: 0,
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
  const secondary = business.brandColorSecondary || "#f5f5f5";
  const font = business.brandFonts?.[0] || "a modern geometric sans-serif";
  const brandName = business.name || "the brand";
  const brandVoice = business.persona || business.brandStyle || "";
  const category = business.category || business.field || "";
  const audience =
    business.clientPersona || "the brand's most likely Instagram customer";
  const offering =
    business.services || business.description || category || "the offering";
  const captionContext = post.caption.replace(/\s+/g, " ").trim().slice(0, 1400);

  const roleLine =
    slide.role === "cover"
      ? `This is the COVER slide (slide 1 of ${totalSlides}). It must stop the scroll in a feed. The headline is the hero - OVERSIZE it.`
      : slide.role === "cta"
        ? `This is the final CTA slide (slide ${slideIndex + 1} of ${totalSlides}). Calmer composition - the headline is a direct invitation.`
        : `This is body slide ${slideIndex + 1} of ${totalSlides}. Keep the visual language consistent with the cover - same medium, texture, brand palette, and type system - but use a fresh composition that matches this slide's idea.`;

  const sceneLine = slide.sceneNote
    ? `\nSCENE FOR THIS SLIDE: ${slide.sceneNote}`
    : "";

  const visualLine = post.visualIdea
    ? `\nOVERALL CAMPAIGN NOTE (applies to every slide): ${post.visualIdea}`
    : "";

  const variationHint =
    post.postType === "carousel" && totalSlides > 1
      ? carouselVariationForIndex(slideIndex, totalSlides)
      : null;

  return `You are a senior Instagram creative director, social-first art director, and conversion-aware designer. You specialize in thumb-stopping organic Instagram posts that communicate in under 1.5 seconds on a phone screen. Create a distinctive campaign asset for ${brandName}${category ? ` (${category})` : ""}, not a generic AI illustration or reusable Canva-style template.

Deliver ONE ${aspect} image for an Instagram ${post.postType}. It must feel native to a high-quality brand feed, remain legible at mobile-feed size, and earn attention without looking like a loud display ad.

${roleLine}

== INSTAGRAM STRATEGY ==
Target audience: ${audience}

Business offering: ${offering}

Caption context (strategy only, do not render this paragraph as text):
"${captionContext}"

${post.callToAction ? `Desired action after viewing: ${post.callToAction}` : "Desired action after viewing: understand the idea and want to read the caption."}

Social-first rules:
- The first glance must reveal one hook, one focal subject, and one emotional or practical payoff.
- Compose for a phone screen. Avoid tiny details that only work when zoomed in.
- Keep essential headline letters and product identity inside a 7% safe margin on every edge.
- Use visual tension, crop, scale, gesture, or contrast to stop the scroll. Do not use clickbait badges or engagement-bait decoration.
- Let the image create curiosity for the caption rather than trying to place the whole caption inside the artwork.

== CREATIVE DIRECTION: ${creativeDirection.id} ==
Name: ${creativeDirection.name}

Medium: ${creativeDirection.medium}

Composition: ${creativeDirection.composition}

Light and texture: ${creativeDirection.lightAndTexture}

Typography approach: ${creativeDirection.typography}

Commit fully to this direction. Do not drift back to the default AI look of a centered object on a smooth gradient. Other posts in the calendar deliberately receive other media and visual languages.

== THE HEADLINE ==
Render this exact headline in the final image - perfectly typeset, crisp, and with zero spelling errors:
"${slide.headline}"
${sceneLine}

== CONTENT INTENT - ${post.pillar?.toUpperCase() ?? "EDITORIAL"} ==
Intent: ${direction.intent}

Subject priority: ${direction.subjectPriority}

Typography treatment: ${direction.typography}

== BRAND SYSTEM ==
Palette:
- Primary: ${primary} - use as the dominant brand cue in a way native to the chosen medium.
- Secondary: ${secondary} - use as a supporting accent or contrast.

Typeface for the headline: inspired by "${font}" if it fits the mood. Otherwise use a contemporary editorial face. One family only and two weights maximum. Typography must feel composed with the subject, never dropped on afterward.

${brandVoice ? `Brand voice: ${brandVoice}\n` : ""}${visualLine}${variationHint ? `\n\n== THIS SLIDE'S VARIATION ==\n${variationHint}` : ""}

== CAROUSEL COHESION (when this is a carousel slide) ==
This is slide ${slideIndex + 1} of ${totalSlides}. Keep the chosen medium, palette, texture, and type system consistent across the carousel. VARY scale, crop, subject placement, and visual rhythm so swiping feels authored rather than repetitive.

== QUALITY RUBRIC - grade yourself honestly ==
- Would this stop the intended audience during a fast Instagram scroll?
- Is the post understandable at feed size in under 1.5 seconds?
- Does it look authored specifically for this caption, audience, and offering?
- Does this feel specifically designed for this brand and post rather than generated from a reusable template?
- Is the chosen creative direction immediately visible and fully executed?
- Does the composition use space intentionally rather than defaulting to a centered hero?
- Is there a single clear focal point? No visual noise competing with the subject?
- Do materials and textures feel convincing for the chosen medium?
- Is the typography placed on a clear alignment (flush to an object edge, the frame, or a grid), not floating?
- Are all essential elements safely inside the mobile crop and interface zones?
- Does the frame feel composed by a human with taste, not generated by defaults?

== HARD DON'TS ==
- No watermarks, invented third-party logos, Instagram UI mockups, borders, frames, or slide numbers. Faithfully preserve a real brand mark that is intrinsic to an attached product reference.
- No invented text besides the headline. Text, numbers, labels, grids, and interface details intrinsic to an attached reference must remain recognizable. No fake body copy or signatures.
- No stock-photo clichés, generic dashboard cards, muddy gradients, decorative blob shapes, emoji art, or unrelated filler props.
- Do not repeat the familiar single-object studio composition unless the selected creative direction explicitly calls for it.
- No misspellings. Render the headline letter-for-letter as given.
- No recognizable real celebrities. Generic people from behind, side profile, or hands/torso only.
- No em dashes in visible text.

Final check: can a viewer identify the selected ${creativeDirection.name} direction without reading this prompt? If not, redesign until they can.`;
}

function carouselVariationForIndex(index: number, total: number): string {
  if (total <= 1) return "A single considered hero composition.";
  if (index === 0) {
    return "COVER - the boldest composition of the carousel. Establish one unmistakable focal subject and set the visual language the rest of the carousel inherits.";
  }
  if (index === total - 1) {
    return "FINAL SLIDE - a calmer, quieter composition. Use a small detail, reduced scale, or generous breathing room so the headline lands like a considered close.";
  }
  const patterns = [
    "A tight detail: magnify one material, symbol, or product feature until its texture becomes the composition.",
    "A top-down or flat-plane arrangement with deliberate spacing and a strong diagonal reading path.",
    "A wide contextual composition with foreground, subject, and background layers. Keep the hero smaller in frame.",
    "A dominant brand-color field interrupted by one sharply contrasting subject or gesture.",
    "A human interaction moment: a hand using, holding, marking, moving, or revealing the subject.",
    "A silhouette, cutout, or edge-defined profile that reduces the idea to one memorable shape.",
  ];
  const choice = patterns[(index - 1) % patterns.length];
  return `Vary the composition from the previous slide. This slide: ${choice} Keep the selected medium, palette, texture, and typography consistent with the cover.`;
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
 * Reads a slide image back into a base64 string so it can be fed into Gemini
 * edit mode. Handles both S3-stored and legacy filesystem images. Returns null
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
 * Generates or edits a single slide.
 * - If baseImageUrl + refinementPrompt are provided and the file is readable,
 *   runs Nano Banana in image-to-image mode.
 * - If a reference is provided, keeps it in context during both generation
 *   and refinement so the real product/source survives subsequent edits.
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
  const ai = getGenAI();
  if (!ai) return null;

  const basePrompt = buildSlidePrompt(
    business,
    post,
    slide,
    slideIndex,
    totalSlides,
    opts.creativeDirection,
  );

  const aspectRatio = POST_TYPE_ASPECT[post.postType];
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
  const referenceMode = Boolean(reference);

  // Mention the aspect ratio explicitly in the prompt so the model honors it
  // even when we can't pass `imageConfig.aspectRatio` (some Gemini variants
  // like flash-lite reject the config).
  const aspectLine = `\n\n== FRAME ==\nDeliver the image at an exact ${aspectRatio} aspect ratio (width:height). Do not letterbox, do not crop text, do not pad. The canvas itself is ${aspectRatio}.`

  const referenceLine = reference
    ? `\n\n== ${reference.kind === "product" ? "PRODUCT" : "USER"} REFERENCE IMAGE (attached) ==
The ${hasBaseImage ? "SECOND attached" : "attached"} reference shows ${
        reference.kind === "product"
          ? `${business.name || "the brand"}'s actual product${reference.description.trim() ? `: "${reference.description.trim()}"` : ""}`
          : "the exact visual asset the user wants featured"
      }.
- Blend the attached image naturally and visibly into the AI-generated Instagram composition. It must be a prominent, intentional part of the scene, not merely a source of inspiration.
- Treat the attached image as an immutable finished asset. Do not redesign, redraw, regenerate, rewrite, crop, blur, recolor, relabel, simplify, or replace it.
- Preserve the complete attached image: exact text, spelling, numbers, grid cells, markings, logo, colors, proportions, borders, and layout.
- Build the art direction, environment, lighting, shadows, props, human interaction, and headline around the unchanged asset so it feels naturally photographed or designed into the scene.
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
The FIRST attached image is a source asset, not a finished slide to retouch. Create a brand-new AI composition in the selected creative direction and visibly incorporate the exact subject from that source.
- Preserve its recognizable layout, grid, markings, colors, labels, proportions, and interface details.
- For a bingo or game card, keep the card recognizable and show it being held, played, marked, printed, displayed, layered into the design, or otherwise used naturally.
- Do not merely return the uploaded image with a filter or headline added.

User instruction: "${refinement}"
${referenceLine}`
      : `${basePrompt}${aspectLine}${referenceLine}${freshInstructionLine}`;

  const inputParts: Array<
    | { inlineData: { mimeType: string; data: string } }
    | { text: string }
  > = [];
  if (hasBaseImage) {
    inputParts.push({
      inlineData: {
        mimeType: mimeFromUrl(opts.baseImageUrl!),
        data: inlineImageBase64!,
      },
    });
  }
  if (referenceMode) {
    inputParts.push({
      inlineData: {
        mimeType: reference!.mimeType,
        data: reference!.base64,
      },
    });
  }
  inputParts.push({ text: generationPrompt });
  const contents = inputParts.length > 1 ? inputParts : generationPrompt;

  // All `*-image*` Gemini models accept imageConfig. Text-only models don't
  // and must be avoided at the source (see lib/models.ts). With any inline
  // image input (edit or reference mode) we drop imageConfig because it isn't
  // allowed alongside it - the == FRAME == prompt line covers aspect ratio.
  const supportsImageConfig = /image/.test(GEMINI_IMAGE_MODEL);
  let disableImageConfig =
    hasBaseImage || referenceMode || !supportsImageConfig;

  function buildConfig() {
    const base: Record<string, unknown> = {
      // TEXT+IMAGE lets the model "think out loud" about composition before
      // committing to the render - the art-direction prompt is long and the
      // extra reasoning channel keeps more of it in the final image.
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    };
    // `thinkingLevel` is a Flash-only knob; Pro image models have thinking
    // always on and don't accept this config.
    if (/flash-image/.test(GEMINI_IMAGE_MODEL)) {
      base.thinkingConfig = { thinkingLevel: "high" };
    }
    if (!disableImageConfig) {
      base.imageConfig = { aspectRatio, imageSize: "2K" };
    }
    return base;
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents,
        config: buildConfig(),
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      // With thinking enabled, the model may return interim "thought" images
      // before the final render. Prefer the last non-thought image; fall back
      // to any image if none have a `thought` flag.
      const imageParts = parts.filter(
        (p): p is { inlineData: { data: string; mimeType?: string }; thought?: boolean } =>
          Boolean(
            p.inlineData &&
              typeof p.inlineData.data === "string" &&
              p.inlineData.data.length > 0,
          ),
      );
      const finalImage =
        imageParts.filter((p) => !p.thought).pop() ?? imageParts.pop();
      if (finalImage) {
        const buffer = Buffer.from(finalImage.inlineData.data, "base64");
        const url = await writeImageToPublic(post.id, slideIndex, buffer);
        return { url, headline: slide.headline, prompt: generationPrompt };
      }
      // Response arrived but contains no image. Almost always means the
      // configured model isn't an image generator. Abort both attempts.
      const textOnlyParts = parts
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .filter(Boolean)
      console.error(
        `[content-image] slide ${slideIndex}: model "${GEMINI_IMAGE_MODEL}" returned no image data. Is this an image-generation model? Text body:`,
        textOnlyParts.join("\n").slice(0, 200) || "(empty)",
      )
      return null;
    } catch (err) {
      // If the model doesn't accept imageConfig (e.g. flash-lite variants),
      // retry without it. The aspect ratio lives in the prompt text as backup.
      const message = err instanceof Error ? err.message : String(err);
      const isConfigRejected =
        /aspect ratio is not enabled|image_?config|invalid_argument/i.test(
          message,
        );
      if (!disableImageConfig && isConfigRejected) {
        disableImageConfig = true;
        console.warn(
          `[content-image] model rejected imageConfig; retrying without it`,
        );
        // Don't burn the attempt counter on this retry - re-try same attempt.
        attempt--;
        continue;
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
