# Google reporting and Scorelead MCP

Business owners connect Google Analytics 4 and Search Console at **Integrations → Google reporting**. Each connector supports multiple Google identities and multiple selected properties. Assistants use the same hosted, read-only MCP endpoint; no plugin installation, Google service account, or Google credentials on the user's computer are needed.

## Enable in a deployment

1. Apply migration `0038_google_reporting_mcp.sql` using the existing migration pipeline (`bun run db:migrate`). The migration only adds reporting tables. Run it **before** deploying the new routes/UI. Do not use the test suite against the application database.
2. Set `BETTER_AUTH_URL` to the canonical HTTPS app URL, e.g. `https://app.scorelead.io`. HTTP is permitted only for local development. The same origin serves Google callbacks, OAuth discovery, browser consent, and MCP. Proxy/forwarded headers do not determine security-sensitive URLs.
3. In Google Cloud, enable **Google Analytics Admin API**, **Google Analytics Data API**, and **Google Search Console API**. Configure a **Web application** OAuth client and add the exact redirect URI `https://app.scorelead.io/api/google-reporting/callback` (or the local origin plus that path).
4. Set `GOOGLE_REPORTING_CLIENT_ID` and `GOOGLE_REPORTING_CLIENT_SECRET`. If **both** are absent, the existing Google sign-in client is reused, but it still needs the additional redirect URI. A dedicated reporting client is recommended so reporting consent and sign-in can be managed separately.
5. Generate an independent 32-byte key, e.g. `openssl rand -hex 32`, and set `GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY`. Keep it in the deployment's secret store. Replacing it makes existing Google credentials unreadable and requires reconnecting those accounts. Never use a `NEXT_PUBLIC_` variable for any credential.
6. Configure Google's OAuth consent screen for `openid`, `email`, `https://www.googleapis.com/auth/analytics.readonly`, and `https://www.googleapis.com/auth/webmasters.readonly`. Each connection requests only its own reporting scope. While the consent screen is in Testing, add test users; Google's testing-mode restrictions, including refresh-token expiration, still apply. Complete Google's required verification before general customer onboarding.
7. Schedule `GET /api/jobs/reporting/cleanup` daily with `Authorization: Bearer <CRON_SECRET>`, using the existing job-secret convention. This removes expired cached reports, pending authorizations, expired grants/tokens and unused registrations. The server retains used authorization-code and refresh-token records for active grants to detect replay. Do not log authorization headers, OAuth codes, request bodies on token endpoints, or Google provider payloads.
8. Test with one GA4 property and one Search Console site you control. Google account access must be granted to the properties themselves; enabling an API alone does not grant property access.

During Google's scope review, set `GOOGLE_REPORTING_ALLOWED_EMAILS` to a comma-separated list of verified ScoreLead account emails permitted to start a new Google connection. An explicitly empty value denies new connections to everyone. Both the connect endpoint and callback recheck the restriction; other users can still manage existing connections and revoke assistant access. Remove this variable only when general onboarding is ready. It does not revoke previously issued assistant authorizations.

No deployment, production migration, live Google consent or Google verification is performed by the test suite. These require the operator's Google project and accounts.

## Production setup status — September 27, 2026

The Google reporting release and migration 0038 are deployed at `https://app.scorelead.io` through the existing Railway predeploy pipeline. Google Cloud project `scorelead-492919` has the three required APIs enabled and a dedicated **ScoreLead Reporting — Production** web client with the exact callback above. Production credentials and the independent encryption key are stored in Railway. The existing Google sign-in client is unchanged.

Railway's separate `reporting-cleanup` service uses the official `curlimages/curl:8.22.0` image and a reference to the app service's `CRON_SECRET`. It calls only `/api/jobs/reporting/cleanup`, runs daily at 04:00 UTC, and exits after each request. Its manual verification run completed successfully. The main web service remains a continuously running service.

The public OAuth discovery documents and unauthenticated MCP rejection were verified against production. New Google connections remain limited by the preview email allowlist. Google's Analytics data-access verification is still pending a real demonstration video and submission; general customer onboarding must remain restricted until review and live account/client validation are complete.

## User journey

1. Open **Integrations → Google reporting** and connect a Google account separately for each desired connector.
2. Select properties, then **Save selection**. Missing access, expired tokens, empty property lists, stale edits, quota errors and reconnect controls are shown in the page. Connect a second account to add properties from another Google identity.
3. In **Connect your AI assistant**, copy the appropriate command.

```sh
codex mcp add scorelead --url https://app.scorelead.io/api/mcp
codex mcp login scorelead
```

```sh
claude mcp add --transport http --scope user scorelead https://app.scorelead.io/api/mcp
```

In Claude Code, open `/mcp` and authenticate Scorelead. In either client, the browser asks the owner to choose a business and the exact properties to share. Access is read-only, lasts 30 days, and can be revoked immediately from Integrations. New properties require a new authorization; they are not silently added to existing grants. Separate client server names can be used for separate business connections.

Example questions:

- “Compare organic website sessions last month with the previous month.”
- “Which pages lost the most Google Search clicks?”
- “Which landing pages have sessions but few configured key events?”

A standalone plugin is optional: the hosted MCP works directly in both clients.

## Tools and report semantics

