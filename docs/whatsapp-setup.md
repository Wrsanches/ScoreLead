# WhatsApp Business Platform setup

ScoreLead uses Meta Embedded Signup v3 and the WhatsApp Cloud API. It does not automate WhatsApp Web.

## Meta prerequisites

1. Create or select a Meta app with the WhatsApp product and complete business verification.
2. Configure Embedded Signup and save its configuration ID as `META_WHATSAPP_CONFIG_ID`.
3. Request the production permissions and review required to onboard customer WhatsApp Business Accounts.
4. Configure the callback URL as `https://<scorelead-domain>/api/webhooks/whatsapp`.
5. Use the same random value for Meta's webhook verification token and `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
6. Subscribe the app to `messages` and `message_template_status_update`. ScoreLead also subscribes each connected WABA through the Graph API.
7. Provide Meta with the production privacy-policy and data-deletion URLs before moving the app to Live mode.

## Environment

Set the variables documented in `.env.example`. Generate the token-encryption key separately from the webhook and cron secrets:

```sh
openssl rand -base64 32
```

`META_GRAPH_API_VERSION` is intentionally configurable so the app can be upgraded on Meta's supported-version schedule without a code change.

## Database and worker

Deploy migrations `0022_misty_forgotten_one.sql` through `0024_youthful_talkback.sql`, then schedule this authenticated endpoint every minute:

```text
GET /api/jobs/whatsapp/pump
Authorization: Bearer <CRON_SECRET>
```

Keep the WhatsApp pump separate from the discovery-job pump. The sender claims due steps atomically and limits concurrency with `WHATSAPP_MAX_CONCURRENT`.

## Production verification

- Connect one Meta test WABA through the business Integrations page.
- Sync an approved text-only Marketing template with fixed copy and optional fixed CTA buttons.
- Record consent on a test lead using a full E.164 number.
- Preview and approve the Day 0/3/7 sequence.
- Confirm accepted, sent, delivered, and read webhook transitions appear on the lead.
- Reply from the recipient and verify remaining steps pause.
- Send an exact opt-out command such as `STOP` or `PARAR` and verify consent is revoked and pending steps are cancelled.
- Disconnect the WABA and verify the encrypted token is removed and pending sequences are cancelled.

Customers must configure their own Meta payment method or billing relationship. ScoreLead does not resell WhatsApp message charges.
