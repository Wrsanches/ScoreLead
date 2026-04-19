import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob } from "@/lib/db/schema"
import { and, eq, desc } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getActiveBusinessIdForUser } from "@/lib/active-business"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const activeBusinessId = await getActiveBusinessIdForUser(session.user.id)
  if (!activeBusinessId) {
    return NextResponse.json([])
  }

  const jobs = await db
    .select()
    .from(discoveryJob)
    .where(
      and(
        eq(discoveryJob.userId, session.user.id),
        eq(discoveryJob.businessId, activeBusinessId),
      ),
    )
    .orderBy(desc(discoveryJob.createdAt))

  return NextResponse.json(jobs)
}
