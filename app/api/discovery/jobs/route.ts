import { after } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob } from "@/lib/db/schema"
import { and, eq, desc } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { resolveBusinessId } from "@/lib/active-business"
import { pumpQueueIfDue } from "@/lib/jobs/discovery-queue"

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const activeBusinessId = await resolveBusinessId(
    session.user.id,
    url.searchParams.get("businessId"),
  )
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

  // The UI polls this route while a job runs; opportunistically recover
  // stalled/stranded jobs so the queue self-heals without a cron.
  after(() => pumpQueueIfDue())

  return NextResponse.json(jobs)
}
