import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business, contentPost } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { regenerateSlide } from "@/lib/services/content-image-generator"
import { rateLimit } from "@/lib/rate-limit"
import type { ContentPillar, ContentPostType } from "@/lib/content-pillars"

export const maxDuration = 180

const bodySchema = z.object({
  refinementPrompt: z.string().max(1000).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; slideIndex: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const limit = rateLimit(`image-gen:${session.user.id}`, 12, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Slow down, generating too quickly", retryAfterMs: limit.retryAfterMs },
      { status: 429 },
    )
  }

  const { id, slideIndex } = await params
  const index = Number.parseInt(slideIndex, 10)
  if (!Number.isInteger(index) || index < 0 || index > 20) {
    return NextResponse.json({ error: "Invalid slide index" }, { status: 400 })
  }

  const rawBody = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const [post] = await db
    .select()
    .from(contentPost)
    .where(and(eq(contentPost.id, id), eq(contentPost.userId, session.user.id)))

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const [biz] = await db
    .select()
    .from(business)
    .where(
      and(
        eq(business.id, post.businessId),
        eq(business.userId, session.user.id),
      ),
    )
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const images = post.images ?? []
  const previousSlide = images[index] ?? null

  const slide = await regenerateSlide(
    {
      name: biz.name,
      category: biz.category,
      field: biz.field,
      persona: biz.persona,
      brandStyle: biz.brandStyle,
      brandColorPrimary: biz.brandColorPrimary,
      brandColorSecondary: biz.brandColorSecondary,
      brandFonts: biz.brandFonts ?? null,
      language: biz.language,
    },
    {
      id: post.id,
      postType: post.postType as ContentPostType,
      pillar: post.pillar as ContentPillar | null,
      caption: post.caption,
      visualIdea: post.visualIdea,
      callToAction: post.callToAction,
    },
    index,
    Math.max(images.length, index + 1),
    {
      refinementPrompt: parsed.data.refinementPrompt,
      baseImageUrl: previousSlide?.url,
      previousUrl: previousSlide?.url,
    },
  )

  if (!slide) {
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 502 },
    )
  }

  const nextImages = [...images]
  nextImages[index] = slide
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
