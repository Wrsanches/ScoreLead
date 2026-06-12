# Stripe setup (test mode)

How to wire up Stripe so you can test the Pro upgrade end-to-end locally. The app
uses **Stripe-hosted Checkout** via the `@better-auth/stripe` plugin, so no card
fields live in our app. Billing only activates once `STRIPE_SECRET_KEY` is set.

> Do everything in **Test mode** (toggle in the top bar of the Stripe Dashboard).
> Test keys start with `sk_test_…` / `whsec_…`.

---

## 1. Get your test secret key

1. Create/sign in to a Stripe account → https://dashboard.stripe.com
2. Make sure **Test mode** is ON (toggle, top-right).
3. Developers → **API keys** → copy the **Secret key** (`sk_test_…`).
4. Put it in `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   ```

## 2. Create the Pro product + price

1. Dashboard → **Product catalog** → **Add product**.
2. Name: `ScoreLead Pro`.
3. Pricing: **Recurring**, **Monthly**, amount `$49.00` (USD). Save.
4. Open the price you just created → copy its **Price ID** (`price_…`).
5. Put it in `.env.local`:
   ```
   STRIPE_PRO_PRICE_ID=price_xxx
   ```
6. (Optional) Add a second **Yearly** price to the same product for the annual
   discount and set `STRIPE_PRO_ANNUAL_PRICE_ID=price_yyy`. Leave blank to skip.

> The plan is registered in `lib/auth.ts` under the name **`pro`**, which maps to
> `STRIPE_PRO_PRICE_ID`. The upgrade button calls `subscription.upgrade({ plan: "pro" })`.

## 3. Forward webhooks to localhost (Stripe CLI)

Stripe needs to tell the app when a payment completes. Locally, use the Stripe CLI.

1. Install the CLI: `brew install stripe/stripe-cli/stripe` (macOS).
2. Log in: `stripe login` (opens the browser, authorize).
3. Start forwarding (leave this running in its own terminal):
   ```
   stripe listen --forward-to localhost:3000/api/auth/stripe/webhook
   ```
4. The CLI prints a line like `Ready! Your webhook signing secret is whsec_xxx`.
   Copy that `whsec_…` into `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

> The webhook endpoint `/api/auth/stripe/webhook` is mounted automatically by the
> better-auth Stripe plugin - you don't create a route for it.
> The CLI auto-forwards the events we need (`checkout.session.completed`,
> `customer.subscription.created|updated|deleted`).

## 4. Restart the dev server

Env changes are only picked up on boot, and the Stripe plugin only loads when
`STRIPE_SECRET_KEY` is present:

```
bun run dev
```

Your `.env.local` should now have all four:
```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_PRO_ANNUAL_PRICE_ID=        # optional
```

## 5. Test the upgrade flow

1. Log in to the app (Free plan). Sidebar avatar menu shows a **Free** badge +
   **Upgrade to Pro**, and Settings → Billing shows your usage.
2. Trigger the paywall either way:
   - Click **Upgrade to Pro** (sidebar or Settings → Billing), or
   - Hit a Free cap (e.g. start a 2nd discovery job, or generate a 2nd AI image) →
     the upgrade dialog opens automatically.
3. Click **Upgrade - $49/mo** → you're redirected to Stripe-hosted Checkout.
4. Pay with a **test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date · CVC: any 3 digits · ZIP: any
5. After success you're redirected back to the app. Watch the `stripe listen`
   terminal - you'll see `checkout.session.completed` and
   `customer.subscription.created` forwarded (200).
6. The subscription flips to active:
   - Sidebar badge → **Pro**
   - `GET /api/billing/status` returns `"plan":"pro"`
   - The Free caps are lifted (AI images now metered at 30/month and 10/day).

### Test the billing portal / cancel
- Settings → Billing → **Manage billing** → opens Stripe's hosted portal.
- Cancel there → the `customer.subscription.updated`/`deleted` webhook updates the
  `subscription` row (`cancelAtPeriodEnd` / status).

### More test cards
- Requires authentication (3DS): `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`
- Full list: https://stripe.com/docs/testing

---

## Troubleshooting

- **Upgrade button errors / 404 on checkout**: `STRIPE_SECRET_KEY` not set, or dev
  server wasn't restarted after editing `.env.local`.
- **Paid but still Free**: the webhook didn't reach the app. Confirm `stripe listen`
  is running and `STRIPE_WEBHOOK_SECRET` matches the secret it printed. Re-check the
  `stripe listen` terminal for delivery errors.
- **`plan "pro" not found`**: `STRIPE_PRO_PRICE_ID` is empty or wrong, or the plan
  name in `lib/auth.ts` doesn't match `"pro"`.
- **Reset a test user to Free**: delete their row from the `subscription` table
  (`psql … -c "DELETE FROM subscription WHERE \"referenceId\"='<userId>';"`), and to
  reset usage counters delete from the `usage` table.

## Going to production
- Switch the Dashboard to **Live mode**, create the product/price again (live IDs),
  use live keys (`sk_live_…`).
- Register a real webhook endpoint: Developers → Webhooks → **Add endpoint** →
  `https://YOURDOMAIN/api/auth/stripe/webhook`, select events
  `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted` → copy its signing
  secret into the production `STRIPE_WEBHOOK_SECRET`.
- Set `BETTER_AUTH_URL` to your production URL.
