import { createHash } from "node:crypto"
import type { PoolClient, QueryResult } from "pg"
import { hasStoredUnsubscribeLink } from "@/lib/resend/security"
import {
  decryptIntegrationValue, encryptIntegrationValue, integrationEnvelopeKeyId,
  integrationKeyring, integrationKeyVariables, integrationWriteVersion,
  type IntegrationKeyring, type IntegrationPurpose,
} from "./token-encryption"

type Row = Record<string, string | null>
type Target = {
  table: string
  purpose: IntegrationPurpose
  contextColumns: string[]
  fields: string[]
  context: (row: Row) => string
}
const targets: Target[] = [
  { table: "google_reporting_connection", purpose: "reporting", contextColumns: ["businessId", "provider", "subject"], fields: ["accessTokenEncrypted", "refreshTokenEncrypted"], context: (r) => `${r.businessId}:${r.provider}:${r.subject}` },
  { table: "instagram_connection", purpose: "instagram", contextColumns: ["businessId"], fields: ["accessTokenEncrypted"], context: (r) => r.businessId! },
  { table: "resend_connection", purpose: "resend", contextColumns: ["businessId"], fields: ["apiKeyEncrypted", "webhookSecretEncrypted"], context: (r) => r.businessId! },
  { table: "whatsapp_connection", purpose: "whatsapp", contextColumns: [], fields: ["encryptedAccessToken"], context: () => "" },
  { table: "github_connection", purpose: "github", contextColumns: ["businessId"], fields: ["encryptedToken"], context: (r) => r.businessId! },
  { table: "github_authorization", purpose: "github", contextColumns: ["businessId", "userId"], fields: ["encryptedToken"], context: (r) => `oauth:${r.businessId}:${r.userId}` },
]
export type Keyrings = Partial<Record<IntegrationPurpose, IntegrationKeyring>>
export type RotationPlan = { version: 1; target: string; keyIds: Partial<Record<IntegrationPurpose, string>> }
export type CiphertextBackup = {
  table: string
  id: string
  context: Row
  before: Row
  after: Row
}
type TableReport = { rows: number; ciphertexts: number; needsMigration: number; unreadable: number }
export type TokenAudit = {
  target: string
  writeVersion: number
  keyIds: Partial<Record<IntegrationPurpose, string>>
  tables: Record<string, TableReport>
  activeOAuthStatesNeedingPreviousKey: number
  invalidActiveOAuthStates: number
  unsubscribeMessages: number
  unsubscribeMessagesWithoutStoredLink: number
  retirementReady: boolean
}

export class TokenMigrationError extends Error {
  constructor(public readonly code: string) { super(code) }
}

const identifier = (value: string) => `"${value.replace(/"/g, '""')}"`

export function databaseTargetFingerprint(url: string) {
  const parsed = new URL(url)
  // Credentials never form part of the report, plan, or backup identity.
  return createHash("sha256").update(`${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`).digest("hex")
}

export function configuredIntegrationKeyrings(): Keyrings {
  const rings: Keyrings = {}
  for (const purpose of Object.keys(integrationKeyVariables) as IntegrationPurpose[]) {
    const name = integrationKeyVariables[purpose]
    if (!process.env[name] && !(purpose === "github" && process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY)) continue
    rings[purpose] = integrationKeyring(purpose)
  }
  return rings
}

function keyIds(rings: Keyrings) {
  return Object.fromEntries(Object.entries(rings).map(([purpose, ring]) => [purpose, ring.current.id]))
}

async function* pages(client: PoolClient, table: string, columns: string[], primaryKey = "id") {
  let cursor: string | null = null
  while (true) {
    const result: QueryResult<Row> = await client.query<Row>(
      `SELECT ${[primaryKey, ...columns].map(identifier).join(", ")} FROM ${identifier(table)} WHERE ($1::text IS NULL OR ${identifier(primaryKey)} > $1) ORDER BY ${identifier(primaryKey)} LIMIT 250`,
      [cursor],
    )
    if (!result.rows.length) return
    yield result.rows
    cursor = result.rows[result.rows.length - 1][primaryKey]!
  }
}

