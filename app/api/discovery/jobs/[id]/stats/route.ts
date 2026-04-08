import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob, lead } from "@/lib/db/schema"
import { eq, and, avg, count, gte, lt, isNotNull } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Verify job belongs to user
  const [job] = await db
    .select({ id: discoveryJob.id })
    .from(discoveryJob)
    .where(
      and(
        eq(discoveryJob.id, id),
        eq(discoveryJob.userId, session.user.id),
      ),
    )

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  const jobLeads = eq(lead.jobId, id)

  const [
    [totals],
    [highCount],
    [mediumCount],
    [lowCount],
    [websiteCount],
    [emailCount],
    [phoneCount],
    [enrichedTotal],
    sources,
  ] = await Promise.all([
    db
      .select({
        total: count(),
        avgScore: avg(lead.score),
        avgGoogleRating: avg(lead.googleRating),
      })
      .from(lead)
      .where(jobLeads),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobLeads, gte(lead.score, 4))),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobLeads, gte(lead.score, 3), lt(lead.score, 4))),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobLeads, lt(lead.score, 3))),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobLeads, isNotNull(lead.website))),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobLeads, isNotNull(lead.email))),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobLeads, isNotNull(lead.phone))),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobLeads, eq(lead.firecrawlEnriched, true))),
    db
      .select({
        source: lead.source,
        count: count(),
      })
      .from(lead)
      .where(jobLeads)
      .groupBy(lead.source),
  ])

  const sourceBreakdown: Record<string, number> = {}
  for (const row of sources) {
    sourceBreakdown[row.source] = row.count
  }

  return NextResponse.json({
    totalLeads: totals.total,
    avgScore: Number(totals.avgScore) || 0,
    avgGoogleRating: totals.avgGoogleRating ? Number(totals.avgGoogleRating) : null,
    withWebsite: websiteCount.count,
    withEmail: emailCount.count,
    withPhone: phoneCount.count,
    enrichedCount: enrichedTotal.count,
    sourceBreakdown,
    scoreDistribution: {
      high: highCount.count,
      medium: mediumCount.count,
      low: lowCount.count,
    },
  })
}
