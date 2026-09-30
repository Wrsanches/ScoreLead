# WhatsApp support inbox, GitHub and Codex

The inbox groups inbound WhatsApp messages by connection and customer. It
classifies conversations, drafts replies from the business profile and selected
project documentation, and proposes engineering tasks for human review. Support
replies are copied and sent manually through WhatsApp Web; ScoreLead does not
send these drafts. The existing outbound WhatsApp sequences are unchanged.

## Activation

1. Deploy migration `0042_support_inbox_github.sql` with `bun run db:migrate`.
   It adds conversations, audio metadata, GitHub connections and reviewed tasks.
   Existing inbound messages are backfilled without automatically charging for
   historical AI analysis; use Analyze on a historical conversation when needed.
2. Keep the existing WhatsApp feature access, connected Business account,
   webhook verification, encryption key and Growth/Pro entitlement. The inbox
   uses the same business authorization as the WhatsApp integration.
3. Configure the server's existing `OPENAI_API_KEY`. Triage uses
   `OPENAI_TEXT_MODEL` from `lib/models.ts`; audio defaults to
   `gpt-4o-mini-transcribe`, overridable with `OPENAI_TRANSCRIPTION_MODEL`.
4. Keep the existing authenticated `/api/jobs/whatsapp/pump` cron running every
   minute. It also drains one support conversation after outbound processing.
   `/api/jobs/support/pump` is available as a separate worker when more capacity
   is needed; it uses the same `CRON_SECRET`. The webhook starts processing with
   Next.js `after` after briefly collecting consecutive messages. The durable
   queue recovers interruptions even if this callback is lost.

Receiving a message queues triage and leaves the conversation pending. Owner
actions can mark it replied or pending. Replied records the last seen message;
new messages automatically reopen the conversation. Duplicate webhooks do not
duplicate messages or conversations. Results from inference started before a
new message are discarded and regenerated. Workers claim atomically, retry
failures at most three times, and recover abandoned processing after six
minutes. Explicit Analyze can retry a failed conversation.

## GitHub connection

The primary flow is **Integrations → GitHub → Connect with GitHub**. The owner
authorizes their identity, grants repository access to the ScoreLead App, and
chooses a repository from the list. Accounts/organizations and repositories are
paginated. If no repositories are available, use **Authorize repositories on
GitHub**, then return and refresh. Organization administrators may need to
approve the installation. Archived repositories and repositories where the
owner lacks write access cannot be connected.

Register the GitHub App once for the ScoreLead deployment:

1. In GitHub's Developer settings, register a **GitHub App** (not an OAuth App).
   Set the homepage to the ScoreLead app origin, and the callback to
   `{BETTER_AUTH_URL}/api/github/callback`.
2. Set the setup URL to `{BETTER_AUTH_URL}/admin/integrations/github`. Leave
   **Request user authorization (OAuth) during installation** unchecked: the
   ScoreLead button handles its own state-bound authorization. Disable webhooks
   unless adding a separate webhook implementation. Allow installation on any
   account if serving multiple customers.
3. Set repository permissions to **Contents: read**, **Issues: write**,
   **Actions: write** (Metadata read is implicit). These support documentation,
   approved issues and optional Codex dispatch. No Contents write is requested.
4. Generate a client secret and RSA private key. Set server-only
   `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_SLUG` and
   `GITHUB_APP_PRIVATE_KEY` along with the existing encryption key. The PEM
   accepts real newlines or escaped `\n`. Never put credentials in `NEXT_PUBLIC_`
   variables. Apply migration `0043_github_app_connection.sql`.

The ScoreLead deployment uses **ScoreLead Support**, owned by `Wrsanches`
(`https://github.com/apps/scorelead-support`). Its production callback is
`https://app.scorelead.io/api/github/callback`, with
`http://localhost:3000/api/github/callback` also registered for local testing.
The four App credentials are configured in Railway's production ScoreLead
service and the ignored local `.env.local`. The installation on `Wrsanches`
is restricted to `Wrsanches/ceramik`; other repositories require a separate
access decision. Railway runs `bun run db:migrate` before deploying the feature.

The identity flow uses PKCE S256 and one-time ten-minute state bound to the
signed-in ScoreLead actor, business and locale. Its encrypted user token is used
only for choosing repositories, expires within one hour locally, and is removed
after selection. Automation uses short-lived installation tokens minted with
RS256 and restricted to the selected repository ID. There is no permanent user
token or refresh token to renew manually. GitHub enforces removal/suspension of
installation access on subsequent API requests. Disconnect removes ScoreLead's
connection; to revoke the GitHub App's installation, use GitHub settings.

