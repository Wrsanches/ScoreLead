# Resend integration (per-business email outreach)

This is distinct from `docs/resend-setup.md`, which covers ScoreLead's own transactional account (auth emails, contact form). Here each **business connects its own Resend account**, so emails to leads go out from the customer's verified domain and the customer's reputation.

## What it does

- **Connect**: the user pastes a Resend API key on Integrations → Resend. We validate it (`domains.list`), let them pick a From name and a verified domain, encrypt the key per business, and try to register a delivery-tracking webhook in their account.
- **Templates**: Integrations → Email templates. A block builder (heading, text, button, image, divider, spacer) rendered with React Email, or raw HTML for people bringing their own markup. Text blocks are edited inline with TipTap and store whitelisted JSON, never HTML strings. Variables like `{{lead.firstName}}` render as chips.
- **Shared components**: header and footer live once per business (`email_component`) and are referenced by every template; each template can toggle them off. The footer always carries the unsubscribe link. Blocks-mode templates are re-rendered at send time from `bodyDoc` plus the current shared components and brand colors, so a footer edit reaches every email. `bodyHtml` is only a snapshot for listings and mode switching.
- **AI drafts**: "Generate with AI" asks `gpt-6-astra` (structured outputs) for three complete emails, one parallel call per angle, previews them, and applies one. Schema-constrained decoding sometimes degenerates into a whitespace runaway; the calls are streamed, aborted as soon as that starts, and retried (see `parseWithRetry` in `lib/services/email-template-draft.ts`). When the business has no shared components yet, the same call proposes header and footer copy. Rate limited to 5 per minute per user.
- **Images**: the image block offers an upload, a library of the business logo and profile product images, and "Generate with AI": one GPT Image render (wide 1200x624, square, or portrait JPEG) in the brand palette, optionally anchored on up to four real product photos and/or the logo via the edit endpoint. Stored under `email-assets/`. Costs one AI-image credit (`reserveImages`, refunded on failure), 6/min per user; route `POST /api/businesses/[id]/resend/images/generate`.
- **Send**: on a lead's detail page, pick recipient + template, preview, send. Synchronous, one email per action, rate limited to 20/min per business.
- **Test send**: the template editor's preview aside sends the current draft (saved or not) to any address the user types, rendered with the sample lead and the real business and sender. Subject is prefixed `[Test]`, nothing is recorded in `email_message`, suppressions are not checked, and webhooks ignore it (no message tag). 10/min per user.
- **Track**: Resend webhooks (`email.sent`, `delivered`, `delivery_delayed`, `opened`, `clicked`, `bounced`, `complained`, `failed`) update the message and the lead page shows a timeline.
- **Compliance**: every email gets an unsubscribe link (`{{unsubscribe_url}}`, appended automatically if missing) plus `List-Unsubscribe` headers. Bounces, complaints, and unsubscribes create a per-business suppression that blocks further sends to that address.

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_RESEND_INTEGRATION_ENABLED` | Production rollout flag (`true` to enable). Dev/test are always on. |
| `RESEND_TOKEN_ENCRYPTION_KEY` | 32-byte key (hex or base64) for AES-256-GCM encryption of customer API keys and webhook secrets. `openssl rand -base64 32`. |
| `RESEND_WEBHOOK_PUBLIC_URL` | Optional. Public base URL for `/api/webhooks/resend/{connectionId}`; defaults to `SCORELEAD_APP_URL`. Use a tunnel URL locally. |

## Key scopes

- **Full access** key: we can list domains (to validate the From domain) and create the webhook automatically. Recommended.
- **Sending access** key: `domains.list` returns `restricted_api_key`. The user types the From address, and tracking must be set up manually: add a webhook in the Resend dashboard pointing at the endpoint shown on the setup page, then paste the `whsec_...` signing secret.

The From domain must be verified in the customer's account, except `resend.dev` (Resend's shared onboarding domain), which is accepted for testing. Resend only delivers `onboarding@resend.dev` mail to the account owner's address and its test inboxes.

## Plan gating

Capability `emailOutreach` in `lib/plan.ts`: Growth and Pro. No per-send metering; the customer pays Resend for volume.

## Data model

`resend_connection` (one per business, encrypted secrets), `email_template` (`bodyMode` blocks|html, `bodyDoc` block document), `email_component` (shared header/footer), `email_message` (rendered snapshot + status + stamps), `email_webhook_event` (idempotency), `email_suppression`. See `lib/db/schema.ts`.

## Testing locally

1. Set `RESEND_TOKEN_ENCRYPTION_KEY`; run `bun run db:migrate`.
2. Connect with a real full-access key; choose From `onboarding@resend.dev`.
3. Create a template using `{{lead.firstName}}` and `{{unsubscribe_url}}`.
4. On a lead, send to `delivered@resend.dev`, then `bounced@resend.dev` (Resend test addresses). The second send to the bounced address should be blocked (`RECIPIENT_SUPPRESSED`).
5. For webhooks, expose the dev server (`cloudflared tunnel --url http://localhost:3000`) and set `RESEND_WEBHOOK_PUBLIC_URL` before connecting.
6. Open the unsubscribe link from a sent email; it should record a suppression and show a confirmation page.

Open/click events only fire when tracking is enabled on the domain in Resend.
