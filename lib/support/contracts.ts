import { z } from "zod"

export const supportTaskProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(6000),
  acceptanceCriteria: z.array(z.string().min(1).max(500)).min(1).max(10),
  priority: z.enum(["low", "medium", "high"]),
  rationale: z.string().min(1).max(2000),
})

export const supportTriageSchema = z.object({
  classification: z.enum(["question", "support", "bug", "feature", "other"]),
  summary: z.string().min(1).max(1000),
  suggestedReply: z.string().min(1).max(5000),
  task: supportTaskProposalSchema.nullable(),
})

export type SupportTriage = z.infer<typeof supportTriageSchema>
export type SupportMessageView = {
  id: string; messageType: string; textBody: string | null; transcript: string | null
  transcriptionError: string | null; receivedAt: string; hasAudio: boolean; isVoiceNote: boolean
}
export type SupportTaskView = {
  id: string; sourceMessageId: string; proposal: z.infer<typeof supportTaskProposalSchema>
  status: string; rejectionReason: string | null; githubIssueUrl: string | null
  githubIssueNumber: number | null; githubRepository: string | null; codexStatus: string | null
  errorCode: string | null
}
export type SupportConversationView = {
  id: string; fromPhone: string; contactName: string | null; lastMessageId: string
  lastMessageAt: string; pending: boolean; triageStatus: string; classification: string | null
  summary: string | null; suggestedReply: string | null; analyzedThroughMessageId: string | null
  errorCode: string | null; preview: string | null; messageType: string
}

/** Resolve only the exact message the operator had on screen. */
export function isConversationPending(lastMessageId: string, respondedThroughMessageId: string | null): boolean {
  return lastMessageId !== respondedThroughMessageId
}

export const conversationUpdateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("responded"), messageId: z.string().uuid() }),
  z.object({ action: z.literal("pending") }),
  z.object({ action: z.literal("save_reply"), messageId: z.string().uuid(), suggestedReply: z.string().trim().min(1).max(5000) }),
])

export const taskDecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), proposal: supportTaskProposalSchema }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(1).max(2000) }),
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("reconcile") }),
  z.object({ action: z.literal("codex") }),
])
