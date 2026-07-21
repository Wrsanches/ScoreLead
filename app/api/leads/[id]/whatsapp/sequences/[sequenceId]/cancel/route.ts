import { and, eq, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { whatsappSequence, whatsappSequenceStep } from "@/lib/db/schema"
import { getOwnedLead } from "@/lib/whatsapp/data"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; sequenceId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, sequenceId } = await params
  if (!(await getOwnedLead(id, session.user.id))) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
  const now = new Date()
  const [cancelled] = await db
    .update(whatsappSequence)
    .set({ status: "cancelled", cancelledAt: now, pauseReason: "cancelled_by_user", updatedAt: now })
    .where(and(
      eq(whatsappSequence.id, sequenceId),
      eq(whatsappSequence.leadId, id),
      inArray(whatsappSequence.status, ["draft", "scheduled", "paused"]),
    ))
    .returning()
  if (!cancelled) return NextResponse.json({ error: "Sequence cannot be cancelled" }, { status: 409 })
  await db
    .update(whatsappSequenceStep)
    .set({ status: "cancelled", errorCode: "cancelled_by_user", updatedAt: now })
    .where(and(
      eq(whatsappSequenceStep.sequenceId, sequenceId),
      inArray(whatsappSequenceStep.status, ["queued", "sending", "blocked"]),
    ))
  return NextResponse.json({ sequence: cancelled })
}
