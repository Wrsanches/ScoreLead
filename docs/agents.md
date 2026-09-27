# Agents operations

## Runtime and rollout

`/admin/agents` belongs to the selected business. Drafts are optimistic-versioned;
publication creates an immutable graph. Each execution retains that revision.
Default agents are manual drafts, 20 leads/search, 20 actions/day, weekdays 09–17.
Timezone must be confirmed before publication. Current-lead enrollment is opt-in;
automatic root agents start at activation (or when newly made automatic/root).
The plan's existing discovery/AI allowances and channel restrictions still apply.

Deploy the app first (`bun run db:migrate` pre-deploy), then `agents-worker`
(`bun run worker:agents`). Migrations 0039–0040 are additive. Do not reverse/drop
history tables during rollback: disable the switch and roll back application code.
`railway.agents.json` records the worker commands for legacy Config-as-Code;
Railway services using current config should set build/start commands directly.
Use the app's PostgreSQL connection, no Redis. DB sessions use UTC so legacy queue
timestamps and timezone-aware Agents timestamps remain consistent.

Set on both app and worker:

- `AGENTS_EXECUTION_ENABLED=false` initially. Missing also means disabled.
- `AGENTS_ALLOWED_BUSINESS_IDS`: optional comma-separated business IDs. Before
  the first live test, set exactly the business chosen by the user. Empty means
  unrestricted only when the global switch is explicitly true.
- Worker references the app's `DATABASE_URL`, `OPENAI_API_KEY`,
  `RESEND_TOKEN_ENCRYPTION_KEY`, `WHATSAPP_TOKEN_ENCRYPTION_KEY`, Meta and discovery
  provider variables, `SCORELEAD_APP_URL`, plus existing
  `NEXT_PUBLIC_RESEND_INTEGRATION_ENABLED`/`NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED`.
  No new customer/provider keys are generated.

One worker replica is enough initially. Independent loops update heartbeat every
30 seconds, check schedules/enrollment every minute and pump queues every 5 seconds.
Disabled workers update heartbeat only. Existing discovery/WhatsApp workers also
honor Agents pause and rollout guards for agent-owned jobs.

## Controlled live test

The user must choose a business and actual recipient(s), channel and intended
message before any live test. Older reporting-demo approvals are not outreach
approval. With the allowlist set, prepare a one-lead manual flow, inspect the AI
sample, publish with current-lead inclusion off, enable processing, run that
selected lead and inspect provider acceptance/stage/history. Pause and turn the
switch off after verifying. Never use all-matching for the first test.

## Durability and recovery

Unique business/agent/lead dedupe prevents re-enrollment across revisions and
manual/automatic entry. Discovery schedule slots dedupe a local date; only the
current eligible window is recovered, not an unlimited backlog. Claimed work
uses leases, row locks and transactional quota reservations. Provider records
use stable execution IDs; Resend receives the same idempotency key on retry.
Restart before the request boundary can retry; ambiguous sends become
`needs_review` and must be reconciled with the provider, never blindly resent.

Pause blocks new actions, not already accepted sends. Pending provider jobs can
be cancelled only before dispatch. Stage updates use status plus a monotonically
incremented revision, preserving even a later manual write of the same status.
Only accepted sends may advance New to Contacted; delivery/read remain separate.
Consent, suppression, recipient, template, owner entitlement and pause are
revalidated before sending. Replies and opt-out retain the existing WA behavior.

## Monitoring

The UI shows per-agent queued/completed/attention counts, paginated lead and event
history, prepared messages, provider status/ID and worker freshness. Heartbeat older
than 180 seconds shows offline. On-call queries (run only with authorized access):

```sql
SELECT id, "heartbeatAt", now()-"heartbeatAt" AS age FROM agent_worker;
SELECT "businessId", "agentId", status, count(*), min("createdAt") AS oldest
FROM agent_execution GROUP BY 1,2,3;
SELECT "businessId", "agentId", count(*) FILTER (WHERE "usageReserved") AS uses,
       count(*) FILTER (WHERE status='needs_review') AS uncertain
FROM agent_execution GROUP BY 1,2;
```

Investigate growing queued age, needs_review, blocked channel errors, missing
heartbeat and quota consumption. Prepared content and events follow the business
record lifecycle (foreign-key cascading deletion), not public analytics/logs.

## Verification

- `bun run test:agents`: graph, routing, filters, safe defaults.
- `AGENTS_TEST_DATABASE_URL=postgresql://localhost/scorelead_agents_test_runtime bun run test:agents:integration`:
  migrations and real PostgreSQL transactions, with all external providers mocked.
  The test refuses non-local/non-test database names and truncates only that
  disposable database. Never point it at application data.
- `bun test lib/resend lib/whatsapp`: shared renderer, suppression/security,
  templates and schedule regressions.
- `bunx tsc --noEmit`, scoped ESLint, `bun run build --webpack`.

Premium strict audit baseline: 18 existing findings in older screens, no new
Agents findings. Native time ownership is intentional as documented above.

Worker deployment uses `bash scripts/deploy-agents-worker.sh testing|production`
after committing. It packages only `git archive HEAD` and makes the worker
configuration the artifact's root `railway.json`, avoiding the web application's
start/healthcheck commands. Set the worker build/start commands in Railway too
for environments where legacy config files are ignored. The script does not
change execution flags and does not upload local credentials or test fixtures.
