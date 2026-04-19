import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { contentPost } from "@/lib/db/schema"
import { and, eq, gte, lt } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getActiveBusinessIdForUser } from "@/lib/active-business"

function monthRange(monthParam: string | null): { start: Date; end: Date } {
  const now = new Date()
  let year = now.getUTCFullYear()
  let month = now.getUTCMonth()
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number)
    year = y
    month = m - 1
  }
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0))
  return { start, end }
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const { start, end } = monthRange(url.searchParams.get("month"))
  const businessId = await getActiveBusinessIdForUser(session.user.id)
  if (!businessId) {
    return NextResponse.json({ posts: [], businessId: null })
  }

  const rows = await db
    .select()
    .from(contentPost)
    .where(
      and(
        eq(contentPost.userId, session.user.id),
        eq(contentPost.businessId, businessId),
        gte(contentPost.scheduledFor, start),
        lt(contentPost.scheduledFor, end),
      ),
    )

  return NextResponse.json({
    posts: rows,
    businessId,
    monthStart: start.toISOString(),
    monthEnd: end.toISOString(),
  })
}

const createSchema = z.object({
  scheduledFor: z.string().datetime(),
  postType: z.enum(["single", "carousel", "reel", "story"]).default("single"),
  pillar: z
    .enum(["educate", "showcase", "story", "proof", "engagement"])
    .nullable()
    .optional(),
  caption: z.string().max(2200).default(""),
  hashtags: z.array(z.string()).default([]),
  visualIdea: z.string().nullable().optional(),
  callToAction: z.string().nullable().optional(),
  status: z.enum(["draft", "approved"]).default("draft"),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const businessId = await getActiveBusinessIdForUser(session.user.id)
  if (!businessId) {
    return NextResponse.json(
      { error: "Complete onboarding before planning content." },
      { status: 409 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const data = parsed.data
  await db.insert(contentPost).values({
    id,
    userId: session.user.id,
    businessId,
    provider: "instagram",
    scheduledFor: new Date(data.scheduledFor),
    postType: data.postType,
    pillar: data.pillar ?? null,
    caption: data.caption,
    hashtags: data.hashtags,
    visualIdea: data.visualIdea ?? null,
    callToAction: data.callToAction ?? null,
    status: data.status,
    aiGenerated: false,
  })

  const [inserted] = await db
    .select()
    .from(contentPost)
    .where(eq(contentPost.id, id))

  return NextResponse.json({ post: inserted }, { status: 201 })
}
