import { and, avg, count, desc, eq, gte, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { discoveryJob, lead } from "@/lib/db/schema"

export interface DashboardStats {
  jobs: { total: number; completed: number; running: number; failed: number }
  leads: {
    total: number
    avgScore: number
    avgRating: number | null
    highScore: number
    withWebsite: number
    withEmail: number
    withPhone: number
    enriched: number
  }
  charts: {
    scoreDistribution: { bucket: string; count: number }[]
    sourceBreakdown: { source: string; count: number }[]
    leadsOverTime: { date: string; count: number }[]
  }
  recentLeads: {
    id: string
    name: string | null
    score: number
    city: string | null
    country: string | null
    photoUrl: string | null
    createdAt: string
  }[]
  recentJobs: {
    id: string
    name: string
    status: string
    insertedLeads: number
    createdAt: string
  }[]
}

/**
 * Dashboard read model. Related counters share one aggregate query so loading
 * the dashboard does not spend six pool slots scanning the same lead rows.
 */
export async function getDashboardStats(
  businessId: string,
): Promise<DashboardStats> {
  const businessScope = eq(discoveryJob.businessId, businessId)
  const leadScope = eq(lead.businessId, businessId)

  const [
    [jobTotals],
    [leadTotals],
    scoreDistribution,
    sourceBreakdown,
    recentLeads,
    recentJobs,
    leadsOverTime,
  ] = await Promise.all([
    db
      .select({
        total: count(),
        completed: count(
          sql`CASE WHEN ${discoveryJob.status} = 'completed' THEN 1 END`,
        ),
        running: count(
          sql`CASE WHEN ${discoveryJob.status} = 'running' THEN 1 END`,
        ),
        failed: count(
          sql`CASE WHEN ${discoveryJob.status} = 'failed' THEN 1 END`,
        ),
      })
      .from(discoveryJob)
      .where(businessScope),
    db
      .select({
        total: count(),
        avgScore: avg(lead.score),
        avgRating: avg(lead.googleRating),
        highScore: count(sql`CASE WHEN ${lead.score} >= 4 THEN 1 END`),
        withWebsite: count(lead.website),
        withEmail: count(lead.email),
        withPhone: count(lead.phone),
        enriched: count(
          sql`CASE WHEN ${lead.firecrawlEnriched} = true THEN 1 END`,
        ),
      })
      .from(lead)
      .where(leadScope),
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
      .where(leadScope)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({ source: lead.source, count: count() })
      .from(lead)
      .where(leadScope)
      .groupBy(lead.source),
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
      .where(leadScope)
      .orderBy(desc(lead.createdAt))
      .limit(5),
    db
      .select({
        id: discoveryJob.id,
        name: discoveryJob.name,
        status: discoveryJob.status,
        insertedLeads: discoveryJob.insertedLeads,
        createdAt: discoveryJob.createdAt,
      })
      .from(discoveryJob)
      .where(businessScope)
      .orderBy(desc(discoveryJob.createdAt))
      .limit(5),
    db
      .select({
        date: sql<string>`TO_CHAR(${lead.createdAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(lead)
      .where(
        and(leadScope, gte(lead.createdAt, sql`NOW() - INTERVAL '7 days'`)),
      )
      .groupBy(sql`1`)
      .orderBy(sql`1`),
  ])

  return {
    jobs: {
      total: jobTotals.total,
      completed: Number(jobTotals.completed),
      running: Number(jobTotals.running),
      failed: Number(jobTotals.failed),
    },
    leads: {
      total: leadTotals.total,
      avgScore: Number(leadTotals.avgScore) || 0,
      avgRating:
        leadTotals.avgRating === null ? null : Number(leadTotals.avgRating),
      highScore: Number(leadTotals.highScore),
      withWebsite: Number(leadTotals.withWebsite),
      withEmail: Number(leadTotals.withEmail),
      withPhone: Number(leadTotals.withPhone),
      enriched: Number(leadTotals.enriched),
    },
    charts: {
      scoreDistribution,
      sourceBreakdown: sourceBreakdown.map((item) => ({
        source:
          item.source === "google_places"
            ? "Google Places"
            : item.source === "brave_search"
              ? "Brave Search"
              : item.source,
        count: item.count,
      })),
      leadsOverTime,
    },
    recentLeads: recentLeads.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    recentJobs: recentJobs.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  }
}
