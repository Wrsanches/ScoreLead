/**
 * Central constants for LLM / image model IDs.
 * Bump here and every service picks it up.
 */

/**
 * OpenAI text model for planning, extraction, and drafting. The GPT-6 family
 * is exposed by the API under variant ids; "gpt-6-astra" is the general one.
 */
export const OPENAI_TEXT_MODEL = "gpt-6-astra"

/**
 * OpenAI GPT Image model used for content-calendar slide generation and
 * image-to-image refinement (both go through the Images API).
 *
 * Default is GPT Image 2.5 Sunburst (the higher-quality 2.5 variant; "flare"
 * is the faster sibling). Set OPENAI_IMAGE_MODEL in the environment to swap
 * models without a code change.
 *
 * GPT Image 2.x accepts arbitrary WIDTHxHEIGHT sizes (divisible by 16, aspect
 * between 1:3 and 3:1), always processes input images at high fidelity, and
 * returns base64 PNG/WebP/JPEG.
 */
export const OPENAI_IMAGE_MODEL =
  process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst"
