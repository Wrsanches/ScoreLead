import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob, lead } from "@/lib/db/schema"
import { eq, and, desc, asc, count } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
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

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "20")))
  const sortBy = url.searchParams.get("sortBy") || "score"
  const sortOrder = url.searchParams.get("sortOrder") || "desc"
  const offset = (page - 1) * limit

  const orderColumn =
    sortBy === "score"
      ? lead.score
      : sortBy === "name"
        ? lead.name
        : sortBy === "createdAt"
          ? lead.createdAt
          : lead.score

  const orderFn = sortOrder === "asc" ? asc : desc

  const [leads, [total]] = await Promise.all([
    db
      .select()
      .from(lead)
      .where(eq(lead.jobId, id))
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(lead)
      .where(eq(lead.jobId, id)),
  ])

  return NextResponse.json({
    leads,
    total: total.count,
    page,
    totalPages: Math.ceil(total.count / limit),
  })
}
