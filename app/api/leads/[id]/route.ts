import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lead, discoveryJob } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

/** Allowed lead statuses. Must match STATUS_CONFIG on the client. */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "no_profile",
  "not_interested",
  "customer",
] as const

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
})

/** Verify that a lead belongs to one of the signed-in user's jobs. */
async function assertLeadOwnership(leadId: string, userId: string) {
  const userJobs = await db
    .select({ id: discoveryJob.id })
    .from(discoveryJob)
    .where(eq(discoveryJob.userId, userId))

  if (userJobs.length === 0) return null

  const [row] = await db
    .select()
    .from(lead)
    .where(
      and(
        eq(lead.id, leadId),
        inArray(
          lead.jobId,
          userJobs.map((j) => j.id),
        ),
      ),
    )

  return row || null
}

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
  const row = await assertLeadOwnership(id, session.user.id)
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(row)
}

export async function PATCH(
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

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const existing = await assertLeadOwnership(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updates: Partial<typeof lead.$inferInsert> = {}
  if (parsed.data.status) updates.status = parsed.data.status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(existing)
  }

  const [updated] = await db
    .update(lead)
    .set(updates)
    .where(eq(lead.id, id))
    .returning()

  return NextResponse.json(updated)
}