Existing manual-token connections continue to work. For this alternative,
enter `owner/repository` or its GitHub URL and a fine-grained personal access
token scoped to that repository:

- **Contents: read** for selected project documentation.
- **Issues: write** to publish a reviewed task.
- **Actions: write** only when enabling Codex workflow dispatch.

The optional workflow is verified as active when saving. Choose up to ten
`.md`, `.mdx` or `.txt` files such as `README.md` and `docs/product.md`. They are
optional; an empty selection uses project notes. Connecting from the picker
automatically selects the README when it is a supported text file. Only
these files are fetched (100 KB per file, 120 KB combined), from the current
default branch. Save and synchronize refreshes this snapshot and its timestamp.
Project notes supply current business rules and tone. Changes to code or docs
are not continuously indexed; sync the context before relying on new changes.

Manual tokens are encrypted with AES-256-GCM and bound to the business ID. Set an
independent `GITHUB_TOKEN_ENCRYPTION_KEY` (32 bytes, hex or base64), or reuse the
existing `WHATSAPP_TOKEN_ENCRYPTION_KEY` when the GitHub key is omitted. Preserve
the chosen key: changing it requires reconnecting repositories. Neither tokens
nor fetched document contents are returned by the settings API. Disconnect
removes the stored token and documentation snapshot.

The model receives customer messages/transcripts, the business profile and this
snapshot as untrusted source material, with structured output and `store: false`.
It must ask for clarification when the supplied context is insufficient and
must not promise a release or completion. It cannot approve tasks, execute code
or send replies. Review the proposed requirements before publishing them.

## Audio

The webhook stores the Meta media ID, MIME type and checksum. An authenticated
server request obtains a fresh media URL and downloads only from allowed Meta
media hosts, without following redirects, with a 16 MB bound and checksum
verification. The browser receives audio through the authenticated message
endpoint. No access token or provider media URL is exposed.

OGG/Opus voice notes and common supported transcription formats are transcribed
before triage. The transcript is cached and may be corrected manually. Failed
or unsupported audio, including AMR, displays a manual-transcript fallback;
explicit Analyze retries previous transcription failures. Attachments that
cannot be read are passed to triage as unavailable, without inventing contents.
Meta media can expire; saved transcripts remain readable. Raw audio is not
persisted in ScoreLead storage.

## Reviewed tasks and Codex

Approve saves the edited title, description, criteria and priority. Reject
requires a reason, retains the decision and queues a revised customer reply.
Neither action publishes externally. **Publish to GitHub** creates an issue
containing the reviewed proposal and a task marker, excluding raw messages and
customer contact details. Concurrency claims prevent duplicate publication. If
the provider outcome is uncertain, **Check issue** reconciles by the task marker
instead of creating another issue. Search indexing may require another check.

To enable **Send to Codex**:

1. Download the workflow from the GitHub integration page and install it as
   `.github/workflows/scorelead-codex.yml` in the connected repository's default
   branch. Review it before installation.
2. Add `OPENAI_API_KEY` to that repository's GitHub Actions secrets and allow
   GitHub Actions to create pull requests. Codex API usage is billed to this key.
3. Save `scorelead-codex.yml` in ScoreLead's optional workflow field, using a token
   with Actions write access.
4. Publish an approved issue, then explicitly send it to Codex.

The workflow validates the published task marker, runs `openai/codex-action@v1`
with workspace-write and drop-sudo, and prepares a patch. A separate publication
job opens a branch and PR for review, excluding workflow and environment files.
It does not merge, deploy or contact the customer. ScoreLead records dispatch
acceptance, not run completion; use **View execution** to follow Actions. An
uncertain dispatch blocks duplicate requests and directs the owner to Actions.

## Verification

```sh
bun run test:support
bun test lib/whatsapp/*.test.ts
SUPPORT_TEST_DATABASE_URL=postgresql://localhost:5432/scorelead_support_test bun run test:support:integration
```

Integration tests refuse non-local databases and database names outside
`scorelead_support_test*`. They migrate and truncate this disposable database.
They mock provider requests while testing ingestion, isolated business access,
audio transcription, stale inference, duplicate issue/dispatch claims and
rejection preservation. `scripts/support-browser-fixture.ts` can seed the same
disposable database for browser checks; it also truncates it and must never be
used with production data.