| Tool                    | Inputs / behavior                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `list_connections`      | Only the business and currently selected properties explicitly approved for this authorization.                                  |
| `get_connection_status` | Connection/reconnect status, last successful Google request, and safe error codes.                                               |
| `query_analytics`       | Resource ID, explicit dates, metrics, dimensions, string dimension filters, sort, limit and offset. Checks compatibility first.  |
| `query_search_console`  | Resource ID, explicit dates, dimensions, AND filters, search type, final/all data, limit and offset.                             |
| `get_reporting_fields`  | Property-specific GA4 metadata (including custom fields), searchable and paginated; fixed Search Console fields and definitions. |

Reports are fetched on demand and cached in PostgreSQL for five minutes. Responses identify the source, dates, resource, retrieval time, whether cached, pagination, and limitations. Report tools allow 1–1,000 rows per call and date ranges up to 367 inclusive days. Clients must follow `nextOffset`; they must not mistake one page for all data. The first release supports string dimension filters in GA4, not arbitrary raw API bodies or metric-expression filters.

GA4 metadata (time zone, currency, thresholding/sampling flags and quota information) is preserved. User metrics are not additive across rows. Google key events represent the property's configuration, not automatically qualified Scorelead leads or revenue.

Search Console dates use `America/Los_Angeles`. Results are top rows, can omit anonymized queries and are not an exhaustive export even after pagination. Recent dates can be delayed/incomplete. Empty responses do not fabricate zeros. CTR is a fraction; aggregate it from clicks divided by impressions. Clicks and GA4 sessions have different definitions and time zones. Metadata returned for incomplete dates is preserved.

## Authorization and isolation

- Google OAuth state is random, encrypted-PKCE backed, session-user bound, expiring, and consumed atomically. Declined consent consumes it too. Google credentials are encrypted with AES-256-GCM and associated data binding business, provider and Google subject. Credential refresh uses database row locks across replicas.
- Only the business owner can connect Google, choose properties or delegate reporting. Platform-admin visibility elsewhere in Scorelead does not implicitly authorize Google data access or delegation.
- The reporting OAuth server is deliberately limited to public clients using authorization code + **S256 PKCE**, optional `offline_access`, and exact registered HTTPS/loopback redirects. It implements RFC 8414 discovery, RFC 9728 protected-resource metadata, RFC 7591 public dynamic registration, resource binding, and RFC 7009 revocation. It does not implement OIDC, implicit/client-credentials grants, client secrets, CIMD or arbitrary upstream OAuth proxies.
- The canonical MCP resource is `/api/mcp`. Authorization requests require its exact resource indicator. A token request cannot change that audience. Access/refresh tokens and authorization codes are opaque random values, stored only as SHA-256 hashes. They never contain Google credentials.
- Every MCP request and every tool execution rechecks access expiry, grant expiry/revocation, current business ownership and the explicitly approved resource IDs. Reports also recheck selection after upstream work. Access tokens last one hour; rotating refresh tokens cannot extend the 30-day authorization. A valid code replay or refresh-token replay revokes the grant's token family. Concurrent refresh requests intentionally fail closed: clients must serialize refreshes.
- Removing a property blocks access. Disconnecting Google deletes the connection, resources and associated report cache; reconnecting creates new resource IDs and needs new assistant approval. Local disconnect does not revoke Google's shared account-wide grant, because that could break other businesses or connectors. Users can also revoke Scorelead in their Google account.
- Google egress uses fixed API hosts. No client-controlled URLs, raw provider bodies, token passthrough, or arbitrary HTTP tools exist. Browser mutations require the exact canonical Origin. MCP accepts bearer headers, not browser cookies or query-string tokens. Non-canonical browser origins are rejected.
- Rate limits are atomic PostgreSQL buckets shared by replicas. Currently: 60 upstream operations/business/minute, 120 MCP requests/user/minute, and bounded global registration/authorization/token endpoints. Put normal abuse protection on the deployment's edge and tune limits for expected traffic. Do not trust arbitrary forwarded-IP headers.

## Tests

```sh
bun run test:reporting
bunx tsc --noEmit
bun run lint
bun run build
```

For database and protocol integration tests, create an **empty disposable local PostgreSQL database** whose name begins with `scorelead_reporting_test`. The test suite refuses other hostnames/database names, applies all migrations twice, and truncates its fixtures between cases.

```sh
REPORTING_TEST_DATABASE_URL=postgresql://localhost:5432/scorelead_reporting_test \
  bun run test:reporting:integration
```

Coverage includes signed dashboard sessions, owner/admin/other-tenant boundaries, CSRF, Google OAuth success/denial/state expiry/replay, encryption, concurrent token refresh, refresh failure persistence, multi-account selection, forged resources, stale edits, metadata and cache isolation, disconnect, OAuth discovery/DCR/PKCE via the official MCP client SDK, token/code replay, refresh rotation races, immediate revocation, owner transfer, malformed requests and quotas. Google APIs are mocked; no external messages or real credentials are used. Live provider consent and native Codex/Claude browser handoffs still need deployment credentials and an operator's account.

Official references: [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [GA4 reports](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport), [Search Console reports](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization), [Codex MCP](https://developers.openai.com/codex/mcp/), [Claude Code MCP](https://code.claude.com/docs/en/mcp).
