import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lead, discoveryJob } from "@/lib/db/schema"
import { and, eq, desc, count } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getActiveBusinessIdForUser } from "@/lib/active-business"

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "50")))
  const sortBy = url.searchParams.get("sortBy") || "score"
  const sortOrder = url.searchParams.get("sortOrder") || "desc"
  const statusFilter = url.searchParams.get("status") || "all"
  const offset = (page - 1) * limit

  const orderColumn =
    sortBy === "score" ? lead.score
    : sortBy === "name" ? lead.name
    : sortBy === "createdAt" ? lead.createdAt
    : lead.score

  const orderFn = sortOrder === "asc" ? (await import("drizzle-orm")).asc : desc

  // Scope to the currently active business. If no business is selected yet
  // (e.g. before onboarding completes), the response is empty.
  const activeBusinessId = await getActiveBusinessIdForUser(session.user.id)
  if (!activeBusinessId) {
    return NextResponse.json({ leads: [], total: 0, page, totalPages: 0 })
  }

  const userJobs = await db
    .select({ id: discoveryJob.id })
    .from(discoveryJob)
    .where(
      and(
        eq(discoveryJob.userId, session.user.id),
        eq(discoveryJob.businessId, activeBusinessId),
      ),
    )

  if (userJobs.length === 0) {
    return NextResponse.json({ leads: [], total: 0, page, totalPages: 0 })
  }

  const jobIds = userJobs.map((j) => j.id)

  const { inArray } = await import("drizzle-orm")

  const whereClause =
    statusFilter && statusFilter !== "all"
      ? and(inArray(lead.jobId, jobIds), eq(lead.status, statusFilter))
      : inArray(lead.jobId, jobIds)

  const [leads, [total]] = await Promise.all([
    db
      .select()
      .from(lead)
      .where(whereClause)
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(lead)
      .where(whereClause),
  ])

  return NextResponse.json({
    leads,
    total: total.count,
    page,
    totalPages: Math.ceil(total.count / limit),
  })
}
