import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailMessage, emailWebhookEvent, type EmailMessageStatus } from "@/lib/db/schema"
import { addSuppression, type EmailMessageRow, type ResendConnectionRow } from "@/lib/resend/data"

/**
 * Resend event payload as delivered to our endpoint. Kept structural (not the
 * SDK union) so the pure reducer below is easy to test with plain objects.
 */
export interface ResendEmailEvent {
  type: string
  created_at?: string
  data: {
    email_id?: string
    to?: string[]
    subject?: string
    tags?: Record<string, string>
    bounce?: { type?: string; subType?: string; message?: string }
    click?: { link?: string; timestamp?: string }
    failed?: { reason?: string }
  }
}

const PROGRESS_RANK: Record<string, number> = {
  sending: 0,
  accepted: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
}

const TERMINAL: ReadonlySet<string> = new Set(["bounced", "complained", "failed"])

export type MessageState = Pick<
  EmailMessageRow,
  | "status"
  | "openCount"
  | "clickCount"
  | "sentAt"
  | "deliveredAt"
  | "delayedAt"
  | "openedAt"
  | "clickedAt"
  | "bouncedAt"
  | "complainedAt"
  | "failedAt"
>

export type MessagePatch = Partial<
  Pick<
    typeof emailMessage.$inferInsert,
    | "status"
    | "openCount"
    | "clickCount"
    | "lastClickedUrl"
    | "errorCode"
    | "errorMessage"
    | "sentAt"
    | "deliveredAt"
    | "delayedAt"
    | "openedAt"
    | "clickedAt"
    | "bouncedAt"
    | "complainedAt"
    | "failedAt"
  >
>

function eventTime(event: ResendEmailEvent): Date {
  const parsed = event.created_at ? new Date(event.created_at) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

/**
 * Fold one webhook event into a message. Progress statuses only move forward
 * and never overwrite a terminal state; terminal events always win over
 * progress. Timestamps are stamped the first time only, counters every time.
 * Returns null when the event changes nothing we track.
 */
export function applyEmailEvent(message: MessageState, event: ResendEmailEvent): MessagePatch | null {
  const at = eventTime(event)
  const current = message.status
  const currentTerminal = TERMINAL.has(current)
  const patch: MessagePatch = {}

  const advance = (to: EmailMessageStatus) => {
    if (currentTerminal) return
    if ((PROGRESS_RANK[current] ?? -1) < (PROGRESS_RANK[to] ?? -1)) patch.status = to
  }
  const terminal = (to: EmailMessageStatus) => {
    // A second terminal event does not flip the status; the first one stands.
    if (!currentTerminal) patch.status = to
  }

  switch (event.type) {
    case "email.sent":
      if (!message.sentAt) patch.sentAt = at
      advance("sent")
      break
    case "email.delivered":
      if (!message.deliveredAt) patch.deliveredAt = at
      advance("delivered")
      break
    case "email.delivery_delayed":
      if (!message.delayedAt) patch.delayedAt = at
      if (!currentTerminal && (PROGRESS_RANK[current] ?? -1) < PROGRESS_RANK.delivered) {
        patch.status = "delivery_delayed"
      }
      break
    case "email.opened":
      if (!message.openedAt) patch.openedAt = at
      patch.openCount = message.openCount + 1
      advance("opened")
      break
    case "email.clicked":
      if (!message.clickedAt) patch.clickedAt = at
      patch.clickCount = message.clickCount + 1
      if (event.data.click?.link) patch.lastClickedUrl = event.data.click.link.slice(0, 2048)
      advance("clicked")
      break
    case "email.bounced": {
      if (!message.bouncedAt) patch.bouncedAt = at
      const b = event.data.bounce
      if (b) {
        patch.errorCode = [b.type, b.subType].filter(Boolean).join("/") || "bounced"
        if (b.message) patch.errorMessage = b.message.slice(0, 1000)
      }
      terminal("bounced")
      break
    }
    case "email.complained":
      if (!message.complainedAt) patch.complainedAt = at
      terminal("complained")
      break
    case "email.failed":
      if (!message.failedAt) patch.failedAt = at
      patch.errorCode = "failed"
      if (event.data.failed?.reason) patch.errorMessage = event.data.failed.reason.slice(0, 1000)
      terminal("failed")
      break
    default:
      return null
  }

  return Object.keys(patch).length > 0 ? patch : null
}

async function claimEvent(connectionId: string, svixId: string, event: ResendEmailEvent): Promise<boolean> {
  const [inserted] = await db
    .insert(emailWebhookEvent)
    .values({
      id: randomUUID(),
      connectionId,
      eventKey: `${connectionId}:${svixId}`,
      eventType: event.type,
      resendEmailId: event.data.email_id ?? null,
    })
    .onConflictDoNothing({ target: emailWebhookEvent.eventKey })
    .returning({ id: emailWebhookEvent.id })
  return !!inserted
}

async function findMessage(connectionId: string, event: ResendEmailEvent): Promise<EmailMessageRow | null> {
  if (event.data.email_id) {
    const [byResendId] = await db
      .select()
      .from(emailMessage)
      .where(and(eq(emailMessage.resendEmailId, event.data.email_id), eq(emailMessage.connectionId, connectionId)))
      .limit(1)
    if (byResendId) return byResendId
  }
  // The webhook can beat our own post-send update; our tag carries the id.
  const tagged = event.data.tags?.scorelead_message_id
  if (tagged) {
    const [byTag] = await db
      .select()
      .from(emailMessage)
      .where(and(eq(emailMessage.id, tagged), eq(emailMessage.connectionId, connectionId)))
      .limit(1)
    if (byTag) return byTag
  }
  return null
}

export async function processResendWebhook(
  connection: ResendConnectionRow,
  event: ResendEmailEvent,
  svixId: string,
): Promise<{ handled: boolean }> {
  if (!(await claimEvent(connection.id, svixId, event))) return { handled: false }
  const message = await findMessage(connection.id, event)
  if (!message) return { handled: false }

  const patch = applyEmailEvent(message, event)
  const update: MessagePatch & { resendEmailId?: string; updatedAt: Date } = {
    ...(patch ?? {}),
    updatedAt: new Date(),
  }
  if (!message.resendEmailId && event.data.email_id) update.resendEmailId = event.data.email_id
  await db.update(emailMessage).set(update).where(eq(emailMessage.id, message.id))

  if (patch?.status === "bounced" || patch?.status === "complained") {
    await addSuppression({
      businessId: message.businessId,
      email: message.toEmail,
      reason: patch.status,
      messageId: message.id,
    })
  }
  return { handled: true }
}
