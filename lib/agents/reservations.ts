import { reservePlanUsage } from "@/lib/usage-reservation";
import { transaction, AgentError } from "./store";
/** Reservation and shared quota debit commit together; retries never debit twice. */
export async function reserveUsage(
  executionId: string,
  lease: string,
  ownerId: string,
  action: "discoveryJobs" | "outreachMessages",
) {
  await transaction(async (c) => {
    const {
      rows: [e],
    } = await c.query(
      'SELECT "usageReserved" FROM agent_execution WHERE id=$1 AND lease=$2 FOR UPDATE',
      [executionId, lease],
    );
    if (!e) throw new AgentError("LEASE_LOST");
    if (e.usageReserved) return;
    await reservePlanUsage(
      ownerId,
      action === "discoveryJobs" ? "discoveryJob" : "outreachMessage",
      c,
    );
    await c.query(
      'UPDATE agent_execution SET "usageReserved"=true WHERE id=$1',
      [executionId],
    );
  });
}
