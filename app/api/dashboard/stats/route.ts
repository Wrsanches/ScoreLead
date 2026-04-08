import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob, lead } from "@/lib/db/schema"
import { eq, and, count, avg, gte, lt, desc, sql, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  // Get user's jobs
  const userJobs = await db
    .select({ id: discoveryJob.id })
    .from(discoveryJob)
    .where(eq(discoveryJob.userId, userId))

  const jobIds = userJobs.map((j) => j.id)
  const hasJobs = jobIds.length > 0
  const jobCondition = hasJobs ? inArray(lead.jobId, jobIds) : sql`false`

  const [
    [jobTotals],
    [leadTotals],
    [highScoreCount],
    [withWebsite],
    [withEmail],
    [withPhone],
    [enrichedCount],
    scoreDistribution,
    sourceBreakdown,
    recentLeads,
    recentJobs,
    leadsOverTime,
  ] = await Promise.all([
    // Job stats
    db
      .select({
        total: count(),
        completed: count(sql`CASE WHEN ${discoveryJob.status} = 'completed' THEN 1 END`),
        running: count(sql`CASE WHEN ${discoveryJob.status} = 'running' THEN 1 END`),
        failed: count(sql`CASE WHEN ${discoveryJob.status} = 'failed' THEN 1 END`),
      })
      .from(discoveryJob)
      .where(eq(discoveryJob.userId, userId)),
    // Lead totals
    db
      .select({
        total: count(),
        avgScore: avg(lead.score),
        avgRating: avg(lead.googleRating),
      })
      .from(lead)
      .where(jobCondition),
    // High score leads
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobCondition, gte(lead.score, 4))),
    // Contact availability
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobCondition, sql`${lead.website} IS NOT NULL`)),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobCondition, sql`${lead.email} IS NOT NULL`)),
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobCondition, sql`${lead.phone} IS NOT NULL`)),
    // Enriched
    db
      .select({ count: count() })
      .from(lead)
      .where(and(jobCondition, eq(lead.firecrawlEnriched, true))),
    // Score distribution for chart
    db
      .select({
        bucket: sql<string>`
          CASE
            WHEN ${lead.score} >= 4.5 THEN '4.5-5.0'
            WHEN ${lead.score} >= 4.0 THEN '4.0-4.5'
            WHEN ${lead.score} >= 3.5 THEN '3.5-4.0'
            WHEN ${lead.score} >= 3.0 THEN '3.0-3.5'
            WHEN ${lead.score} >= 2.5 THEN '2.5-3.0'
            WHEN ${lead.score} >= 2.0 THEN '2.0-2.5'
            ELSE '1.0-2.0'
          END`,
        count: count(),
      })
      .from(lead)
      .where(jobCondition)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    // Source breakdown for chart
    db
      .select({
        source: lead.source,
        count: count(),
      })
      .from(lead)
      .where(jobCondition)
      .groupBy(lead.source),
    // Recent leads
    db
      .select({
        id: lead.id,
        name: lead.name,
        score: lead.score,
        city: lead.city,
        country: lead.country,
        photoUrl: lead.photoUrl,
        createdAt: lead.createdAt,
      })
      .from(lead)
      .where(jobCondition)
      .orderBy(desc(lead.createdAt))
      .limit(5),
    // Recent jobs
    db
      .select({
        id: discoveryJob.id,
        name: discoveryJob.name,
        status: discoveryJob.status,
        insertedLeads: discoveryJob.insertedLeads,
        createdAt: discoveryJob.createdAt,
      })
      .from(discoveryJob)
      .where(eq(discoveryJob.userId, userId))
      .orderBy(desc(discoveryJob.createdAt))
      .limit(5),
    // Leads over time (last 7 days)
    db
      .select({
        date: sql<string>`TO_CHAR(${lead.createdAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(lead)
      .where(and(
        jobCondition,
        gte(lead.createdAt, sql`NOW() - INTERVAL '7 days'`),
      ))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
  ])

  return NextResponse.json({
    jobs: {
      total: jobTotals.total,
      completed: Number(jobTotals.completed),
      running: Number(jobTotals.running),
      failed: Number(jobTotals.failed),
    },
    leads: {
      total: leadTotals.total,
      avgScore: Number(leadTotals.avgScore) || 0,
      avgRating: leadTotals.avgRating ? Number(leadTotals.avgRating) : null,
      highScore: highScoreCount.count,
      withWebsite: withWebsite.count,
      withEmail: withEmail.count,
      withPhone: withPhone.count,
      enriched: enrichedCount.count,
    },
    charts: {
      scoreDistribution,
      sourceBreakdown: sourceBreakdown.map((s) => ({
        source: s.source === "google_places" ? "Google Places" : s.source === "brave_search" ? "Brave Search" : s.source,
        count: s.count,
      })),
      leadsOverTime,
    },
    recentLeads,
    recentJobs,
  })
}
