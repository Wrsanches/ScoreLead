import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { contentPost } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { saveUploadedSlideImage } from "@/lib/services/content-image-generator"

export const maxDuration = 30

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"])

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

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }
  const file = formData.get("file")
  const headline = formData.get("headline")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 })
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, or WEBP are supported" },
      { status: 415 },
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const images = post.images ?? []
  const previous = images[index] ?? null
  const url = await saveUploadedSlideImage(
    post.id,
    index,
    buffer,
    previous?.url ?? null,
  )

  const nextImages = [...images]
  const resolvedHeadline =
    typeof headline === "string" && headline.trim()
      ? headline.trim().slice(0, 160)
      : previous?.headline ?? ""
  nextImages[index] = {
    url,
    headline: resolvedHeadline,
    prompt: "uploaded-by-user",
  }

  await db
    .update(contentPost)
    .set({ images: nextImages, updatedAt: new Date() })
    .where(eq(contentPost.id, id))

  const [updated] = await db
    .select()
    .from(contentPost)
    .where(eq(contentPost.id, id))
  return NextResponse.json({ post: updated })
}
