import { randomUUID } from "node:crypto"
import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { business, supportConversation, supportTask, user, whatsappConnection, whatsappInboundMessage } from "@/lib/db/schema"
import { getGitHubConnection, githubToken } from "@/lib/github/data"
import { RepositoryContext } from "@/lib/github/repository-context"
import { GitHubError } from "@/lib/github/client"
import type { RepositoryEvidence } from "@/lib/github/contracts"
import { can, getUserPlan } from "@/lib/plan"
import { generateSupportTriage, transcribeSupportAudio } from "@/lib/support/ai"
import { downloadWhatsAppAudio } from "@/lib/whatsapp/meta"
import { decryptWhatsAppToken } from "@/lib/whatsapp/security"

export async function queueSupportTriage(conversationId: string): Promise<boolean> {
  const [queued] = await db.update(supportConversation).set({
    triageStatus: "queued", attemptCount: 0, retryAt: new Date(), errorCode: null, updatedAt: new Date(),
  }).where(and(eq(supportConversation.id, conversationId), sql`${supportConversation.triageStatus} <> 'processing'`)).returning({ id: supportConversation.id })
  return !!queued
}

async function claimConversation(conversationId?: string) {
  const token = randomUUID()
  const result = await db.execute<{ id: string }>(sql`
    update support_conversation set "triageStatus" = 'processing', "processingToken" = ${token},
      "processingStartedAt" = now(), "attemptCount" = "attemptCount" + 1
    where id = (
      select conversation.id from support_conversation conversation
      inner join whatsapp_connection connection on connection.id = conversation."connectionId"
      where conversation."triageStatus" = 'queued' and connection.status = 'connected'
        and conversation."attemptCount" < 3
        and (conversation."retryAt" is null or conversation."retryAt" <= now())
        ${conversationId ? sql`and conversation.id = ${conversationId}` : sql``}
      order by conversation."updatedAt" limit 1 for update of conversation skip locked
    ) returning id
  `)
  return result.rows[0] ? { id: result.rows[0].id, token } : null
}