export async function auditTokenEncryption(client: PoolClient, target: string, rings = configuredIntegrationKeyrings()): Promise<TokenAudit> {
  const report: TokenAudit = {
    target, writeVersion: integrationWriteVersion(), keyIds: keyIds(rings), tables: {},
    activeOAuthStatesNeedingPreviousKey: 0, invalidActiveOAuthStates: 0,
    unsubscribeMessages: 0, unsubscribeMessagesWithoutStoredLink: 0, retirementReady: false,
  }
  for (const spec of targets) {
    const stats: TableReport = { rows: 0, ciphertexts: 0, needsMigration: 0, unreadable: 0 }
    report.tables[spec.table] = stats
    for await (const batch of pages(client, spec.table, [...spec.contextColumns, ...spec.fields])) {
      for (const row of batch) {
        stats.rows++
        for (const field of spec.fields) {
          const value = row[field]
          if (!value) continue // Includes GitHub App connections without a saved personal token.
          stats.ciphertexts++
          try {
            const ring = rings[spec.purpose]
            if (!ring) throw new TokenMigrationError("MISSING_KEY")
            decryptIntegrationValue(spec.purpose, value, spec.context(row), ring)
            if (integrationEnvelopeKeyId(value, spec.purpose) !== ring.current.id) stats.needsMigration++
          } catch { stats.unreadable++ }
        }
      }
    }
  }
  // State verifiers are bound to the raw browser state, which is deliberately
  // not stored. Wait for these ten-minute flows instead of trying to rewrite them.
  for (const [table, purpose] of [["google_reporting_oauth_state", "reporting"], ["github_oauth_state", "github"]] as const) {
    const { rows } = await client.query<{ verifierEncrypted: string }>(
      `SELECT "verifierEncrypted" FROM ${identifier(table)} WHERE "expiresAt" > now()`,
    )
    for (const row of rows) {
      try {
        const id = integrationEnvelopeKeyId(row.verifierEncrypted, purpose)
        if (!rings[purpose] || id !== rings[purpose]!.current.id) report.activeOAuthStatesNeedingPreviousKey++
      } catch { report.invalidActiveOAuthStates++ }
    }
  }
  for await (const batch of pages(client, "email_message", ["html", "text"])) {
    for (const row of batch) {
      report.unsubscribeMessages++
      if (!hasStoredUnsubscribeLink({ id: row.id!, html: row.html!, text: row.text })) report.unsubscribeMessagesWithoutStoredLink++
    }
  }
  report.retirementReady = report.writeVersion === 2 && Object.values(report.tables).every((s) => !s.unreadable && !s.needsMigration)
    && !report.activeOAuthStatesNeedingPreviousKey && !report.invalidActiveOAuthStates && !report.unsubscribeMessagesWithoutStoredLink
  return report
}

export function rotationPlan(report: TokenAudit): RotationPlan {
  if (Object.values(report.tables).some((table) => table.unreadable)) throw new TokenMigrationError("AUDIT_HAS_UNREADABLE_VALUES")
  return { version: 1, target: report.target, keyIds: report.keyIds }
}

export function validateRotationPlan(value: unknown): RotationPlan {
  if (!value || typeof value !== "object") throw new TokenMigrationError("INVALID_ROTATION_PLAN")
  const plan = value as RotationPlan
  if (plan.version !== 1 || !/^[a-f\d]{64}$/.test(plan.target) || !plan.keyIds || typeof plan.keyIds !== "object"
    || Array.isArray(plan.keyIds)
    || Object.entries(plan.keyIds).some(([purpose, id]) => !Object.hasOwn(integrationKeyVariables, purpose) || typeof id !== "string" || !/^[a-f\d]{32}$/.test(id)))
    throw new TokenMigrationError("INVALID_ROTATION_PLAN")
  return plan
}

async function compareAndSwap(client: PoolClient, spec: Target, id: string, context: Row, before: Row, after: Row) {
  const fields = Object.keys(after)
  const conditions = { id, ...context, ...before }
  const entries = Object.entries(conditions)
  const result = await client.query(
    `UPDATE ${identifier(spec.table)} SET ${fields.map((field, index) => `${identifier(field)} = $${index + 1}`).join(", ")} WHERE ${entries.map(([field], index) => `${identifier(field)} IS NOT DISTINCT FROM $${fields.length + index + 1}`).join(" AND ")}`,
    [...fields.map((field) => after[field]), ...entries.map(([, value]) => value)],
  )
  return result.rowCount === 1
}

