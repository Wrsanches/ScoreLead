# Integration encryption key rotation

These keys encrypt saved customer connection credentials; replacing a key without
re-encrypting those records breaks connections. Rotating encryption does not revoke
customer/provider tokens that might already have been stolen.

The reader accepts the existing `v1` format and a `v2` format containing an
authenticated key identifier and provider/tenant context. Writers remain `v1`
unless `TOKEN_ENCRYPTION_WRITE_VERSION=2` is explicitly set. Previous keys are
decrypt-only, comma-separated, with a maximum of five keys per purpose.

| Primary variable | Previous-key variable |
| --- | --- |
| `GOOGLE_REPORTING_TOKEN_ENCRYPTION_KEY` | `GOOGLE_REPORTING_TOKEN_ENCRYPTION_PREVIOUS_KEYS` |
| `INSTAGRAM_TOKEN_ENCRYPTION_KEY` | `INSTAGRAM_TOKEN_ENCRYPTION_PREVIOUS_KEYS` |
| `RESEND_TOKEN_ENCRYPTION_KEY` | `RESEND_TOKEN_ENCRYPTION_PREVIOUS_KEYS` |
| `WHATSAPP_TOKEN_ENCRYPTION_KEY` | `WHATSAPP_TOKEN_ENCRYPTION_PREVIOUS_KEYS` |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | `GITHUB_TOKEN_ENCRYPTION_PREVIOUS_KEYS` |

Keys are random 32-byte values, encoded as 64 hex characters or base64. GitHub
continues to use the WhatsApp primary and previous-key list when its own primary
is absent. A dedicated GitHub primary requires adding the old WhatsApp key to
GitHub's previous-key list when existing GitHub records used that fallback.

## Staged deployment (production and testing separately)

1. Audit with the currently deployed keys and save a plan:
   `bun run keys:rotate --plan-out /secure/path/rotation-plan.json`.
   This is a database **read-only transaction**. Reports contain counts and key
   fingerprints only. An unreadable value blocks both the plan and migration.
2. Generate replacement keys in a secure secret manager. Keep the current primary
   keys unchanged and put the **new** keys into each previous-key variable.
   Deploy this bridge code, leaving writers at version 1. Wait until **every**
   application/worker instance runs this reader and has both keys. Existing old
   code cannot read new ciphertexts, so a rolling deployment must complete first.
3. Swap each primary to the new key and its previous-key list to the old key.
   Set `TOKEN_ENCRYPTION_WRITE_VERSION=2`. Deploy and verify every instance has
   the new writer configuration. Never roll back to code without dual-key support.
4. Run `bun run keys:rotate --write --readers-ready --plan
   /secure/path/rotation-plan.json --backup /secure/path/ciphertexts.ndjson` as
   one command. `--readers-ready` is an operator assertion that steps 2–3 are
   complete, not an automatic deployment check. The target database fingerprint
   must match the plan, all planned primary keys must have changed, and the
   plan's old keys must be present in the decrypt-only lists.
5. Re-run the read-only audit. Resolve any concurrent refresh conflicts by
   re-running migration with a **new backup filename**. Wait for active OAuth
   flows using the old key to expire/finish (up to ten minutes), then audit again.
6. Only when `retirementReady` is true, remove the old previous keys and deploy.
   Verify connection reads, token refresh, webhooks, and email unsubscribe links;
   re-run the audit with only new keys. Protect the backup like a credential:
   ciphertext plus an exposed old key can reveal the original tokens.

The migration rewrites Google reporting access/refresh tokens, Instagram tokens,
Resend API/webhook secrets, WhatsApp tokens, GitHub connection tokens, and GitHub
authorization tokens. It verifies every replacement with the new key alone,
preserves tenant context, and uses compare-and-swap to avoid overwriting concurrent
refreshes or reconnects. A database advisory lock prevents parallel migrations.
All writes occur in one transaction. A durable mode-0600 backup of ciphertexts
and tenant context is synced before commit; it contains no plaintext credentials.
Database/provider errors are deliberately not logged because they may contain secrets.
If the connection fails during commit, the tool reports an unknown outcome:
audit before retrying, and retain the backup regardless of its commit footer.

OAuth verifiers cannot be rewritten: they are authenticated using the original
browser state, while the database stores only its hash. Active old-key verifiers
block retirement; expired states can be removed by the normal cleanup job.

Previously sent unsubscribe links are matched against the exact bearer token in
the saved email body. This preserves those links after removal of Resend's old
signing/encryption key. Missing snapshots block migration for manual review.

## Recovery

Keep the new and old keys available to the bridge reader while investigating.
If needed, run `bun run keys:rotate --restore /secure/path/ciphertexts.ndjson
--readers-ready` as one command against the same database. Restore is transactional
and uses compare-and-swap: only values that still equal this backup's replacement
are restored. Later refreshes/reconnects win and are reported as conflicts.
An interrupted backup without a commit footer is usable with the same safeguards.
This does not restore an old deployment or configuration: both ciphertext formats
and all required keys must remain readable until a fresh audit verifies recovery.

## Verification

`bun run test:keys` checks historical ciphertext compatibility, provider/tenant
binding, malformed keys, and unsubscribe links after key retirement.
`ROTATION_TEST_DATABASE_URL=postgresql://localhost:5432/scorelead_rotation_test bun
run test:keys:integration` exercises actual migration/restore transactions, backup
permissions, unreadable-data guards and concurrent refreshes. Run that command on
one line against a disposable local database; the test refuses remote hosts and
database names outside the `scorelead_rotation_test` prefix.
