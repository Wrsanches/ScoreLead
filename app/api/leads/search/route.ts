import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lead, discoveryJob } from "@/lib/db/schema"
import { eq, desc, ilike, or, inArray, and } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const userJobs = await db
    .select({ id: discoveryJob.id })
    .from(discoveryJob)
    .where(eq(discoveryJob.userId, session.user.id))

  if (userJobs.length === 0) {
    return NextResponse.json({ results: [] })
  }

  const jobIds = userJobs.map((j) => j.id)
  const pattern = `%${q}%`

  const results = await db
    .select({
      id: lead.id,
      name: lead.name,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      websiteDomain: lead.websiteDomain,
      score: lead.score,
      photoUrl: lead.photoUrl,
      status: lead.status,
    })
    .from(lead)
    .where(
      and(
        inArray(lead.jobId, jobIds),
        or(
          ilike(lead.name, pattern),
          ilike(lead.city, pattern),
          ilike(lead.state, pattern),
          ilike(lead.country, pattern),
          ilike(lead.websiteDomain, pattern),
          ilike(lead.address, pattern),
        ),
      ),
    )
    .orderBy(desc(lead.score))
    .limit(10)

  return NextResponse.json({ results })
}
