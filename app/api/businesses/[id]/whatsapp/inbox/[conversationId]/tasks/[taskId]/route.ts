import { and, eq, inArray, sql } from "drizzle-orm"
import { after, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supportTask, supportConversation } from "@/lib/db/schema"
import { taskDecisionSchema } from "@/lib/support/contracts"
import { getSupportConversation, publicSupportTask } from "@/lib/support/data"
import { queueSupportTriage, processSupportQueue } from "@/lib/support/queue"
import { publishSupportTask, dispatchSupportTask, SupportTaskError } from "@/lib/support/tasks"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"
import { GitHubError } from "@/lib/github/client"

export const maxDuration = 300
export async function POST(request: Request, { params }: { params: Promise<{ id: string; conversationId: string; taskId: string }> }) {
  const { id, conversationId, taskId } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error
  const conversation = await getSupportConversation(id, scoped.connection.id, conversationId)
  if (!conversation) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 })
  const [task] = await db.select().from(supportTask).where(and(eq(supportTask.id, taskId), eq(supportTask.conversationId, conversationId))).limit(1)
  if (!task) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 })
  const parsed = taskDecisionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 })
  const input = parsed.data
  try {
    if (input.action === "publish" || input.action === "reconcile") {
      const updated = await publishSupportTask(task, id, input.action === "reconcile")
      // Populate the initial dispatch state only once.
      await db.update(supportTask).set({ codexStatus: "not_requested" }).where(and(eq(supportTask.id, taskId), sql`${supportTask.codexStatus} is null`))
      return NextResponse.json({ task: publicSupportTask(updated) })
    }
    if (input.action === "codex") return NextResponse.json({ task: publicSupportTask(await dispatchSupportTask(task, id)) })
    const [updated] = await db.transaction(async (tx) => {
      // Serialize review with inference so an in-flight model cannot replace
      // the proposal that the human approved or rejected.
      const [locked] = await tx.select({ id: supportConversation.id }).from(supportConversation)
        .where(and(eq(supportConversation.id, conversationId), sql`${supportConversation.triageStatus} <> 'processing'`)).for("update")
      if (!locked) throw new SupportTaskError("TRIAGE_BUSY")
      return tx.update(supportTask).set({
        ...(input.action === "approve" ? { status: "approved", proposal: input.proposal } : { status: "rejected", rejectionReason: input.reason }),
        reviewedByUserId: scoped.session.user.id, reviewedAt: new Date(), updatedAt: new Date(),
      }).where(and(eq(supportTask.id, taskId), eq(supportTask.conversationId, conversationId),
        input.action === "approve" ? eq(supportTask.status, "proposed") : inArray(supportTask.status, ["proposed", "approved"]))).returning()
    })
    if (!updated) throw new SupportTaskError("TASK_STATE_CHANGED")
    if (input.action === "reject") {
      await queueSupportTriage(conversationId)
      after(() => processSupportQueue({ conversationId, maxItems: 1 }))
    }
    return NextResponse.json({ task: publicSupportTask(updated) })
  } catch (error) {
    return NextResponse.json({ code: error instanceof SupportTaskError || error instanceof GitHubError ? error.code : "TASK_ACTION_FAILED" }, { status: error instanceof SupportTaskError || error instanceof GitHubError ? error.status : 502 })
  }
}
