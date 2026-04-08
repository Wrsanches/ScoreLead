import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lead, discoveryJob } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
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

  // Get user's job IDs to verify ownership
  const userJobs = await db
    .select({ id: discoveryJob.id })
    .from(discoveryJob)
    .where(eq(discoveryJob.userId, session.user.id))

  if (userJobs.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const [result] = await db
    .select()
    .from(lead)
    .where(
      and(
        eq(lead.id, id),
        inArray(lead.jobId, userJobs.map((j) => j.id)),
      ),
    )

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(result)
}
