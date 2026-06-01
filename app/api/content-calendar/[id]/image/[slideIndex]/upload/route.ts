import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { contentPost } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { removePublicImage } from "@/lib/services/content-image-generator"
import { publicUrl } from "@/lib/s3"

/**
 * Confirms a user-uploaded slide image. The browser has already uploaded the
 * file directly to S3 via a presigned URL (see /api/uploads/presign); this
 * endpoint validates the resulting object key, persists its public URL onto
 * the post, and cleans up the previous image.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; slideIndex: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, slideIndex } = await params
  const index = Number.parseInt(slideIndex, 10)
  if (!Number.isInteger(index) || index < 0 || index > 20) {
    return NextResponse.json({ error: "Invalid slide index" }, { status: 400 })
  }

  const [post] = await db
    .select()
    .from(contentPost)
    .where(and(eq(contentPost.id, id), eq(contentPost.userId, session.user.id)))
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const key = body?.key
  const headline = body?.headline
  // The presign route mints keys as `content/<postId>/...`; enforce that the
  // confirmed object actually lives under this post.
  if (typeof key !== "string" || !key.startsWith(`content/${id}/`)) {
    return NextResponse.json({ error: "Invalid image key" }, { status: 400 })
  }

  const images = post.images ?? []
  const previous = images[index] ?? null

  const nextImages = [...images]
  const resolvedHeadline =
    typeof headline === "string" && headline.trim()
      ? headline.trim().slice(0, 160)
      : previous?.headline ?? ""
  nextImages[index] = {
    url: publicUrl(key),
    headline: resolvedHeadline,
    prompt: "uploaded-by-user",
  }

  await db
    .update(contentPost)
    .set({ images: nextImages, updatedAt: new Date() })
    .where(eq(contentPost.id, id))

  // Best-effort cleanup of the image we just replaced.
  if (previous?.url) await removePublicImage(previous.url)

  const [updated] = await db
    .select()
    .from(contentPost)
    .where(eq(contentPost.id, id))
  return NextResponse.json({ post: updated })
}
