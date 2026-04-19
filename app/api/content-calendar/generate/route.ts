import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business, contentPost } from "@/lib/db/schema"
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateContentPlan } from "@/lib/services/content-calendar-generator"
import { removePublicImage } from "@/lib/services/content-image-generator"
import { getActiveBusinessIdForUser } from "@/lib/active-business"

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  postCount: z.number().int().min(4).max(40).optional(),
  replaceExisting: z.boolean().optional(),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const activeBusinessId = await getActiveBusinessIdForUser(session.user.id)
  if (!activeBusinessId) {
    return NextResponse.json(
      { error: "Complete onboarding before planning content." },
      { status: 409 },
    )
  }
  const [activeBusiness] = await db
    .select()
    .from(business)
    .where(
      and(
        eq(business.id, activeBusinessId),
        eq(business.userId, session.user.id),
      ),
    )
  if (!activeBusiness) {
    return NextResponse.json(
      { error: "Active business not found" },
      { status: 404 },
    )
  }

  const now = new Date()
  let year = now.getUTCFullYear()
  let month = now.getUTCMonth()
  if (parsed.data.month) {
    const [y, m] = parsed.data.month.split("-").map(Number)
    year = y
    month = m - 1
  }
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0))

  // When the caller doesn't pass postCount, pass undefined through so the
  // model chooses a number tuned to the business profile and month length.
  const postCount = parsed.data.postCount

  const plan = await generateContentPlan(
    {
      name: activeBusiness.name,
      description: activeBusiness.description,
      persona: activeBusiness.persona,
      clientPersona: activeBusiness.clientPersona,
      field: activeBusiness.field,
      category: activeBusiness.category,
      tags: activeBusiness.tags,
      services: activeBusiness.services,
      location: activeBusiness.location,
      language: activeBusiness.language,
      brandStyle: activeBusiness.brandStyle,
      brandColorPrimary: activeBusiness.brandColorPrimary,
      brandColorSecondary: activeBusiness.brandColorSecondary,
      instagram: activeBusiness.instagram,
    },
    start,
    end,
    postCount,
  )

  if (plan.length === 0) {
    return NextResponse.json(
      { error: "Content generation failed. Try again." },
      { status: 502 },
    )
  }

  if (parsed.data.replaceExisting) {
    // Only drop posts that are clearly "untouched AI drafts": aiGenerated,
    // still draft status, no images attached, and never edited beyond their
    // original insert (updatedAt within ~30s of createdAt). User-edited posts
    // stay put even when the user clicks "Regenerate".
    const stale = await db
      .select()
      .from(contentPost)
      .where(
        and(
          eq(contentPost.userId, session.user.id),
          eq(contentPost.businessId, activeBusiness.id),
          eq(contentPost.aiGenerated, true),
          eq(contentPost.status, "draft"),
          isNull(contentPost.images),
          gte(contentPost.scheduledFor, start),
          lt(contentPost.scheduledFor, end),
          sql`${contentPost.updatedAt} <= ${contentPost.createdAt} + interval '30 seconds'`,
        ),
      )
    if (stale.length > 0) {
      await Promise.all(
        stale.flatMap((p) =>
          (p.images ?? []).map((img) => removePublicImage(img.url)),
        ),
      )
      await db.delete(contentPost).where(
        and(
          eq(contentPost.userId, session.user.id),
          eq(contentPost.businessId, activeBusiness.id),
          eq(contentPost.aiGenerated, true),
          eq(contentPost.status, "draft"),
          isNull(contentPost.images),
          gte(contentPost.scheduledFor, start),
          lt(contentPost.scheduledFor, end),
          sql`${contentPost.updatedAt} <= ${contentPost.createdAt} + interval '30 seconds'`,
        ),
      )
    }
  }

  const toInsert = plan.map((p) => ({
    id: crypto.randomUUID(),
    userId: session.user.id,
    businessId: activeBusiness.id,
    provider: "instagram",
    scheduledFor: p.scheduledFor,
    postType: p.postType,
    pillar: p.pillar,
    caption: p.caption,
    hashtags: p.hashtags,
    visualIdea: p.visualIdea,
    callToAction: p.callToAction,
    status: "draft",
    aiGenerated: true,
  }))

  await db.insert(contentPost).values(toInsert)

  const inserted = await db
    .select()
    .from(contentPost)
    .where(
      and(
        eq(contentPost.userId, session.user.id),
        eq(contentPost.businessId, activeBusiness.id),
        gte(contentPost.scheduledFor, start),
        lt(contentPost.scheduledFor, end),
      ),
    )

  return NextResponse.json({
    posts: inserted,
    monthStart: start.toISOString(),
    monthEnd: end.toISOString(),
  })
}
