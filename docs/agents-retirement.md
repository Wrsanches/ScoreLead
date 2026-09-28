# Agents retirement

Agents UI, API, engine and the dedicated Railway worker have been removed.
Google reporting, discovery, email and WhatsApp remain available. Shared usage
reservations and email delivery fixes remain in place.

The user subsequently requested removal of Agents data from local, testing and
production. Migration 0041 removes the five agent_* tables, lead.statusRevision,
its trigger/function and whatsapp_sequence.agentExecutionId. It preserves other
business, lead, message and integration data. Existing migration files 0039 and
0040 remain immutable so fresh installs and migration history stay consistent.

## Deployment order

1. Verify no active Agents-owned discovery jobs or WhatsApp sequences exist.
2. Deploy the application without Agents schema columns or queue dependencies to
   both testing and production, while retaining database tables and columns.
3. Wait for both compatible deployments to be healthy and the old deployments
   to stop; then apply 0041 and deploy the migration to both branches.
4. Verify absence of the retired tables, columns, trigger and function, and
   verify normal lead/WhatsApp queries and application health.

Do not roll back application code to a version that references the retired
schema. Restoring that code requires restoring compatible schema first.

## Verification

The migration was first executed and rolled back against the configured local
database. Exactly five tables disappeared, the trigger was removed, and queries
using the new lead and WhatsApp ORM schemas succeeded. TypeScript, scoped ESLint
and 83 existing channel/reporting tests passed. Final environment checks verify
all five tables, both columns, the trigger and its function are absent.
