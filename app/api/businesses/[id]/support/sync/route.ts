import { and, eq, inArray, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supportAssistant } from "@/lib/db/schema"
import { scopeSupport } from "@/lib/support/data"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params,
    scope = await scopeSupport(id, true, request)
  if (scope.error) return scope.error
  const [row] = await db
    .update(supportAssistant)
    .set({
      status: "queued",
      syncRequestedAt: new Date(),
      syncToken: null,
      version: sql`${supportAssistant.version} + 1`,
      previewedVersion: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(supportAssistant.businessId, id),
        inArray(supportAssistant.status, ["ready", "error"]),
      ),
    )
    .returning({ id: supportAssistant.businessId })
  return row
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ code: "sync_unavailable" }, { status: 409 })
}
