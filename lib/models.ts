/**
 * Central constants for LLM / image model IDs.
 * Bump here and every service picks it up.
 */

export const OPENAI_TEXT_MODEL = "gpt-5.4"

/**
 * Gemini image-generation model. MUST be an image-output variant. Text-only
 * models like "gemini-3.1-flash-lite-preview" accept images as input but never
 * produce image data - they'll silently return text and break generation.
 *
 * Valid image-output models:
 *   - "gemini-3.1-flash-image-preview" Nano Banana 2. Best balance of cost/quality. 1K-4K, imageConfig supported.
 *   - "gemini-3-pro-image-preview"     Nano Banana Pro. High-end. 1K-4K + search grounding + "Thinking" reasoning.
 *   - "gemini-2.5-flash-image"         Older Nano Banana. 1024px only, cheapest.
 *
 * All three accept imageConfig (aspectRatio, imageSize) and require
 * responseModalities to include IMAGE.
 */
export const GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview"

/** Image-to-image refinement. Same model as generation; edit uses inline image in contents. */
export const GEMINI_IMAGE_EDIT_MODEL = "gemini-3-pro-image-preview"
