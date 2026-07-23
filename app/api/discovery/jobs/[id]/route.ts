import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { discoveryJob, lead } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getBusinessAccess } from "@/lib/business-access"

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

  const [job] = await db
    .select()
    .from(discoveryJob)
    .where(eq(discoveryJob.id, id))
    .limit(1)

  const access = job
    ? await getBusinessAccess(session.user.id, job.businessId)
    : null
  const requestedBusinessId = new URL(request.url).searchParams.get("businessId")
  if (
    !job ||
    !access ||
    (requestedBusinessId && requestedBusinessId !== job.businessId)
  ) {
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
