# GitHub-backed WhatsApp support

Each business can authorize a GitHub repository, choose repository-relative files or directories, index them for retrieval, preview an answer, and explicitly activate replies. The assistant is disabled by default. Existing marketing template sequences remain separate and still pause on customer replies.

## Register the GitHub App (ScoreLead operator, once)

Create a **public GitHub App**, installable by customers on their accounts/organizations:

- Repository permissions: **Contents: read-only**, Metadata: read-only. No write or organization permissions.
- Callback URL: `https://app.scorelead.io/api/github/callback` (or the same path on the configured `SCORELEAD_APP_URL` in a separate development app).
- Webhook URL: `https://app.scorelead.io/api/webhooks/github`.
- Subscribe to **Push**, **Installation**, and **Installation repositories**. GitHub automatically delivers authorization revocation events.
- Generate a private key and an OAuth client secret. Set `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY`, and `GITHUB_WEBHOOK_SECRET` in server secrets.
- Generate an independent 32-byte base64 `SUPPORT_TOKEN_ENCRYPTION_KEY` with `openssl rand -base64 32`.

The customer clicks **Choose repositories on GitHub**, grants selected repositories, returns to ScoreLead and clicks **Authorize GitHub account**. The OAuth flow uses a one-use, expiring state bound to the current ScoreLead user and business plus PKCE. The customer enters `owner/repository`; the server checks their access through the user installation repository endpoint. Merely knowing an installation or repository ID does not grant access.

The temporary user token is encrypted with AES-GCM and business ID as authenticated data. It is removed after repository selection or ten minutes. Subsequent reads use short-lived installation tokens scoped to one repository and read-only Contents. A new repository choice requires fresh user authorization. The live installation is checked on every answer. Revocation disables new answers and queues the remote index for deletion.

## Deploy

1. Apply migration `0035_support_github_assistant.sql` with the existing migration command. Do not run the migration against production until its deployment is scheduled.
2. Configure the existing OpenAI, Meta connection/token encryption and `CRON_SECRET` settings, plus the GitHub settings above.
3. Schedule these independent authenticated jobs every minute. Send `Authorization: Bearer <CRON_SECRET>`:
   - `GET /api/jobs/support/sync` (up to 300 seconds): import one queued repository, check indexing progress and delete retired artifacts.
   - `GET /api/jobs/support/pump` (up to 120 seconds): process one queued reply. Incoming WhatsApp webhooks also trigger this worker after acknowledging delivery.
4. Open a business's **Integrations → Virtual assistant**, authorize a repository, save paths/instructions and a human contact message, wait for indexing, and test a question.
5. Activate replies explicitly with a connected WhatsApp number and an eligible Growth/Pro account. The existing WhatsApp rollout flag applies to sending.

GitHub App registration and production secrets are operator setup; each customer grants access to their own repositories. The Codex GitHub connector is not a runtime credential for ScoreLead.

## Knowledge and privacy boundaries

- One repository on its default branch per business in this version. Prefixes such as `docs/` include descendants; exact paths include one file. No glob expressions or absolute/traversal paths.
- Defaults: `README.md` and `docs/`. Owners can opt in source directories. Only supported text/code formats are read; dotfiles, dependency/build/test directories, key/credential paths and detected credential contents are excluded. Symlinks and submodules are not followed. Automated filtering is defense in depth; choose content appropriate for customer-facing answers.
- Maximum 150 files, 150 KB per file, 3 MB total. Oversized or truncated trees fail explicitly; no silently incomplete successful index.
- Files are resolved from one immutable commit. Selected content is uploaded to OpenAI for retrieval in a separate vector store per business. Private repository URLs and raw source are not included in customer answers by design.
- Push webhooks queue a refresh; a daily refresh catches missed pushes. While an index is being refreshed, queued replies wait. Failed imports are visible and require retry; failed answer attempts route the conversation to human review.
- Business/account deletion queues remaining remote artifacts using the migration’s deletion trigger. Disconnect/revocation immediately prevents using the old index; remote vector-store/file deletion runs through the durable cleanup queue. Temporary artifacts have cleanup leases; vector stores also expire after seven idle days. Conversations remain with the business and are removed with the existing business data lifecycle.
- Context is evidence about product behavior, not proof of live account state or deployed features. The model gets no repository tools, execution access, customer database access, or cross-business search.

## Delivery and human takeover

Inbound persistence and reply queue insertion share a transaction. A unique inbound ID prevents duplicate jobs. Replies are serialized per conversation, support new contacts without a lead, and include recent incoming/outgoing messages plus the last marketing templates. Each reply checks the customer-service window, connection, business settings, plan, current repository access and takeover state.

The app limits replies to 100 per business per rolling 24 hours and 15 per conversation per hour. Limits pause the conversation for review. These are operational caps, not new billing tiers.

The final decision is persisted as `sending` before the Meta call. Interrupted or uncertain sends become `needs_review`; the system never automatically retries a send that may have reached Meta. Taking over cancels queued/generating answers; an already-dispatched message cannot be recalled. Resuming handles future messages only. Non-text messages are saved and routed to human review; transcription/media understanding is not implemented.

The recent-conversation panel shows the latest 30 conversations and latest 30 messages in the selected conversation, with pause/resume controls. Use the team's existing human channel indicated in the handoff message to continue support; this release does not add a manual WhatsApp composer.

## Verification

Run `bun test lib/support/policy.test.ts lib/support/github.test.ts` for source filtering, service-window, crypto and authorization boundaries. Run `bun test lib/support/integration.test.ts` for transactional webhook/queue and tenant isolation tests with an in-memory PostgreSQL engine and mocked external APIs. No live GitHub, OpenAI, Meta or production database calls are needed.

Official references: [GitHub user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app), [installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app), [OpenAI retrieval](https://developers.openai.com/api/docs/guides/retrieval).