/** Pre-commit failures roll back; an ambiguous commit requires a fresh audit. */
export async function migrateTokenEncryption(client: PoolClient, options: {
  target: string
  plan: RotationPlan
  backup: (record: CiphertextBackup) => Promise<void>
  syncBackup: () => Promise<void>
  rings?: Keyrings
}) {
  const rings = options.rings ?? configuredIntegrationKeyrings()
  validateRotationPlan(options.plan)
  if (integrationWriteVersion() !== 2) throw new TokenMigrationError("VERSION_2_WRITERS_REQUIRED")
  if (options.plan.version !== 1 || options.plan.target !== options.target) throw new TokenMigrationError("ROTATION_PLAN_TARGET_MISMATCH")
  for (const [purpose, oldId] of Object.entries(options.plan.keyIds) as [IntegrationPurpose, string][]) {
    if (!rings[purpose] || rings[purpose]!.current.id === oldId) throw new TokenMigrationError("CURRENT_KEY_WAS_NOT_ROTATED")
    if (!rings[purpose]!.previous.some((key) => key.id === oldId)) throw new TokenMigrationError("OLD_KEY_FROM_PLAN_NOT_AVAILABLE")
  }
  await client.query("BEGIN")
  let updated = 0, conflicts = 0
  let committing = false
  let audit: TokenAudit
  try {
    await client.query("SET LOCAL lock_timeout = '5s'")
    await client.query("SET LOCAL statement_timeout = '60s'")
    const lock = await client.query<{ locked: boolean }>("SELECT pg_try_advisory_xact_lock(728463902) AS locked")
    if (!lock.rows[0].locked) throw new TokenMigrationError("ROTATION_ALREADY_RUNNING")
    const beforeAudit = await auditTokenEncryption(client, options.target, rings)
    if (Object.values(beforeAudit.tables).some((table) => table.unreadable)) throw new TokenMigrationError("AUDIT_HAS_UNREADABLE_VALUES")
    if (beforeAudit.unsubscribeMessagesWithoutStoredLink) throw new TokenMigrationError("UNSUBSCRIBE_SNAPSHOTS_REQUIRE_REVIEW")
    for (const spec of targets) {
      for await (const batch of pages(client, spec.table, [...spec.contextColumns, ...spec.fields])) {
        for (const row of batch) {
          const before: Row = {}, after: Row = {}
          const ring = rings[spec.purpose]
          for (const field of spec.fields) {
            const value = row[field]
            if (!value) continue
            if (!ring) throw new TokenMigrationError("MISSING_KEY")
            const plaintext = decryptIntegrationValue(spec.purpose, value, spec.context(row), ring)
            if (integrationEnvelopeKeyId(value, spec.purpose) === ring.current.id) continue
            before[field] = value
            after[field] = encryptIntegrationValue(spec.purpose, plaintext, spec.context(row), { version: 2, keyring: ring })
            if (decryptIntegrationValue(spec.purpose, after[field]!, spec.context(row), { current: ring.current, previous: [] }) !== plaintext)
              throw new TokenMigrationError("REENCRYPTION_VERIFICATION_FAILED")
          }
          if (!Object.keys(after).length) continue
          // Also compare unchanged token/context fields: a concurrent reconnect
          // or refresh wins rather than being overwritten by this migration.
          const context = Object.fromEntries([...spec.contextColumns, ...spec.fields.filter((field) => !(field in before))].map((field) => [field, row[field]]))
          const backup = { table: spec.table, id: row.id!, context, before, after }
          await options.backup(backup)
          if (await compareAndSwap(client, spec, row.id!, context, before, after)) updated++
          else conflicts++
        }
      }
    }
    audit = await auditTokenEncryption(client, options.target, rings)
    await options.syncBackup() // Durable ciphertext backup before committing any changes.
    committing = true
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    if (committing) throw new TokenMigrationError("COMMIT_OUTCOME_UNKNOWN_AUDIT_BEFORE_RETRY")
    throw error
  }
  return { updated, conflicts, audit }
}

export async function restoreTokenCiphertexts(client: PoolClient, records: CiphertextBackup[]) {
  let restored = 0, conflicts = 0
  let committing = false
  await client.query("BEGIN")
  try {
    await client.query("SET LOCAL lock_timeout = '5s'")
    const lock = await client.query<{ locked: boolean }>("SELECT pg_try_advisory_xact_lock(728463902) AS locked")
    if (!lock.rows[0].locked) throw new TokenMigrationError("ROTATION_ALREADY_RUNNING")
    for (const record of [...records].reverse()) {
      const spec = targets.find((target) => target.table === record.table)
      const expectedContext = spec && record.before ? [...spec.contextColumns, ...spec.fields.filter((field) => !(field in record.before))] : []
      if (!spec || typeof record.id !== "string" || !record.context || !record.before || !record.after
        || Object.keys(record.before).length === 0
        || Object.keys(record.before).some((field) => !spec.fields.includes(field) || typeof record.before[field] !== "string")
        || Object.keys(record.after).sort().join() !== Object.keys(record.before).sort().join()
        || Object.values(record.after).some((value) => typeof value !== "string")
        || Object.keys(record.context).sort().join() !== expectedContext.sort().join()
        || Object.values(record.context).some((value) => value !== null && typeof value !== "string"))
        throw new TokenMigrationError("INVALID_CIPHERTEXT_BACKUP")
      if (await compareAndSwap(client, spec, record.id, record.context, record.after, record.before)) restored++
      else conflicts++
    }
    committing = true
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    if (committing) throw new TokenMigrationError("COMMIT_OUTCOME_UNKNOWN_AUDIT_BEFORE_RETRY")
    throw error
  }
  return { restored, conflicts }
}
