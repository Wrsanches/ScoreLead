"use client"

/**
 * Client-side image upload via presigned PUT. Asks the server for a presigned
 * URL (which derives the object key server-side), then uploads the file
 * straight to S3. Returns the public URL to persist.
 */

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"]
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024

export type UploadKind =
  | "business-logo"
  | "business-product"
  | "avatar"
  | "content-slide"

export interface UploadOptions {
  kind: UploadKind
  /** Required for content-slide uploads. */
  postId?: string
  /** Required for content-slide uploads. */
  slideIndex?: number
  /** Override the max file size (defaults to 8MB). */
  maxBytes?: number
}

export class UploadError extends Error {}

export async function uploadImage(
  file: File,
  opts: UploadOptions,
): Promise<{ url: string; key: string }> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new UploadError("Only PNG, JPEG, or WEBP images are supported")
  }
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES
  if (file.size > maxBytes) {
    throw new UploadError(
      `File too large (max ${Math.round(maxBytes / (1024 * 1024))}MB)`,
    )
  }

  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: opts.kind,
      contentType: file.type,
      postId: opts.postId,
      slideIndex: opts.slideIndex,
    }),
  })
  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => null)
    throw new UploadError(data?.error ?? "Could not start upload")
  }
  const { uploadUrl, publicUrl, key } = (await presignRes.json()) as {
    uploadUrl: string
    publicUrl: string
    key: string
  }

  // The Content-Type must match what was signed, or S3 rejects the PUT.
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!putRes.ok) {
    throw new UploadError("Upload failed")
  }

  return { url: publicUrl, key }
}
