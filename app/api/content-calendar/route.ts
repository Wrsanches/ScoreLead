import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { contentPlanJob, contentPost } from "@/lib/db/schema"
import { and, desc, eq, gte, lt } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse, after } from "next/server"
import { z } from "zod"
import {
  resolveManageableBusiness,
  resolveViewableBusiness,
} from "@/lib/active-business"
import {
  pumpContentPlanQueueIfDue,
  serializeJob,
} from "@/lib/jobs/content-plan-queue"

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
  const monthParam = url.searchParams.get("month")
  const { start, end } = monthRange(monthParam)
  const access = await resolveViewableBusiness(
    session.user.id,
    url.searchParams.get("businessId"),
  )
  if (!access) {
    return NextResponse.json({ posts: [], businessId: null })
  }

  const monthKey = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`

  const [rows, jobs] = await Promise.all([
    db
      .select()
      .from(contentPost)
      .where(
        and(
          eq(contentPost.businessId, access.businessId),
          gte(contentPost.scheduledFor, start),
          lt(contentPost.scheduledFor, end),
        ),
      ),
    // The latest generation job for this month, so a user returning mid-run
    // sees progress instead of an empty calendar with a Generate button.
    db
      .select()
      .from(contentPlanJob)
      .where(
        and(
          eq(contentPlanJob.businessId, access.businessId),
          eq(contentPlanJob.month, monthKey),
        ),
      )
      .orderBy(desc(contentPlanJob.createdAt))
      .limit(1),
  ])

  // Recover jobs stranded by a killed instance; throttled, so this costs
  // nothing on a normal load.
  after(() => pumpContentPlanQueueIfDue())

  return NextResponse.json({
    posts: rows,
    job: jobs[0] ? serializeJob(jobs[0]) : null,
    businessId: access.businessId,
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

  const body = await request.json().catch(() => ({}))
  const access = await resolveManageableBusiness(
    session.user.id,
    body?.businessId,
  )
  if (!access) {
    return NextResponse.json(
      { error: "Complete onboarding before planning content." },
      { status: 409 },
    )
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const data = parsed.data
  await db.insert(contentPost).values({
    id,
    userId: access.ownerUserId,
    businessId: access.businessId,
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
