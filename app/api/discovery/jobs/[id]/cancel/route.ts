import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getBusinessAccess } from "@/lib/business-access"

export async function POST(
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
    .where(eq(discoveryJob.id, id))

  const access = job
    ? await getBusinessAccess(session.user.id, job.businessId)
    : null

  if (!job || !access || access.readOnly) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  if (job.status !== "running" && job.status !== "queued") {
    return NextResponse.json({ error: "Job is not running" }, { status: 400 })
  }

  await db
    .update(discoveryJob)
    .set({
      status: "cancelled",
      completedAt: new Date(),
    })
    .where(eq(discoveryJob.id, id))

  return NextResponse.json({ success: true })
}
