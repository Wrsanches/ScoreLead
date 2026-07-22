# Slack alerts

ScoreLead can post an alert when Better Auth creates an account and when Stripe
creates a plan subscription.

## Configuration

1. In Slack, create an Incoming Webhook for the channel that should receive the
   alerts.
2. Set the webhook as the server-side `SLACK_WEBHOOK_URL` environment variable:

   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

3. Restart the app after changing local environment variables. Add the same
   variable to the production deployment environment before deploying.

Do not commit the webhook URL or prefix it with `NEXT_PUBLIC_`. Treat it like a
password and rotate it from the Slack app settings if it is ever exposed.

## Events

- **New account:** runs after Better Auth persists a user, including email and
  social signups.
- **New subscription:** runs after Stripe Checkout completes. Subscriptions
  created directly in Stripe are covered by the separate creation callback.

Slack delivery is best-effort: missing configuration, timeouts, or Slack errors
are logged but never cause signup or Stripe webhook processing to fail.

## Preview the alerts

Send one sample account alert and one sample monthly Pro subscription alert to
the configured channel:

```bash
bun run slack:preview
```

The preview command loads `.env.local`, uses the same notification functions as
production, and exits with an error if either message is rejected.
