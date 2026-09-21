import OpenAI, { toFile } from "openai"
import { z } from "zod"
import { OPENAI_IMAGE_MODEL } from "@/lib/models"
import { buildKey, getObjectBytes, isManagedUrl, keyFromUrl, putObject } from "@/lib/s3"
import type { ProductImage } from "@/lib/product-images"

export const EMAIL_IMAGE_FORMATS = ["wide", "square", "portrait"] as const
export type EmailImageFormat = (typeof EMAIL_IMAGE_FORMATS)[number]

/** GPT Image 2.x accepts any WIDTHxHEIGHT divisible by 16; these fit a 600px email column. */
const FORMAT_SIZE: Record<EmailImageFormat, { size: string; label: string }> = {
  wide: { size: "1200x624", label: "wide 2:1 banner" },
  square: { size: "1024x1024", label: "square 1:1" },
  portrait: { size: "800x1008", label: "portrait 4:5" },
}

export const MAX_REFERENCES = 4

export const emailImageRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(600),
  format: z.enum(EMAIL_IMAGE_FORMATS).default("wide"),
  /** Product image ids from the business profile and/or "logo", attached in this order. */
  references: z.array(z.string().max(80)).max(MAX_REFERENCES).default([]),
})
export type EmailImageRequest = z.infer<typeof emailImageRequestSchema>

export interface EmailImageBusiness {
  name: string | null
  category: string | null
  field: string | null
  description: string | null
  services: string | null
  clientPersona: string | null
  brandStyle: string | null
  brandColorPrimary: string | null
  brandColorSecondary: string | null
  logo: string | null
  productImages: ProductImage[] | null
}

export class EmailImageError extends Error {
  constructor(
    public readonly code: "NOT_CONFIGURED" | "REFERENCE_UNAVAILABLE" | "GENERATION_FAILED",
    message: string,
  ) {
    super(message)
    this.name = "EmailImageError"
  }
}

let client: OpenAI | null = null
function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new EmailImageError("NOT_CONFIGURED", "OPENAI_API_KEY is not configured")
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

const REFERENCE_MAX_BYTES = 8 * 1024 * 1024

/** Managed uploads come straight from S3; anything else (a logo URL) is fetched with a size cap. */
async function loadReference(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (isManagedUrl(url)) {
    const key = keyFromUrl(url)
    return key ? getObjectBytes(key) : null
  }
  if (!/^https:\/\//i.test(url)) return null
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) return null
    const contentType = response.headers.get("content-type")?.split(";")[0].trim() || ""
    if (!/^image\/(png|jpeg|webp)$/.test(contentType)) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength === 0 || buffer.byteLength > REFERENCE_MAX_BYTES) return null
    return { bytes: buffer, contentType }
  } catch {
    return null
  }
}

type ResolvedReference = { kind: "logo" } | { kind: "product"; image: ProductImage }

function describeReferences(references: ResolvedReference[]): string {
  if (references.length === 0) return ""
  const lines = references.map((ref, i) =>
    ref.kind === "logo"
      ? `Attached image ${i + 1} is the business's real logo. Place it faithfully and legibly as a physical or on-screen element in the scene; never redraw or distort it.`
      : `Attached image ${i + 1} shows the business's real product${ref.image.description ? ` (${ref.image.description})` : ""}. Feature that exact product, preserving its shape, colors, labels, and proportions; never replace it with a generic look-alike.`,
  )
  const products = references.filter((r) => r.kind === "product").length
  if (products > 1) lines.push("Compose the products together in one coherent scene with a clear hero; do not tile them as a grid or collage.")
  return lines.join("\n")
}

export function buildEmailImagePrompt(business: EmailImageBusiness, request: EmailImageRequest, references: ResolvedReference[]): string {
  const brand = business.name || "the business"
  const category = business.category || business.field || ""
  const palette = [business.brandColorPrimary && `primary ${business.brandColorPrimary}`, business.brandColorSecondary && `secondary ${business.brandColorSecondary}`]
    .filter(Boolean)
    .join(", ")
  return [
    `Create one ${FORMAT_SIZE[request.format].label} image for the top of a marketing email sent by ${brand}${category ? ` (${category})` : ""} to prospective business clients${business.clientPersona ? ` (${business.clientPersona})` : ""}.`,
    `Subject of the image: ${request.prompt}`,
    business.description || business.services ? `About the business: ${(business.services || business.description || "").slice(0, 400)}` : "",
    business.brandStyle ? `Brand style: ${business.brandStyle}.` : "",
    palette ? `Brand palette to echo in props, light, or backdrop: ${palette}. Use it as an accent, not a flood.` : "",
    describeReferences(references),
    "Photographic or editorial realism, natural light, one clear subject, and generous negative space on one side where a heading could sit.",
    "It must read well at 600 pixels wide on a phone. Absolutely no text, letters, numbers, logos (other than an attached real logo), watermarks, or UI mockups.",
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * One brand-aware email image from GPT Image, optionally anchored on up to
 * four real product photos and/or the logo, stored as a JPEG under the user's email assets.
 * The caller reserves the AI-image credit before calling this.
 */
export async function generateEmailImage(
  business: EmailImageBusiness,
  request: EmailImageRequest,
  userId: string,
): Promise<{ url: string; alt: string; prompt: string }> {
  const openai = getClient()

  const references: ResolvedReference[] = []
  const referenceFiles: Awaited<ReturnType<typeof toFile>>[] = []
  for (const id of Array.from(new Set(request.references))) {
    const product = id === "logo" ? null : (business.productImages ?? []).find((img) => img.id === id)
    const url = id === "logo" ? business.logo : product?.url
    if (!url || (id !== "logo" && !product)) throw new EmailImageError("REFERENCE_UNAVAILABLE", "That reference image is no longer on the business profile")
    const loaded = await loadReference(url)
    if (!loaded) throw new EmailImageError("REFERENCE_UNAVAILABLE", "Could not read the reference image")
    references.push(id === "logo" ? { kind: "logo" } : { kind: "product", image: product! })
    referenceFiles.push(await toFile(Buffer.from(loaded.bytes), `reference-${references.length}.${loaded.contentType.split("/")[1]}`, { type: loaded.contentType }))
  }

  const prompt = buildEmailImagePrompt(business, request, references)
  const size = FORMAT_SIZE[request.format].size
  const common = { model: OPENAI_IMAGE_MODEL, prompt, size, quality: "medium" as const, output_format: "jpeg" as const, output_compression: 85 }
  let b64: string | undefined
  try {
    const response = referenceFiles.length > 0
      ? await openai.images.edit({ ...common, image: referenceFiles })
      : await openai.images.generate(common)
    b64 = response.data?.[0]?.b64_json
  } catch (error) {
    console.error("[resend] email image generation failed:", error)
    throw new EmailImageError("GENERATION_FAILED", error instanceof Error ? error.message : "Image generation failed")
  }
  if (!b64) throw new EmailImageError("GENERATION_FAILED", "The image model returned no image")

  const key = buildKey("email-asset", { userId, ext: "jpg" })
  const url = await putObject({ key, body: Buffer.from(b64, "base64"), contentType: "image/jpeg" })
  return { url, alt: request.prompt.slice(0, 200), prompt }
}
