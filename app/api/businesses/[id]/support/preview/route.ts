import { and, eq, isNull, lt, or } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supportAssistant } from "@/lib/db/schema"
import { generateSupportAnswer } from "@/lib/support/answers"
import { getSupportSettings, scopeSupport } from "@/lib/support/data"
import { answerInput } from "@/lib/support/policy"

export const maxDuration = 120
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params,
    scope = await scopeSupport(id, true, request)
  if (scope.error) return scope.error
  const input = answerInput.safeParse(await request.json().catch(() => null))
  if (!input.success)
    return NextResponse.json({ code: "invalid_question" }, { status: 400 })
  const row = await getSupportSettings(id)
  if (row.status !== "ready")
    return NextResponse.json({ code: "knowledge_not_ready" }, { status: 409 })
  const [claimed] = await db
    .update(supportAssistant)
    .set({ lastPreviewAt: new Date() })
    .where(
      and(
        eq(supportAssistant.businessId, id),
        or(
          isNull(supportAssistant.lastPreviewAt),
          lt(supportAssistant.lastPreviewAt, new Date(Date.now() - 15_000)),
        ),
      ),
    )
    .returning({ id: supportAssistant.businessId })
  if (!claimed) return NextResponse.json({ code: "try_later" }, { status: 429 })
  try {
    const answer = await generateSupportAnswer(row, input.data.question)
    const [current] = await db
      .update(supportAssistant)
      .set({ previewedVersion: row.version })
      .where(
        and(
          eq(supportAssistant.businessId, id),
          eq(supportAssistant.version, row.version),
          eq(supportAssistant.status, "ready"),
          eq(supportAssistant.vectorStoreId, row.vectorStoreId!),
        ),
      )
      .returning({ id: supportAssistant.businessId })
    if (!current)
      return NextResponse.json({ code: "settings_changed" }, { status: 409 })
    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json({ code: "answer_failed" }, { status: 502 })
  }
}