async function analyzeConversation(id: string, token: string) {
  const [row] = await db.select({ conversation: supportConversation, connection: whatsappConnection, profile: business, owner: user.id })
    .from(supportConversation).innerJoin(whatsappConnection, eq(whatsappConnection.id, supportConversation.connectionId))
    .innerJoin(business, eq(business.id, supportConversation.businessId)).innerJoin(user, eq(user.id, business.userId))
    .where(and(eq(supportConversation.id, id), eq(supportConversation.processingToken, token))).limit(1)
  if (!row) return
  const { conversation, connection, profile } = row
  const ownership = and(eq(supportConversation.id, id), eq(supportConversation.processingToken, token))
  try {
    if (!can(await getUserPlan(row.owner), "whatsappAutomation")) throw new Error("PLAN_LIMIT")
    if (!process.env.OPENAI_API_KEY) throw new Error("AI_NOT_CONFIGURED")
    const [messages, github, [decision]] = await Promise.all([
      db.select().from(whatsappInboundMessage).where(eq(whatsappInboundMessage.conversationId, id))
        .orderBy(desc(whatsappInboundMessage.receivedAt), desc(whatsappInboundMessage.createdAt), desc(whatsappInboundMessage.id)).limit(30),
      getGitHubConnection(conversation.businessId),
      db.select({ status: supportTask.status, reason: supportTask.rejectionReason }).from(supportTask)
        .where(eq(supportTask.sourceMessageId, conversation.lastMessageId)).limit(1),
    ])
    const audioStarted = Date.now()
    for (const message of messages) {
      if (message.messageType !== "audio" || message.transcript || !message.mediaId || message.transcriptionError) continue
      // Process long histories in bounded batches, preserving completed
      // transcripts for the next pass instead of losing work to a timeout.
      if (Date.now() - audioStarted > 100_000) {
        await db.update(supportConversation).set({ triageStatus: "queued", processingToken: null,
          processingStartedAt: null, attemptCount: 0, retryAt: new Date(), updatedAt: new Date(),
        }).where(ownership)
        return
      }
      try {
        const audio = await downloadWhatsAppAudio({ mediaId: message.mediaId, phoneNumberId: connection.phoneNumberId,
          accessToken: decryptWhatsAppToken(connection.encryptedAccessToken!), expectedSha256: message.mediaSha256 })
        message.transcript = await transcribeSupportAudio(audio.bytes, audio.mimeType)
        message.transcriptionError = null
      } catch (error) {
        message.transcriptionError = error instanceof Error && error.message.startsWith("AUDIO_") ? error.message : "AUDIO_TRANSCRIPTION_FAILED"
      }
      await db.update(whatsappInboundMessage).set({ transcript: message.transcript, transcriptionError: message.transcriptionError }).where(eq(whatsappInboundMessage.id, message.id))
    }
    let repositoryContext: RepositoryContext | undefined
    let repositoryEvidence: RepositoryEvidence | null = null
    if (github) {
      try {
        repositoryContext = await RepositoryContext.open(await githubToken(github), github.owner, github.repository, github.defaultBranch)
        repositoryEvidence = repositoryContext.evidence
      } catch (error) {
        repositoryEvidence = { repository: `${github.owner}/${github.repository}`, branch: github.defaultBranch, commit: null,
          status: "unavailable", errorCode: error instanceof GitHubError ? error.code : "GITHUB_CONTEXT_UNAVAILABLE", files: [] }
      }
    }
    const triage = await generateSupportTriage({
      businessProfile: { name: profile.name, description: profile.description, services: profile.services,
        persona: profile.persona, language: profile.language, website: profile.website, businessModel: profile.businessModel },
      projectNotes: github?.projectNotes ?? "", repository: github ? `${github.owner}/${github.repository}` : null,
      contextFiles: github?.contextFiles ?? [],
      contextSyncedAt: github?.contextSyncedAt.toISOString(), repositoryAccess: repositoryEvidence,
      messages: messages.reverse().map((message) => {
        const text = message.transcript ?? message.textBody
        return { type: message.messageType, text: text ? text.length > 6000 ? `${text.slice(0, 6000)}\n[Message truncated; consult full conversation before acting.]` : text : null,
          receivedAt: message.receivedAt.toISOString() }
      }),
      taskDecision: decision ?? null,
    }, undefined, repositoryContext)
    await db.transaction(async (tx) => {
      // A new inbound message during inference invalidates this result. It
      // must never overwrite a newer reply or generate an obsolete task.
      const [updated] = await tx.update(supportConversation).set({
        triageStatus: "ready", classification: triage.classification, summary: triage.summary,
        suggestedReply: triage.suggestedReply, analyzedThroughMessageId: conversation.lastMessageId,
        repositoryEvidence,
        processingToken: null, processingStartedAt: null, errorCode: null, retryAt: null, updatedAt: new Date(),
      }).where(and(ownership, eq(supportConversation.lastMessageId, conversation.lastMessageId))).returning({ id: supportConversation.id })
      if (!updated) {
        await tx.update(supportConversation).set({ triageStatus: "queued", processingToken: null, processingStartedAt: null, attemptCount: 0 }).where(ownership)
        return
      }
      if (triage.task && (!decision || decision.status === "proposed")) {
        await tx.insert(supportTask).values({ id: randomUUID(), conversationId: id, sourceMessageId: conversation.lastMessageId, proposal: triage.task })
          .onConflictDoUpdate({ target: supportTask.sourceMessageId, set: { proposal: triage.task, updatedAt: new Date() }, setWhere: eq(supportTask.status, "proposed") })
      }
    })
  } catch (error) {
    const code = error instanceof Error && ["AI_NOT_CONFIGURED", "PLAN_LIMIT"].includes(error.message) ? error.message : "TRIAGE_FAILED"
    const retryable = code === "TRIAGE_FAILED" && conversation.attemptCount < 3
    await db.update(supportConversation).set({ triageStatus: retryable ? "queued" : "failed",
      errorCode: code, retryAt: new Date(Date.now() + 60_000), processingToken: null, processingStartedAt: null, updatedAt: new Date(),
    }).where(ownership)
  }
}

export async function processSupportQueue(options: { conversationId?: string; maxItems?: number } = {}) {
  await db.execute(sql`update support_conversation set "triageStatus" = case when "attemptCount" < 3 then 'queued' else 'failed' end,
    "processingToken" = null, "processingStartedAt" = null, "errorCode" = 'TRIAGE_INTERRUPTED'
    where "triageStatus" = 'processing' and "processingStartedAt" < now() - interval '10 minutes'`)
  const started = Date.now()
  for (let i = 0; i < (options.maxItems ?? 2) && Date.now() - started < 180_000; i++) {
    const claimed = await claimConversation(options.conversationId)
    if (!claimed) break
    await analyzeConversation(claimed.id, claimed.token)
  }
}
