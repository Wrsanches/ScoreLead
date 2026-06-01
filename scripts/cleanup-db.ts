/**
 * Resets the database to a clean state by truncating every table.
 *
 *   bun run scripts/cleanup-db.ts          # dry run: shows row counts, wipes nothing
 *   bun run scripts/cleanup-db.ts --yes    # actually truncates all tables
 *
 * This wipes EVERYTHING, including user accounts/sessions, so you will need to
 * register and log in again afterwards. It does NOT touch the S3 bucket.
 */
import { Pool } from "pg"

// Every table in lib/db/schema.ts. CASCADE handles FK order, RESTART IDENTITY
// resets any sequences so the reset is truly clean.
const TABLES = [
  "session",
  "account",
  "verification",
  "lead",
  "discovery_job",
  "saved_search",
  "content_post",
  "business",
  "user",
] as const

async function main() {
  const confirmed = process.argv.includes("--yes")
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: url })

  // Show current counts so it's obvious what is about to be wiped.
  console.log(`Target database: ${url.replace(/:[^:@/]+@/, ":****@")}\n`)
  for (const table of TABLES) {
    try {
      const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM "${table}"`)
      console.log(`  ${table.padEnd(14)} ${rows[0].n} rows`)
    } catch (e) {
      console.log(`  ${table.padEnd(14)} (missing: ${(e as Error).message})`)
    }
  }

  if (!confirmed) {
    console.log(
      "\nDry run. Nothing was deleted. Re-run with --yes to truncate all tables.",
    )
    await pool.end()
    return
  }

  const list = TABLES.map((t) => `"${t}"`).join(", ")
  console.log(`\nTruncating: ${list} ...`)
  await pool.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
  console.log("Done. Database is at a clean state.")
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
