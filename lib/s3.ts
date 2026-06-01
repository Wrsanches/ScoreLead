import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "node:crypto"

/**
 * Central S3 helper for all image storage (business logos, profile avatars,
 * content calendar slides, lead photos).
 *
 * - Client-side uploads (logos, avatars, user-uploaded slides) use a presigned
 *   PUT URL via `presignUpload` so the browser uploads straight to S3.
 * - Server-generated images (Gemini slides, Google Places lead photos) are
 *   uploaded directly with `putObject`.
 *
 * Objects are served publicly. Public read access is granted by the bucket
 * policy (modern buckets disable per-object ACLs), so we never set an ACL here.
 */

export const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
])

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

export function extForMime(mime: string): string {
  return EXT_BY_MIME[mime] ?? "bin"
}

/** All image kinds we namespace in the bucket. */
export type UploadKind = "business-logo" | "avatar" | "content-slide" | "lead-photo"

let client: S3Client | null = null

export function getS3(): S3Client {
  if (!client) {
    const region = process.env.AWS_REGION
    if (!region) throw new Error("AWS_REGION is not configured")
    client = new S3Client({ region })
  }
  return client
}

export function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) throw new Error("AWS_S3_BUCKET is not configured")
  return bucket
}

/** True only when the bucket + region are configured. */
export function isS3Configured(): boolean {
  return Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_REGION)
}

/** Public URL for a stored object key (CDN base if set, else the S3 URL). */
export function publicUrl(key: string): string {
  const base = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/+$/, "")
  if (base) return `${base}/${key}`
  return `https://${getBucket()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}

/** True if `url` points at our bucket / CDN (so we own it and may delete it). */
export function isManagedUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const base = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/+$/, "")
  if (base && url.startsWith(`${base}/`)) return true
  const bucket = process.env.AWS_S3_BUCKET
  return Boolean(bucket && url.includes(`${bucket}.s3.`))
}

/** Extract the object key from a public URL we produced, or null. */
export function keyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const base = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/+$/, "")
  if (base && url.startsWith(`${base}/`)) return url.slice(base.length + 1)
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_REGION
  const s3Prefix = bucket ? `https://${bucket}.s3.${region}.amazonaws.com/` : null
  if (s3Prefix && url.startsWith(s3Prefix)) return url.slice(s3Prefix.length)
  return null
}

/**
 * Build a namespaced, collision-resistant object key for a given kind. The
 * caller passes the authenticated user id and any context (postId/slideIndex)
 * so keys are predictable and scoped.
 */
export function buildKey(
  kind: UploadKind,
  ctx: { userId?: string; postId?: string; slideIndex?: number; ext: string },
): string {
  const id = randomUUID()
  switch (kind) {
    case "business-logo":
      return `business-logos/${ctx.userId}/${id}.${ctx.ext}`
    case "avatar":
      return `avatars/${ctx.userId}/${id}.${ctx.ext}`
    case "content-slide":
      return `content/${ctx.postId}/${ctx.slideIndex}-${id}.${ctx.ext}`
    case "lead-photo":
      return `leads/${id}.${ctx.ext}`
  }
}

/**
 * Generate a presigned PUT URL for a direct browser upload. The client must
 * send the exact same `Content-Type` header when PUTting, or the signature
 * will not match.
 */
export async function presignUpload(opts: {
  key: string
  contentType: string
  expiresIn?: number
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: opts.key,
    ContentType: opts.contentType,
  })
  return getSignedUrl(getS3(), command, { expiresIn: opts.expiresIn ?? 60 })
}

/** Server-side upload of a buffer (Gemini slides, lead photos). */
export async function putObject(opts: {
  key: string
  body: Buffer
  contentType: string
}): Promise<string> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
    }),
  )
  return publicUrl(opts.key)
}

/** Best-effort delete by key. Swallows errors. */
export async function deleteObject(key: string): Promise<void> {
  try {
    await getS3().send(
      new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
    )
  } catch {
    // object already gone or transient failure; not worth blocking the flow
  }
}

/** Read an object back as base64 (used to feed Gemini image-edit mode). */
export async function getObjectBase64(key: string): Promise<string | null> {
  try {
    const res = await getS3().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    )
    const bytes = await res.Body?.transformToByteArray()
    if (!bytes) return null
    return Buffer.from(bytes).toString("base64")
  } catch {
    return null
  }
}
