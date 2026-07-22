/**
 * Business product images: optional photos/screenshots of the user's actual
 * product, uploaded on the business profile. The content image generator can
 * use one as a Gemini reference image when a post is about the product.
 */

export const MAX_PRODUCT_IMAGES = 6

export interface ProductImage {
  /** Client-generated UUID - stable across description edits and reordering. */
  id: string
  url: string
  description: string
}

export type ReferenceImagePref = {
  mode: "auto" | "none" | "specific"
  /** Set when mode is "specific". */
  imageId?: string | null
}
