import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lead } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getBusinessAccess } from "@/lib/business-access"
import { getManageableLead } from "@/lib/whatsapp/data"

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
  const requestedBusinessId = new URL(request.url).searchParams.get("businessId")
  if (!requestedBusinessId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const [row] = await db
    .select()
    .from(lead)
    .where(
      and(
        eq(lead.id, id),
        eq(lead.businessId, requestedBusinessId),
      ),
    )
    .limit(1)
  const access = row
    ? await getBusinessAccess(session.user.id, row.businessId)
    : null
  if (!row || !access) {
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

  const manageable = await getManageableLead(id, session.user.id)
  if (!manageable) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const existing = manageable.lead

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
