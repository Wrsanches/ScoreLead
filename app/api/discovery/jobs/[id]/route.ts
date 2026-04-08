import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob, lead } from "@/lib/db/schema"
import { eq, and, count } from "drizzle-orm"
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

  const [job] = await db
    .select()
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

  const [leadCount] = await db
    .select({ count: count() })
    .from(lead)
    .where(eq(lead.jobId, id))

  return NextResponse.json({
    ...job,
    leadCount: leadCount.count,
  })
}
