/** Seed only a disposable local database for browser verification. */
import { randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import { eq, sql } from "drizzle-orm"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { serializeSignedCookie } from "better-call"

async function main() {
  const url = new URL(process.env.SUPPORT_TEST_DATABASE_URL ?? "")
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^\/scorelead_support_test\w*$/.test(url.pathname)) throw new Error("Refusing a non-local or non-test database")
  process.env.DATABASE_URL = url.toString()
  process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "ab".repeat(32)
  process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = "cd".repeat(32)
  const { db, pool } = await import("@/lib/db")
  const s = await import("@/lib/db/schema")
  const { encryptGitHubToken } = await import("@/lib/github/security")
  const { encryptWhatsAppToken } = await import("@/lib/whatsapp/security")
  const { recordSupportInbound, inboundAudio } = await import("@/lib/support/ingest")
  await migrate(db, { migrationsFolder: "drizzle" })
  await db.execute(sql`truncate "user" cascade`)
  const userId = randomUUID(), businessId = randomUUID(), connectionId = randomUUID()
  await db.insert(s.user).values({ id: userId, name: "Support fixture", email: "fixture@example.test", emailVerified: true, role: "admin" })
  await db.insert(s.subscription).values({ id: randomUUID(), referenceId: userId, plan: "growth", status: "active" })
  await db.insert(s.business).values({ id: businessId, userId, name: "Ceramik · teste", description: "Software para gestão de estúdios de cerâmica", onboardingCompleted: true })
  await db.insert(s.whatsappConnection).values({ id: connectionId, businessId, wabaId: "fixture-waba", phoneNumberId: "12345", displayPhoneNumber: "+5511000000000", verifiedName: "Ceramik", encryptedAccessToken: encryptWhatsAppToken("fixture-token") })
  const message = await recordSupportInbound({ connectionId, businessId, leadId: null, metaMessageId: "fixture-audio", fromPhone: "+5511000000001", messageType: "audio", textBody: null,
    receivedAt: new Date(), contactName: "Cliente de teste", media: inboundAudio({ type: "audio", audio: { id: "987", mime_type: "audio/ogg", voice: true } }) })
  const [conversation] = await db.select().from(s.supportConversation).where(eq(s.supportConversation.businessId, businessId))
  await db.update(s.whatsappInboundMessage).set({ transcript: "Oi! Seria possível exportar a lista dos meus alunos em CSV? Eu preciso levar esses dados para a contabilidade." }).where(eq(s.whatsappInboundMessage.id, message!.id))
  await db.update(s.supportConversation).set({ triageStatus: "ready", classification: "feature", summary: "O cliente pede exportação da lista de alunos em CSV para compartilhar os dados com a contabilidade.", suggestedReply: "Olá! Obrigado pela sugestão. Vou avaliar a exportação de alunos em CSV. Você precisa de quais informações no arquivo?", analyzedThroughMessageId: message!.id }).where(eq(s.supportConversation.id, conversation.id))
  await db.insert(s.supportTask).values({ id: randomUUID(), conversationId: conversation.id, sourceMessageId: message!.id,
    proposal: { title: "Adicionar exportação de alunos em CSV", description: "Permitir exportar a lista de alunos do estúdio em um arquivo CSV para uso pela contabilidade.", acceptanceCriteria: ["O arquivo respeita os filtros da lista de alunos", "Nomes com acentos são exportados corretamente"], priority: "medium", rationale: "Pedido do cliente; confirmar as colunas necessárias antes da implementação." } })
  await db.insert(s.githubConnection).values({ id: randomUUID(), businessId, owner: "example", repository: "ceramik", defaultBranch: "main", encryptedToken: encryptGitHubToken("fixture-token", businessId),
    contextPaths: ["README.md", "docs/produto.md"], contextFiles: [{ path: "README.md", sha: "fixture-sha", text: "Ceramik é um sistema de gestão de estúdios." }], projectNotes: "Não prometer prazos sem confirmação. Usar português e manter um tom acolhedor." })
  const token = randomUUID(), secret = "scorelead-support-browser-test-secret-12345"
  await db.insert(s.session).values({ id: randomUUID(), userId, token, expiresAt: new Date(Date.now() + 86_400_000) })
  const signed = await serializeSignedCookie("better-auth.session_token", token, secret, { path: "/", httpOnly: true })
  const cookieValue = decodeURIComponent(signed.split(";")[0].slice("better-auth.session_token=".length))
  await writeFile("/private/tmp/scorelead-support-browser-fixture.json", JSON.stringify({ userId, businessId, conversationId: conversation.id, cookieValue, secret }))
  await pool.end()
  console.log("Disposable support browser fixture ready")
}
void main()
