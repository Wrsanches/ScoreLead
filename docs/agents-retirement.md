# Agents retirement

Agents has been removed from the application: navigation, UI, API routes,
translations, React Flow dependency, automation engine and deploy scripts.
The dedicated Railway agents-worker service is removed from testing and production.

Migrations 0039 and 0040 and their schema definitions are retained to preserve
existing records and the migration chain. They are archival only. Do not remove
these migrations or drop the historical tables as part of feature removal.

The shared discovery queue excludes jobs owned by an archived agent execution.
The shared WhatsApp queue blocks sequences carrying agentExecutionId. These
retirement guards prevent old jobs from resuming through regular channel workers.
Normal discovery, email, WhatsApp and Google reporting remain available.
Shared usage reservations and email delivery fixes remain in place.

## Verification

83 existing email, WhatsApp and reporting tests pass, alongside TypeScript,
scoped ESLint and a production Webpack build. The built route manifest contains
no Agents page or API. A PostgreSQL check using connection-local temporary tables
confirms that the real discovery claim function selects a manual job and never
claims an archived automation job, even with the legacy execution flag enabled.
