import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  // Legacy queue timestamps store UTC without an explicit zone.
  options: "-c timezone=UTC",
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  // Don't hold a request hostage when the pool is saturated.
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
})

export const db = drizzle(pool)
