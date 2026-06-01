import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { contentPost } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import {
  ALLOWED_IMAGE_MIME,
  buildKey,
  extForMime,
  isS3Configured,
  presignUpload,
  publicUrl,
  type UploadKind,
} from "@/lib/s3"

const VALID_KINDS: UploadKind[] = [
  "business-logo",
  "avatar",
  "content-slide",
]

/**
 * Issues a presigned PUT URL for a direct browser upload to S3. The object key
 * is always derived server-side from the authenticated user (and verified post
 * ownership for content slides) so the client cannot choose where it writes.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isS3Configured()) {
    return NextResponse.json(
      { error: "Image storage is not configured" },
      { status: 503 },
    )
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const kind = body.kind as UploadKind
  const contentType = body.contentType as string

  if (!VALID_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 })
  }
  if (typeof contentType !== "string" || !ALLOWED_IMAGE_MIME.has(contentType)) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, or WEBP are supported" },
      { status: 415 },
    )
  }

  const ext = extForMime(contentType)
  let key: string

  if (kind === "content-slide") {
    const postId = body.postId as string
    const slideIndex = Number(body.slideIndex)
    if (typeof postId !== "string" || !postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 })
    }
    if (!Number.isInteger(slideIndex) || slideIndex < 0 || slideIndex > 20) {
      return NextResponse.json({ error: "Invalid slide index" }, { status: 400 })
    }
    // Verify the post belongs to the caller before minting a key under it.
    const [post] = await db
      .select({ id: contentPost.id })
      .from(contentPost)
      .where(
        and(eq(contentPost.id, postId), eq(contentPost.userId, session.user.id)),
      )
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    key = buildKey(kind, { postId, slideIndex, ext })
  } else {
    key = buildKey(kind, { userId: session.user.id, ext })
  }

  const uploadUrl = await presignUpload({ key, contentType })

  return NextResponse.json({ uploadUrl, key, publicUrl: publicUrl(key) })
}
