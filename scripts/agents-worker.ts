import { randomUUID } from "node:crypto";
import { pool } from "../lib/db";
import { pumpAgents, scheduleAgents } from "../lib/agents/worker";

const id = process.env.RAILWAY_REPLICA_ID ?? randomUUID();
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
console.info(
  "agents-worker started; execution",
  process.env.AGENTS_EXECUTION_ENABLED === "true" ? "enabled" : "disabled",
);
async function loop(
  interval: number,
  task: () => Promise<unknown>,
  always = false,
) {
  while (!stopping) {
    try {
      if (always || process.env.AGENTS_EXECUTION_ENABLED === "true")
        await task();
    } catch (error) {
      console.error(
        "agents-worker cycle failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    await Bun.sleep(interval);
  }
}
async function main() {
  await Promise.all([
    loop(
      30_000,
      () =>
        pool.query(
          'INSERT INTO agent_worker (id,"heartbeatAt") VALUES($1,now()) ON CONFLICT(id) DO UPDATE SET "heartbeatAt"=now()',
          [id],
        ),
      true,
    ),
    loop(60_000, scheduleAgents),
    loop(5000, pumpAgents),
    loop(5000, async () =>
      (await import("../lib/jobs/discovery-queue")).processDiscoveryQueue(),
    ),
    loop(5000, async () =>
      (await import("../lib/jobs/whatsapp-queue")).processWhatsAppQueue(),
    ),
  ]);
  await pool.end();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
