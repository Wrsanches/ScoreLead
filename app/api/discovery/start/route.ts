import { after } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business, discoveryJob } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { processDiscoveryQueue } from "@/lib/jobs/discovery-queue"
import { rateLimit } from "@/lib/rate-limit"
import {
  assertCanUse,
  recordUsage,
  getUserPlan,
  freeLeadCap,
  PlanLimitError,
} from "@/lib/plan"

const startJobSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1),
  country: z.string().min(1),
  state: z.string().nullable(),
  city: z.string().nullable(),
  location: z.string().min(1),
  keywords: z.array(z.string()).min(1),
  maxResults: z.number().min(1).max(500),
  serviceArea: z.enum(["local", "regional", "national"]),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limit = rateLimit(`discovery-start:${session.user.id}`, 3, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many discovery requests. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
    )
  }

  const body = await request.json()
  const parsed = startJobSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data

  const [biz] = await db
    .select()
    .from(business)
    .where(
      and(
        eq(business.id, data.businessId),
        eq(business.userId, session.user.id),
        eq(business.onboardingCompleted, true),
      ),
    )

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  // Gate: Free allows 1 discovery job total.
  try {
    await assertCanUse(session.user.id, "discoveryJob")
  } catch (e) {
    if (e instanceof PlanLimitError) {
      return NextResponse.json(
        {
          error: "You've used your free discovery run. Upgrade to Pro for unlimited discovery.",
          code: "PLAN_LIMIT",
          action: e.action,
        },
        { status: 402 },
      )
    }
    throw e
  }

  // Free plans are clamped to a smaller lead cap to protect API costs.
  const plan = await getUserPlan(session.user.id)
  const maxResults = freeLeadCap(plan, data.maxResults)

  // Save keywords for next time
  await db
    .update(business)
    .set({ lastDiscoveryKeywords: data.keywords, updatedAt: new Date() })
    .where(eq(business.id, data.businessId))

  const jobId = crypto.randomUUID()

  await db.insert(discoveryJob).values({
    id: jobId,
    businessId: data.businessId,
    userId: session.user.id,
    name: data.name,
    country: data.country,
    state: data.state,
    city: data.city,
    location: data.location,
    keywords: JSON.stringify(data.keywords),
    maxResults,
    serviceArea: data.serviceArea,
    status: "queued",
  })

  await recordUsage(session.user.id, "discoveryJob")

  // The job is queued; the pump claims and runs it subject to the global
  // and per-user concurrency caps (see lib/jobs/discovery-queue.ts).
  after(() => processDiscoveryQueue())

  return NextResponse.json({ jobId }, { status: 202 })
}
