import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { rateLimit } from "@/lib/rate-limit"
import { PlanLimitError, releaseImages, reserveImages } from "@/lib/plan"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { EmailImageError, emailImageRequestSchema, generateEmailImage } from "@/lib/services/email-image-generator"

export const maxDuration = 120

/**
 * Generate one brand-aware image for an email image block with GPT Image.
 * Costs one AI-image credit from the owner's plan, reserved up front and
 * released if generation fails.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI is not configured", code: "AI_NOT_CONFIGURED" }, { status: 503 })
  }
  const parsed = emailImageRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })

  const limit = rateLimit(`resend:image-gen:${scoped.session.user.id}`, 6, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many images in a short time", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    )
  }

  const [biz] = await db
    .select({
      name: business.name,
      category: business.category,
      field: business.field,
      description: business.description,
      services: business.services,
      clientPersona: business.clientPersona,
      brandStyle: business.brandStyle,
      brandColorPrimary: business.brandColorPrimary,
      brandColorSecondary: business.brandColorSecondary,
      logo: business.logo,
      productImages: business.productImages,
    })
    .from(business)
    .where(eq(business.id, id))
    .limit(1)
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 })

  try {
    await reserveImages(scoped.access.ownerUserId, 1)
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        { error: error.reason === "daily" ? "Daily AI image limit reached" : "AI image limit reached for your plan", code: "AI_IMAGE_LIMIT", action: error.action, reason: error.reason },
        { status: 402 },
      )
    }
    throw error
  }

  try {
    const result = await generateEmailImage({ ...biz, productImages: biz.productImages ?? null }, parsed.data, scoped.session.user.id)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    await releaseImages(scoped.access.ownerUserId, 1)
    if (error instanceof EmailImageError) {
      const status = error.code === "NOT_CONFIGURED" ? 503 : error.code === "REFERENCE_UNAVAILABLE" ? 400 : 502
      return NextResponse.json({ error: error.message, code: error.code === "GENERATION_FAILED" ? "AI_IMAGE_FAILED" : error.code }, { status })
    }
    console.error("[resend] email image route failed:", error)
    return NextResponse.json({ error: "Could not generate the image", code: "AI_IMAGE_FAILED" }, { status: 502 })
  }
}
