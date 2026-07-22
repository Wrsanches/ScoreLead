import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business, contentPost } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { regenerateSlide } from "@/lib/services/content-image-generator"
import { rateLimit } from "@/lib/rate-limit"
import { reserveImages, releaseImages, PlanLimitError } from "@/lib/plan"
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

  // Gate: regenerating a slide is one AI image. Reserve it atomically up-front
  // (released below if generation fails) so concurrent requests can't exceed
  // the cap during the slow generation.
  try {
    await reserveImages(session.user.id, 1)
  } catch (e) {
    if (e instanceof PlanLimitError) {
      return NextResponse.json(
        {
          error:
            e.plan === "free"
              ? "Free includes 1 AI image. Upgrade to Pro to generate more."
              : e.reason === "daily"
                ? "Daily AI image limit reached."
                : "Monthly AI image limit reached.",
          code: "PLAN_LIMIT",
          action: e.action,
          reason: e.reason,
        },
        { status: 402 },
      )
    }
    throw e
  }

  const images = post.images ?? []
  const previousSlide = images[index] ?? null

  let slide: Awaited<ReturnType<typeof regenerateSlide>>
  try {
    slide = await regenerateSlide(
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
        productImages: biz.productImages ?? null,
      },
      {
        id: post.id,
        postType: post.postType as ContentPostType,
        pillar: post.pillar as ContentPillar | null,
        caption: post.caption,
        visualIdea: post.visualIdea,
        callToAction: post.callToAction,
        referenceImagePref: post.referenceImagePref ?? null,
      },
      index,
      Math.max(images.length, index + 1),
      {
        refinementPrompt: parsed.data.refinementPrompt,
        baseImageUrl: previousSlide?.url,
        previousUrl: previousSlide?.url,
      },
    )
  } catch (e) {
    // Generation threw after we reserved the credit - give it back.
    await releaseImages(session.user.id, 1)
    throw e
  }

  if (!slide) {
    // No image produced - release the reserved credit.
    await releaseImages(session.user.id, 1)
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
