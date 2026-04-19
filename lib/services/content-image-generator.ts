import { GoogleGenAI, Modality } from "@google/genai";
import OpenAI from "openai";
import { writeFile, mkdir, unlink, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ContentPillar, ContentPostType } from "@/lib/content-pillars";
import {
  GEMINI_IMAGE_MODEL,
  OPENAI_TEXT_MODEL,
} from "@/lib/models";

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
  category: string | null;
  field: string | null;
  persona: string | null;
  brandStyle: string | null;
  brandColorPrimary: string | null;
  brandColorSecondary: string | null;
  brandFonts: string[] | null;
  language: string | null;
}

export interface ImageGenPost {
  id: string;
  postType: ContentPostType;
  pillar: ContentPillar | null;
  caption: string;
  visualIdea: string | null;
  callToAction: string | null;
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

interface PillarDirection {
  archetype: string;
  composition: string;
  lighting: string;
  typography: string;
}

const PILLAR_DIRECTION: Record<ContentPillar, PillarDirection> = {
  educate: {
    archetype:
      "Conceptual still-life photography in the spirit of Apple's product campaigns, Aesop's in-store photography, and Byredo's fragrance stills. Each idea is embodied by a SINGLE, carefully-chosen object (or a tight, intentional arrangement of 2-3 objects) staged like a museum piece. Objects feel chosen, not found. Sculpture-of-meaning over flat-lay.",
    composition:
      "Extreme negative space around a single hero subject - the subject is small-to-medium in the frame, surrounded by a wide field of color or texture that breathes. Unexpected angle: top-down god's-eye-view, perfect 3/4 at table height, or extreme macro with selective focus. Suspended, floating, or isolated on a color-blocked backdrop. Leave a clear silent zone for the headline type. One focal point, no clutter.",
    lighting:
      "Studio sculpture lighting - a soft key light from one side carves the subject, a gentle fill ensures shadows are rich not black, a subtle rim catches an edge. Think Peter Belanger (Apple), Scheltens & Abbenes, or Maurizio Di Iorio. Shot on Hasselblad X2D or Phase One, 80mm macro or 120mm. Rich controlled color, lifted blacks, faint digital noise. No synthetic HDR.",
    typography:
      "Swiss-editorial display headline OVERLAID on the photograph in the silent zone. Very tight kerning, medium-to-bold weight. One typeface. White or primary color, whichever has the highest contrast against its patch of background. Left-aligned, aligned to a visual grid. Restrained - the object does the talking.",
  },
  showcase: {
    archetype:
      "Apple keynote hero photography meets Jacquemus campaign color-blocking. A single subject shot with reverence. Cinematic, iconic, wallpaper-worthy. The kind of image that would be printed in a coffee-table book.",
    composition:
      "One hero subject isolated against a bold monochrome or gradient backdrop (often in the brand's primary color). Extreme negative space, hero occupies 25-40% of frame. Unexpected angle: hero viewed from below (low-hero), from directly above, or floating in a seamless color field. Real shadow anchors it to reality. Shallow depth of field with real optical bokeh. Could be a single object, a plated dish, a pair of hands holding something, a tool of the trade.",
    lighting:
      "Cinematic three-point studio light with dramatic falloff - the subject is carved out of darkness by a single key light with a soft fill. Real specular highlights on any reflective surface. Shot on Hasselblad X2D or Phase One IQ4, 80-120mm. Color graded like a Bottega Veneta or Prada campaign: saturated but sophisticated, rich shadows, a single accent of secondary color.",
    typography:
      "Massive wordmark-scale headline, anchored in the negative space. Letter spacing tight. One typeface, one weight. The type feels typeset by Pentagram or Mother Design - not placed, composed.",
  },
  story: {
    archetype:
      "Documentary-art photography in the spirit of Ryan McGinley, Alec Soth, Stephen Shore, or The New Yorker's 'Goings On About Town' photo essays. Real moments with the eye of an artist. Kinfolk and Cereal at the editorial layer, with more intention and edge - not just 'pretty morning light'.",
    composition:
      "A decisive moment captured with craft - hands at work mid-gesture, the negative space of a workshop, a side-profile silhouette framed against a window, an arrangement of tools that tells a story of the day. 35mm or 50mm at waist height or over the shoulder. Rule of thirds broken intentionally. Sometimes a second 'frame within the frame' via a doorway, mirror, or reflection.",
    lighting:
      "Real natural light - morning window light, golden hour, or tungsten practicals in the scene. Visible halation on highlights, lifted blacks, dense shadows. Shot on Portra 400 or Cinestill 800T with real grain. Warm to neutral grade, never oversaturated.",
    typography:
      "A quiet headline placed with restraint - bottom-left, lowercase, almost like a caption in a photo-book. Small relative to the frame. The type acknowledges the photograph is the art.",
  },
  proof: {
    archetype:
      "Editorial portrait-photography with pull-quote, like a Monocle magazine profile, a Vogue Business feature, or a Bloomberg Businessweek cover. The quote is a sculpture of type OVER a considered photograph - a workshop detail, a product in use, hands holding something meaningful. NOT a UI card, NOT a gradient, NOT a template.",
    composition:
      "A crafted environmental photograph that gives the quote a stage. Could be a blurred workshop in the primary color, a detail of the service being delivered, or a portrait from behind/in silhouette. The quote is carved into the image at a carefully-chosen quadrant with generous margin. Rule of thirds, strong horizon or leading line. Optional: a small, elegant star or mark glyph.",
    lighting:
      "Soft editorial portrait lighting. Slightly desaturated in the photograph zone so the typography reads clearly. Real depth of field, real bokeh, real fabric/material texture.",
    typography:
      "The quote rendered like a magazine pull-quote: italic serif (think Tiempos, Canela, or Romana) or a confident geometric sans (Söhne, General Sans), 40-64px, tight leading, hanging quotation mark. Below it, in small caps and 1/4 the size, optionally 'a client' or a generic attribution. One typeface family across both.",
  },
  engagement: {
    archetype:
      "Surreal-kinetic fashion/art photography in the spirit of Jacquemus, Bottega Veneta, Loewe, or a Tim Walker fashion editorial. A real photograph that feels like a painting - bold color, unexpected subject, a sense of motion or suspended impossibility. OR decisive-moment sport photography like Walter Iooss Jr. for Nike.",
    composition:
      "A visually-surprising composition: a splash frozen in air, a subject caught mid-leap, objects arranged in an impossibly balanced way, a hand breaking into the frame from an edge, or a color-blocked scene with one pop of contrasting element. Asymmetric crop with strong diagonal or radial energy.",
    lighting:
      "Vibrant but disciplined. High-chroma natural light, stage lighting, or studio strobe freezing a moment. The brand colors appear as real environmental elements (paint, fabric, liquid, light temperature, wardrobe) - never a flat overlay. Rich shadows keep it cinematic.",
    typography:
      "Oversize headline overlaid on the photograph. Mixed weights to emphasize one key word. Can break onto multiple lines. Type layers confidently over the moving scene.",
  },
};

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

function buildSlidePrompt(
  business: ImageGenBusiness,
  post: ImageGenPost,
  slide: SlidePlan,
  slideIndex: number,
  totalSlides: number,
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

  const roleLine =
    slide.role === "cover"
      ? `This is the COVER slide (slide 1 of ${totalSlides}). It must stop the scroll in a feed. The headline is the hero - OVERSIZE it.`
      : slide.role === "cta"
        ? `This is the final CTA slide (slide ${slideIndex + 1} of ${totalSlides}). Calmer composition - the headline is a direct invitation.`
        : `This is body slide ${slideIndex + 1} of ${totalSlides}. Keep the visual language consistent with the cover - same photographer, same grade, same brand palette - but with a fresh scene that matches this slide's idea.`;

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

  return `You are the art director and lead photographer on an Apple-caliber campaign for ${brandName}${category ? ` (${category})` : ""}. Deliver ONE ${aspect} image for an Instagram ${post.postType} that is a PHOTOGRAPH - not an illustration, not a cartoon, not a 3D render, not vector art, not a graphic design. A real photograph with real light on real objects, with the headline typeset on top.

${roleLine}

== ART DIRECTION PHILOSOPHY ==
This image must feel ARTFUL, not informational. Intentional, not reported. Measured against these brands - if it wouldn't fit in one of their feeds or campaigns, it is not good enough:

Apple (product photography: floating objects, single key light, extreme negative space), Aesop (still-life restraint, natural materials, earth tones), Byredo / Le Labo (editorial perfume stills, muted color blocking), Jacquemus (saturated color, surreal miniaturism, intentional wit), Bottega Veneta (color-blocked hero objects, high craft), Loewe (nature + object surrealism), Hermès (window-display whimsy, crafted storytelling), Kinfolk / Cereal (quiet editorial photography), Nike (decisive action moments). Typography direction from Pentagram, Mother Design, Base Design - every type choice feels designed, never dropped.

CORE TECHNIQUES - use at least two deliberately:
- Extreme negative space around one small-to-medium hero subject.
- One strong key light that sculpts the subject. Rich shadows - never flat lighting.
- Unexpected angle: top-down god's-eye, extreme low-hero, macro detail, or a flat-on color-blocked hero.
- Color-blocked backdrop in the brand primary, with the subject as the only focal contrast.
- Real shadow anchors - objects sit in space, not float randomly.
- Tension between soft and hard (soft fabric vs hard ceramic, wet vs dry, warm light vs cool metal).

== THE OUTPUT MUST BE PHOTOREALISTIC ==
The base image is a photograph captured on a real camera with real light. Any art direction below is executed AS A PHOTOGRAPH. If any element would be rendered as illustration, cartoon, vector, 3D CGI, or flat graphic - reinterpret it as a real object photographed in a real environment. The only non-photographic element permitted is the headline type overlaid on the finished photograph.

== THE HEADLINE ==
Overlay this exact headline on the photograph - perfectly typeset, crisp anti-aliased type, zero spelling errors:
"${slide.headline}"
${sceneLine}

== VISUAL STYLE - ${post.pillar?.toUpperCase() ?? "EDITORIAL"} ==
Archetype: ${direction.archetype}

Composition: ${direction.composition}

Lighting & grade: ${direction.lighting}

Typography treatment: ${direction.typography}

== BRAND SYSTEM ==
Palette (use these EXACT hex values - do not invent colors):
- Primary: ${primary} - the dominant hue. Show it as real environmental color (painted backdrop, fabric, ceramic, liquid, material, light temperature, wardrobe) or as the headline type color, NOT as a flat graphic overlay. ~50-70% of the visual weight.
- Secondary: ${secondary} - accent color in a real prop, highlight, or type.

Typeface for the overlaid headline: inspired by "${font}" if it fits the mood. Otherwise default to a contemporary editorial typeface (Söhne, General Sans, Canela, Tiempos, Inter Display). One typeface only. Two weights maximum. Typography placed on a visible grid - aligned to the subject or the frame edge, never floating arbitrarily.

${brandVoice ? `Brand voice: ${brandVoice}\n` : ""}${visualLine}${variationHint ? `\n\n== THIS SLIDE'S VARIATION ==\n${variationHint}` : ""}

== CAROUSEL COHESION (when this is a carousel slide) ==
This is slide ${slideIndex + 1} of ${totalSlides}. Keep the visual LANGUAGE consistent with the rest of the carousel: same camera body/feel, same color grade, same palette, same typeface/weight, same photographic restraint. But VARY the composition and angle from slide to slide (one wide, one macro, one top-down, one silhouette) so swiping feels like turning pages in a beautiful lookbook, not scrolling through variations of the same shot.

== QUALITY RUBRIC - grade yourself honestly ==
- Would this photograph be printed in a brand's annual report or art book? (If no, reshoot.)
- Does the composition use real negative space, not accidental empty area?
- Is the light doing work - carving form, telling time of day, creating mood?
- Is there a single clear focal point? No visual noise competing with the subject?
- Do materials feel real - specular highlights, micro-texture, realistic bokeh, light falloff?
- Is the typography placed on a clear alignment (flush to an object edge, the frame, or a grid), not floating?
- Does the frame feel composed by a human with taste, not generated by defaults?

== HARD DON'TS ==
- NO illustrations, cartoons, anime, 3D renders, CGI, clay-model look, vector art, flat graphic design, isometric, claymation, Pixar look, emoji art. The output is a photograph.
- No watermarks, no logos, no Instagram UI mockups, no borders or frames, no slide numbers printed on the image.
- No other text besides the overlaid headline. No fake body copy, no fake signatures.
- No stock-photo clichés (handshakes, lightbulb=idea, thumbs-up, smiling office, generic pointing-at-laptop). No muddy gradient backgrounds. No cluttered flat-lays with 10 objects. No pastel-gradient-with-blob-shapes 2019 aesthetic.
- No misspellings. Render the headline letter-for-letter as given.
- No recognizable real celebrities. Generic people from behind, side profile, or hands/torso only.
- No em dashes in visible text.

Final check: if this image appeared in Apple's, Aesop's, or Jacquemus's Instagram feed, would it feel at home? If not, reshoot until it does.`;
}

function carouselVariationForIndex(index: number, total: number): string {
  if (total <= 1) return "A single considered hero composition.";
  if (index === 0) {
    return "COVER - the boldest composition of the carousel. Strong single subject in negative space with maximum visual impact. Set the visual language the rest of the carousel inherits.";
  }
  if (index === total - 1) {
    return "FINAL SLIDE - a calmer, quieter composition. Can be a small detail, a softer still-life, or a blank-space-heavy moment that lets the headline land. Feels like a gentle close.";
  }
  const patterns = [
    "A tight macro detail - extreme close-up of one material or texture relevant to this slide's idea. Selective focus, one sharp plane.",
    "An overhead top-down still-life shot - objects arranged like a museum composition on a flat textured surface.",
    "A wide environmental shot with depth - foreground / midground / background layers. Subject small in frame.",
    "A color-blocked hero on a painted backdrop in the brand primary color. Single isolated subject, deep shadow anchor.",
    "A hand-in-frame action moment - a real hand doing something relevant to this slide's idea, shot at 50mm waist height.",
    "A silhouette or rim-lit side profile, subject carved out of shadow by a single light source.",
  ];
  const choice = patterns[(index - 1) % patterns.length];
  return `Vary the composition from the previous slide. This slide: ${choice} Keep palette, grade, and typography identical to the cover.`;
}

async function writeImageToPublic(
  postId: string,
  slideIndex: number,
  bytes: Buffer,
): Promise<string> {
  const dir = join(process.cwd(), "public", "generated", "content-images");
  await mkdir(dir, { recursive: true });
  const filename = `${postId}-${slideIndex}-${Date.now()}.png`;
  await writeFile(join(dir, filename), bytes);
  return `/generated/content-images/${filename}`;
}

/**
 * Best-effort cleanup of an old public image URL. Silently ignores missing files.
 * Safety: only unlinks files inside the public/generated/content-images directory.
 */
export async function removePublicImage(url: string): Promise<void> {
  if (!url.startsWith("/generated/content-images/")) return;
  try {
    const relativePath = url.replace(/^\/+/, "");
    const absolute = join(process.cwd(), "public", relativePath);
    await unlink(absolute);
  } catch {
    // file already gone or permission issue; not worth blocking the flow
  }
}

/**
 * Reads a public image URL back into a base64 string so it can be fed into
 * Gemini edit mode. Returns null if the file cannot be read.
 */
async function readPublicImageAsBase64(url: string): Promise<string | null> {
  if (!url.startsWith("/generated/content-images/")) return null;
  try {
    const relativePath = url.replace(/^\/+/, "");
    const absolute = join(process.cwd(), "public", relativePath);
    const buffer = await readFile(absolute);
    return buffer.toString("base64");
  } catch {
    return null;
  }
}

interface RunSlideOptions {
  refinementPrompt?: string;
  baseImageUrl?: string;
}

/**
 * Generates or edits a single slide.
 * - If baseImageUrl + refinementPrompt are provided and the file is readable,
 *   runs Nano Banana in image-to-image mode.
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
  );

  const aspectRatio = POST_TYPE_ASPECT[post.postType];
  const refinement = opts.refinementPrompt?.trim();

  let inlineImageBase64: string | null = null;
  if (refinement && opts.baseImageUrl) {
    inlineImageBase64 = await readPublicImageAsBase64(opts.baseImageUrl);
  }

  const editMode = Boolean(refinement && inlineImageBase64);

  // Mention the aspect ratio explicitly in the prompt so the model honors it
  // even when we can't pass `imageConfig.aspectRatio` (some Gemini variants
  // like flash-lite reject the config).
  const aspectLine = `\n\n== FRAME ==\nDeliver the image at an exact ${aspectRatio} aspect ratio (width:height). Do not letterbox, do not crop text, do not pad. The canvas itself is ${aspectRatio}.`

  const editPrompt = editMode
    ? `${basePrompt}${aspectLine}

== USER REFINEMENT ON THE PROVIDED IMAGE ==
A prior version of this slide is attached. Apply this change while preserving everything else (composition, palette, light, typography, subject identity):
"${refinement}"

Deliver the refined photograph at the same aspect and quality.`
    : `${basePrompt}${aspectLine}`;

  const contents = editMode
    ? [
        {
          inlineData: { mimeType: "image/png", data: inlineImageBase64! },
        },
        { text: editPrompt },
      ]
    : editPrompt;

  // All `*-image*` Gemini models accept imageConfig. Text-only models don't
  // and must be avoided at the source (see lib/models.ts). In edit-mode we
  // drop imageConfig because it isn't allowed alongside inline image input.
  const supportsImageConfig = /image/.test(GEMINI_IMAGE_MODEL);
  let disableImageConfig = editMode || !supportsImageConfig;

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
        return { url, headline: slide.headline, prompt: editPrompt };
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
  previousImages: { url: string }[] | null = null,
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
  const generated = await Promise.all(
    slides.map((s, i) => runSlideGeneration(business, post, s, i, total)),
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
  opts: { refinementPrompt?: string; baseImageUrl?: string; previousUrl?: string },
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

  const result = await runSlideGeneration(
    business,
    post,
    slide,
    slideIndex,
    Math.max(totalSlides, slides.length),
    {
      refinementPrompt: opts.refinementPrompt,
      baseImageUrl: opts.baseImageUrl,
    },
  );

  if (result && opts.previousUrl) {
    await removePublicImage(opts.previousUrl);
  }
  return result;
}

/**
 * Write an uploaded image (buffer) to the public folder and return its URL.
 * Used by the "upload custom image" route.
 */
export async function saveUploadedSlideImage(
  postId: string,
  slideIndex: number,
  bytes: Buffer,
  previousUrl: string | null,
): Promise<string> {
  const url = await writeImageToPublic(postId, slideIndex, bytes);
  if (previousUrl) await removePublicImage(previousUrl);
  return url;
}

export { planCarouselSlides, buildSlidePrompt };
