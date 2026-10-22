import { open, readFile } from "node:fs/promises"
import { dirname } from "node:path"
import { Pool } from "pg"
import {
  auditTokenEncryption, databaseTargetFingerprint, migrateTokenEncryption,
  restoreTokenCiphertexts, rotationPlan, TokenMigrationError, validateRotationPlan,
  type CiphertextBackup,
} from "../lib/security/token-migration"

// No credential values, plaintext tokens, email bodies, or database URLs are logged.
const args = process.argv.slice(2)
function flag(name: string) { return args.includes(name) }
function argument(name: string) {
  const index = args.indexOf(name)
  if (index < 0) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith("--")) throw new TokenMigrationError("MISSING_ARGUMENT")
  return value
}

async function main() {
  if (flag("--help")) {
    console.log("Audit (read-only): bun run keys:rotate [--plan-out PATH]\nMigrate: bun run keys:rotate --write --readers-ready --plan PATH --backup PATH\nRestore ciphertext backup: bun run keys:rotate --restore PATH --readers-ready\nRequires DATABASE_URL and existing integration encryption keys. See docs/integration-key-rotation.md.")
    return
  }
  const allowed = new Set(["--write", "--readers-ready", "--plan", "--plan-out", "--backup", "--restore"])
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new TokenMigrationError("UNKNOWN_ARGUMENT")
    if (["--plan", "--plan-out", "--backup", "--restore"].includes(args[i])) { argument(args[i]); i++ }
  }
  const write = flag("--write"), restore = argument("--restore"), planOut = argument("--plan-out")
  if ((write || restore) && !flag("--readers-ready")) throw new TokenMigrationError("DEPLOYED_READERS_CONFIRMATION_REQUIRED")
  if ((write && (restore || planOut)) || (restore && planOut) || (!write && (argument("--plan") || argument("--backup")))) throw new TokenMigrationError("INCOMPATIBLE_ARGUMENTS")
  const url = process.env.DATABASE_URL
  if (!url) throw new TokenMigrationError("DATABASE_URL_REQUIRED")
  const target = databaseTargetFingerprint(url)
  const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15000, application_name: "scorelead-key-rotation" })
  const client = await pool.connect().catch(async () => { await pool.end(); throw new TokenMigrationError("DATABASE_CONNECTION_FAILED") })
  try {
    if (restore) {
      const lines = (await readFile(restore, "utf8")).trim().split("\n").map((line) => JSON.parse(line))
      const header = lines.shift()
      if (header?.format !== "scorelead-ciphertext-backup-v1" || header.target !== target) throw new TokenMigrationError("BACKUP_TARGET_MISMATCH")
      // An interrupted run may lack a footer; compare-and-swap still restores only
      // ciphertexts that exactly match this backup's recorded replacement.
      const records = lines.filter((line) => line.type !== "committed") as CiphertextBackup[]
      console.log(JSON.stringify({ mode: "restore", target, ...await restoreTokenCiphertexts(client, records) }, null, 2))
    } else if (write) {
      const planPath = argument("--plan"), backupPath = argument("--backup")
      if (!planPath || !backupPath) throw new TokenMigrationError("PLAN_AND_BACKUP_REQUIRED")
      const plan = validateRotationPlan(JSON.parse(await readFile(planPath, "utf8")))
      // Exclusive creation prevents overwriting the only rollback copy.
      const backup = await open(backupPath, "wx", 0o600)
      let committed = false
      try {
        await backup.writeFile(JSON.stringify({ format: "scorelead-ciphertext-backup-v1", target, createdAt: new Date().toISOString() }) + "\n")
        await backup.sync()
        const directory = await open(dirname(backupPath), "r")
        try { await directory.sync() } finally { await directory.close() }
        const result = await migrateTokenEncryption(client, {
          target, plan,
          backup: async (record) => { await backup.writeFile(JSON.stringify(record) + "\n") },
          syncBackup: () => backup.sync(),
        })
        committed = true
        await backup.writeFile(JSON.stringify({ type: "committed", updated: result.updated, at: new Date().toISOString() }) + "\n")
        await backup.sync()
        console.log(JSON.stringify({ mode: "migrate", committed: true, ...result }, null, 2))
      } catch (error) {
        if (committed) throw new TokenMigrationError("COMMITTED_BUT_BACKUP_FOOTER_FAILED_AUDIT_BEFORE_RETRY")
        throw error
      } finally { await backup.close() }
    } else {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY")
      const report = await auditTokenEncryption(client, target)
      await client.query("COMMIT")
      console.log(JSON.stringify({ mode: "audit", ...report }, null, 2))
      if (planOut) {
        const plan = rotationPlan(report)
        const file = await open(planOut, "wx", 0o600)
        try { await file.writeFile(JSON.stringify(plan, null, 2) + "\n"); await file.sync() } finally { await file.close() }
      }
    }
  } finally { client.release(); await pool.end() }
}

main().catch((error: unknown) => {
  // PostgreSQL errors can include row values/connection details. Only our own
  // fixed error codes are safe to print.
  console.error(JSON.stringify({ error: error instanceof TokenMigrationError ? error.code : "KEY_ROTATION_FAILED_NO_SECRETS_LOGGED" }))
  process.exitCode = 1
})
