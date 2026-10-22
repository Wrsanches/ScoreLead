import { expect, test } from "bun:test"
import { Pool } from "pg"
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { auditTokenEncryption, databaseTargetFingerprint, migrateTokenEncryption, restoreTokenCiphertexts, rotationPlan, type CiphertextBackup, type Keyrings } from "./token-migration"
import { decryptIntegrationValue, encryptIntegrationValue, integrationKeyring, integrationKeyVariables, type IntegrationPurpose } from "./token-encryption"

const url = process.env.ROTATION_TEST_DATABASE_URL
const integration = url ? test : test.skip

integration("real PostgreSQL: full rotation, rollback, concurrency, retirement gates and safe restore", async () => {
  const parsed = new URL(url!)
  if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || !parsed.pathname.startsWith("/scorelead_rotation_test")) throw new Error("DISPOSABLE_LOCAL_TEST_DATABASE_REQUIRED")
  const pool = new Pool({ connectionString: url, max: 2 })
  const client = await pool.connect(), concurrent = await pool.connect()
  const schema = `rotation_${Date.now()}`
  const oldVersion = process.env.TOKEN_ENCRYPTION_WRITE_VERSION
  const target = databaseTargetFingerprint(url!)
  const files = await mkdtemp(join(tmpdir(), "scorelead-rotation-test-"))
  const old: Keyrings = {}, fresh: Keyrings = {}, dual: Keyrings = {}
  for (const purpose of Object.keys(integrationKeyVariables) as IntegrationPurpose[]) {
    const name = integrationKeyVariables[purpose]
    old[purpose] = integrationKeyring(purpose, { [name]: "11".repeat(32) })
    fresh[purpose] = integrationKeyring(purpose, { [name]: "22".repeat(32) })
    dual[purpose] = { current: fresh[purpose]!.current, previous: [old[purpose]!.current] }
  }
  const encrypt = (purpose: IntegrationPurpose, context: string, version: 1 | 2 = 1, rings = old) => encryptIntegrationValue(purpose, "customer-secret", context, { version, keyring: rings[purpose] })
  try {
    await client.query(`CREATE SCHEMA "${schema}"`)
    await client.query(`SET search_path TO "${schema}"`)
    await concurrent.query(`SET search_path TO "${schema}"`)
    for (const sql of [
      'CREATE TABLE google_reporting_connection (id text PRIMARY KEY, "businessId" text, provider text, subject text, "accessTokenEncrypted" text, "refreshTokenEncrypted" text)',
      'CREATE TABLE instagram_connection (id text PRIMARY KEY, "businessId" text, "accessTokenEncrypted" text)',
      'CREATE TABLE resend_connection (id text PRIMARY KEY, "businessId" text, "apiKeyEncrypted" text, "webhookSecretEncrypted" text)',
      'CREATE TABLE whatsapp_connection (id text PRIMARY KEY, "encryptedAccessToken" text)',
      'CREATE TABLE github_connection (id text PRIMARY KEY, "businessId" text, "encryptedToken" text)',
      'CREATE TABLE github_authorization (id text PRIMARY KEY, "businessId" text, "userId" text, "encryptedToken" text)',
      'CREATE TABLE google_reporting_oauth_state ("verifierEncrypted" text, "expiresAt" timestamptz)',
      'CREATE TABLE github_oauth_state ("verifierEncrypted" text, "expiresAt" timestamptz)',
      'CREATE TABLE email_message (id text PRIMARY KEY, html text, text text)',
    ]) await client.query(sql)
    await client.query('INSERT INTO google_reporting_connection VALUES ($1,$2,$3,$4,$5,$6)', ["g", "tenant", "ga4", "subject", encrypt("reporting", "tenant:ga4:subject"), encrypt("reporting", "tenant:ga4:subject")])
    await client.query('INSERT INTO instagram_connection VALUES ($1,$2,$3)', ["i", "tenant", encrypt("instagram", "tenant")])
    await client.query('INSERT INTO resend_connection VALUES ($1,$2,$3,$4)', ["r", "tenant", encrypt("resend", "tenant"), encrypt("resend", "tenant")])
    await client.query('INSERT INTO whatsapp_connection VALUES ($1,$2)', ["w", encrypt("whatsapp", "")])
    await client.query('INSERT INTO github_connection VALUES ($1,$2,$3), ($4,$5,$6)', ["gh", "tenant", encrypt("github", "tenant"), "gh-app", "tenant", ""])
    await client.query('INSERT INTO github_authorization VALUES ($1,$2,$3,$4)', ["auth", "tenant", "user", encrypt("github", "oauth:tenant:user")])
    process.env.TOKEN_ENCRYPTION_WRITE_VERSION = "1"
    const initial = await auditTokenEncryption(client, target, old)
    expect(Object.values(initial.tables).reduce((sum, table) => sum + table.needsMigration, 0)).toBe(8)
    expect(Object.values(initial.tables).every((table) => !table.unreadable)).toBe(true)
    const plan = rotationPlan(initial)
    const backup: CiphertextBackup[] = []
    const options = { target, plan, rings: dual, backup: async (row: CiphertextBackup) => { backup.push(row) }, syncBackup: async () => {} }
    await expect(migrateTokenEncryption(client, options)).rejects.toThrow("VERSION_2_WRITERS_REQUIRED")
    process.env.TOKEN_ENCRYPTION_WRITE_VERSION = "2"
    await expect(migrateTokenEncryption(client, { ...options, rings: old })).rejects.toThrow("CURRENT_KEY_WAS_NOT_ROTATED")
    await expect(migrateTokenEncryption(client, { ...options, target: "e".repeat(64) })).rejects.toThrow("TARGET_MISMATCH")
    await client.query('INSERT INTO email_message VALUES ($1,$2,$3)', ["missing-snapshot", "No unsubscribe link", null])
    await expect(migrateTokenEncryption(client, options)).rejects.toThrow("UNSUBSCRIBE_SNAPSHOTS_REQUIRE_REVIEW")
    await client.query('DELETE FROM email_message WHERE id=$1', ["missing-snapshot"])
    // A backup failure after updates must roll back the whole transaction.
    await expect(migrateTokenEncryption(client, { ...options, syncBackup: async () => { throw new Error("disk-full") } })).rejects.toThrow("disk-full")
    expect((await auditTokenEncryption(client, target, old)).tables.google_reporting_connection.unreadable).toBe(0)
    backup.length = 0
    // Simulate a token refresh between SELECT/backup and compare-and-swap.
    let refreshed = false
    const result = await migrateTokenEncryption(client, { ...options, backup: async (row) => {
      backup.push(row)
      if (row.table === "google_reporting_connection" && !refreshed) {
        refreshed = true
        await concurrent.query('UPDATE google_reporting_connection SET "accessTokenEncrypted"=$1, "refreshTokenEncrypted"=$2 WHERE id=$3', [encrypt("reporting", "tenant:ga4:subject", 2, fresh), encrypt("reporting", "tenant:ga4:subject", 2, fresh), "g"])
      }
    } })
    expect(result.updated).toBe(5)
    expect(result.conflicts).toBe(1)
    expect(result.audit.retirementReady).toBe(true)
    expect((await auditTokenEncryption(client, target, fresh)).retirementReady).toBe(true)
    expect(JSON.stringify(backup)).not.toContain("customer-secret")
    expect((await migrateTokenEncryption(client, options)).updated).toBe(0)
    const saved = await client.query<{ encryptedToken: string }>('SELECT "encryptedToken" FROM github_authorization WHERE id=$1', ["auth"])
    expect(decryptIntegrationValue("github", saved.rows[0].encryptedToken, "oauth:tenant:user", fresh.github)).toBe("customer-secret")
    // New OAuth flows are okay; active old flows block retirement, expired ones do not.
    await client.query('INSERT INTO github_oauth_state VALUES ($1, now()+interval \'10 minutes\')', [encrypt("github", "browser-state")])
    expect((await auditTokenEncryption(client, target, dual)).retirementReady).toBe(false)
    await client.query('UPDATE github_oauth_state SET "expiresAt"=now()-interval \'1 minute\'')
    expect((await auditTokenEncryption(client, target, fresh)).retirementReady).toBe(true)
    // A changed tenant or newer ciphertext must win over rollback.
    await concurrent.query('UPDATE instagram_connection SET "businessId"=$1 WHERE id=$2', ["other-tenant", "i"])
    const restored = await restoreTokenCiphertexts(client, backup)
    expect(restored.restored).toBe(4)
    expect(restored.conflicts).toBe(2)
    const incomplete = structuredClone(backup.find((row) => row.table === "resend_connection")!)
    incomplete.context = {}
    await expect(restoreTokenCiphertexts(client, [incomplete])).rejects.toThrow("INVALID_CIPHERTEXT_BACKUP")
    // Unreadable ciphertext blocks all writes, preserving the database.
    const before = await client.query('SELECT "apiKeyEncrypted" FROM resend_connection')
    await client.query('UPDATE whatsapp_connection SET "encryptedAccessToken"=$1', ["corrupted"])
    await expect(migrateTokenEncryption(client, options)).rejects.toThrow("AUDIT_HAS_UNREADABLE_VALUES")
    expect((await client.query('SELECT "apiKeyEncrypted" FROM resend_connection')).rows).toEqual(before.rows)
    // Exercise the actual CLI, including its exclusive, durable, mode-0600 backup.
    await client.query('UPDATE whatsapp_connection SET "encryptedAccessToken"=$1', [encrypt("whatsapp", "")])
    await client.query('UPDATE instagram_connection SET "businessId"=$1', ["tenant"])
    await writeFile(join(files, "plan.json"), JSON.stringify(plan))
    const cliUrl = new URL(url!)
    cliUrl.searchParams.set("options", `-csearch_path=${schema}`)
    const env: Record<string, string | undefined> = { ...process.env, DATABASE_URL: cliUrl.toString(), TOKEN_ENCRYPTION_WRITE_VERSION: "2" }
    for (const name of Object.values(integrationKeyVariables)) {
      env[name] = "22".repeat(32)
      env[name.replace(/_KEY$/, "_PREVIOUS_KEYS")] = "11".repeat(32)
    }
    const runCli = async (args: string[]) => {
      const child = Bun.spawn([process.execPath, "run", "scripts/rotate-integration-keys.ts", ...args], { env, stdout: "pipe", stderr: "pipe" })
      const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
      return { stdout, stderr, code }
    }
    expect((await runCli(["--write"])).stderr).toContain("DEPLOYED_READERS_CONFIRMATION_REQUIRED")
    const cli = await runCli(["--write", "--readers-ready", "--plan", join(files, "plan.json"), "--backup", join(files, "backup.ndjson")])
    expect(cli.code).toBe(0)
    expect(JSON.parse(cli.stdout).committed).toBe(true)
    expect(JSON.parse(cli.stdout).audit.retirementReady).toBe(true)
    expect((await stat(join(files, "backup.ndjson"))).mode & 0o777).toBe(0o600)
    expect(await readFile(join(files, "backup.ndjson"), "utf8")).not.toContain("customer-secret")
    expect((await runCli(["--restore", join(files, "backup.ndjson"), "--readers-ready"])).code).toBe(0)
  } finally {
    if (oldVersion === undefined) delete process.env.TOKEN_ENCRYPTION_WRITE_VERSION
    else process.env.TOKEN_ENCRYPTION_WRITE_VERSION = oldVersion
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    client.release(); concurrent.release(); await pool.end()
    await rm(files, { recursive: true, force: true })
  }
}, 30000)
