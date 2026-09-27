import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { getEntitlement, PlanLimitError } from "@/lib/plan";

type Action = "discoveryJob" | "outreachMessage";
/** Shared row lock closes the check/debit race between manual actions and Agents. */
export async function reservePlanUsage(
  userId: string,
  action: Action,
  client?: PoolClient,
) {
  const { plan, limits } = await getEntitlement(userId),
    column = action === "discoveryJob" ? "discoveryJobs" : "outreachMessages",
    month = new Date().toISOString().slice(0, 7);
  const c = client ?? (await pool.connect());
  try {
    if (!client) await c.query("BEGIN");
    await c.query(
      'INSERT INTO usage ("userId") VALUES($1) ON CONFLICT DO NOTHING',
      [userId],
    );
    const {
      rows: [u],
    } = await c.query('SELECT * FROM usage WHERE "userId"=$1 FOR UPDATE', [
      userId,
    ]);
    const used =
      limits.window === "lifetime"
        ? u[column]
        : u[column + "MonthKey"] === month
          ? u[column + "Month"]
          : 0;
    if (used >= limits[column])
      throw new PlanLimitError(
        action,
        plan,
        limits.window === "lifetime" ? "lifetime" : "monthly",
      );
    await c.query(
      `UPDATE usage SET "${column}"="${column}"+1,"${column}Month"=CASE WHEN "${column}MonthKey"=$2 THEN "${column}Month"+1 ELSE 1 END,"${column}MonthKey"=$2,"updatedAt"=now() WHERE "userId"=$1`,
      [userId, month],
    );
    if (!client) await c.query("COMMIT");
  } catch (error) {
    if (!client) await c.query("ROLLBACK");
    throw error;
  } finally {
    if (!client) c.release();
  }
}
