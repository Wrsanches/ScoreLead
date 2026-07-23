import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lead } from "@/lib/db/schema"
import { eq, desc, ilike, or, and } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { resolveViewableBusiness } from "@/lib/active-business"

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

  // Scope the search to the current business (from the URL).
  const access = await resolveViewableBusiness(
    session.user.id,
    url.searchParams.get("businessId"),
  )
  if (!access) {
    return NextResponse.json({ results: [] })
  }
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
        eq(lead.businessId, access.businessId),
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
