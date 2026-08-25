# Stripe setup (test mode)

How to wire up Stripe so you can test the tiered upgrade flow end-to-end locally.
The app uses **Stripe-hosted Checkout** via the `@better-auth/stripe` plugin, so no
card fields live in our app. Billing only activates once `STRIPE_SECRET_KEY` is set.

There are four entitlement tiers (`lib/plan.ts`): **Free**, **Starter** ($19.95/mo,
entered through a $2.95/7-day paid trial), **Growth** ($29.95/mo) and **Pro**
($59.95/mo).

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

## 2. Create the products + prices

Create three products. Every price is **USD**; recurring unless noted.

| Product | Price | Type | Env var |
|---|---|---|---|
| `ScoreLead Starter` | $19.95 | Recurring, monthly | `STRIPE_STARTER_PRICE_ID` |
| `ScoreLead Starter` | $199.00 | Recurring, yearly | `STRIPE_STARTER_ANNUAL_PRICE_ID` |
| `ScoreLead Starter` | $2.95 | **One-time** | `STRIPE_STARTER_TRIAL_FEE_PRICE_ID` |
| `ScoreLead Growth` | $29.95 | Recurring, monthly | `STRIPE_GROWTH_PRICE_ID` |
| `ScoreLead Growth` | $299.00 | Recurring, yearly | `STRIPE_GROWTH_ANNUAL_PRICE_ID` |
| `ScoreLead Pro` | $59.95 | Recurring, monthly | `STRIPE_PRO_PRICE_ID` |
| `ScoreLead Pro` | $599.00 | Recurring, yearly | `STRIPE_PRO_ANNUAL_PRICE_ID` |

### Scripted (recommended)

`bun run stripe:catalog` creates all of the above through the Stripe CLI and
prints the env lines. It is idempotent - every price carries a `lookup_key` and
every product a metadata slug, so an existing object is reused rather than
duplicated and re-running is safe.

```
bun run stripe:catalog                          # dry run, creates nothing
bun run stripe:catalog -- --apply               # create the missing objects
bun run stripe:catalog -- --apply --write-env   # ...and patch .env.local
```

**One run targets one environment.** Stripe keeps test-mode and live-mode objects
in separate namespaces (and a sandbox is a different account again), so a product
created in one does not exist in the others. Run it once per environment with
that environment's key:

| Target | Command |
|---|---|
| test | `bun run stripe:catalog -- --apply` (key from `.env.local`) |
| live | `STRIPE_SECRET_KEY=sk_live_… bun run stripe:catalog -- --apply` |
| sandbox | `STRIPE_SECRET_KEY=sk_test_<sandbox> bun run stripe:catalog -- --apply` |

An explicit `STRIPE_SECRET_KEY` in the environment wins over the env file, so a
live key never has to be written to disk. For a live run the printed IDs go into
the production environment (Railway variables), not `.env.local` - `--write-env`
deliberately refuses to write live IDs into the local dev config.

The script prints the account id, mode, and where it read the key from before it
touches anything. Check that line: the Stripe CLI's own default profile may point
at a completely different account than this app uses, which is why the script
passes `--api-key` explicitly instead of relying on `stripe login`.

### By hand

Dashboard → **Product catalog** → **Add product** → add the prices, then open each
price and copy its **Price ID** (`price_…`) into `.env.local`. The annual IDs are
optional - leave them blank to hide the annual toggle for that tier.

### How the $2.95 paid trial works

`lib/auth.ts` registers **four** plan names. `starter_trial` and `starter` point at
the *same* $19.95 recurring price; the trial SKU adds a 7-day trial plus the
one-time $2.95 price as an extra line item:

```ts
{ name: "starter_trial", priceId: STARTER, freeTrial: { days: 7 },
  lineItems: [{ price: STARTER_TRIAL_FEE, quantity: 1 }] }
```

Better Auth spreads `lineItems` into the Checkout session's `line_items` and the
trial into `subscription_data`, so Stripe charges the $2.95 at checkout and the
$19.95 when the trial ends on day 8. The client picks the SKU in
`lib/plan-tiers.ts` → `checkoutPlanName()`: a Free user buying Starter gets
`starter_trial`, an existing subscriber switching to Starter gets plain `starter`
(no second trial). `PLAN_TIER` in `lib/plan.ts` maps `starter_trial` → `starter`
for entitlements.

> **Repricing Pro:** Stripe prices attach per subscription, so pointing
> `STRIPE_PRO_PRICE_ID` at the new $59.95 price leaves existing customers billing
> at their original $49 forever. **Do not archive the old $49 price** - existing
> subscriptions still reference it.

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

Your `.env.local` should now have:
```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_STARTER_ANNUAL_PRICE_ID=    # optional
STRIPE_STARTER_TRIAL_FEE_PRICE_ID=price_xxx   # the one-time $2.95 price
STRIPE_GROWTH_PRICE_ID=price_xxx
STRIPE_GROWTH_ANNUAL_PRICE_ID=     # optional
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_PRO_ANNUAL_PRICE_ID=        # optional
```

## 5. Test the upgrade flow

1. Log in to the app (Free plan). The sidebar avatar menu shows a **Free** badge and
   an upgrade CTA; Settings → Billing shows your usage against the Free caps.
2. Trigger the paywall either way:
   - Click the upgrade CTA (sidebar or Settings → Billing), or
   - Hit a Free cap (e.g. start a 2nd discovery job, or generate a 2nd AI image) →
     the dialog opens automatically, **preselected on the cheapest tier that clears
     the limit you hit** (the 402 response carries the gate `action`).
3. Pick a tier and continue → you're redirected to Stripe-hosted Checkout.
4. Pay with a **test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date · CVC: any 3 digits · ZIP: any
5. After success you're redirected back to the app. Watch the `stripe listen`
   terminal for `checkout.session.completed` and `customer.subscription.created`.
6. The subscription flips active: sidebar badge shows the tier, and
   `GET /api/billing/status` returns the tier plus its `limits` and `capabilities`.

### Verify the $2.95 paid trial specifically

This is the one flow worth checking against the Stripe Dashboard rather than
trusting the UI, because it depends on Stripe billing a one-time line item during a
trial:

1. As a **Free** user, choose **Starter** in the upgrade dialog. The CTA should read
   *Start for $2.95* and Checkout should show **$2.95 due today**.
2. Pay with `4242…`. Then in the Dashboard → the new subscription:
   - status is **trialing**, `trial_end` ≈ 7 days out
   - there is a **paid $2.95 invoice** dated today
   - the upcoming invoice is **$19.95**
3. Force the conversion instead of waiting a week:
   ```
   stripe subscriptions update <sub_id> --trial-end=now
   ```
   Confirm a $19.95 invoice is created and the status becomes **active**. The app
   should keep reporting `starter` throughout - `getUserPlan` accepts both
   `trialing` and `active`.
4. While `trialing`, the reduced `STARTER_TRIAL_LIMITS` apply (3 discovery runs, 15
   outreach messages, 1 content plan, 2 AI images) so $2.95 can't buy a full month.

### Test the billing portal / cancel / downgrade
- Settings → Billing → **Manage billing** → opens Stripe's hosted portal.
- Cancel there → the `customer.subscription.updated`/`deleted` webhook updates the
  `subscription` row (`cancelAtPeriodEnd` / status), and entitlements fall back to
  Free once it is no longer active/trialing.
- Downgrades (Pro → Growth) go through the portal; the upgrade dialog only offers
  tiers strictly above the current one.

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
- **`plan "<name>" not found`**: that tier's price-ID env var is empty or wrong, or
  the plan name in `lib/auth.ts` doesn't match what the client sent. The client
  names come from `checkoutPlanName()` in `lib/plan-tiers.ts`.
- **$2.95 wasn't charged at checkout**: `STRIPE_STARTER_TRIAL_FEE_PRICE_ID` is unset
  (the plan then falls back to a plain free trial - see the guard in `lib/auth.ts`)
  or points at a *recurring* price instead of a **one-time** one.
- **User shows Free right after paying**: entitlements read the `subscription` table,
  which the webhook writes. `plan-context.tsx` polls a few times after
  `?upgraded=1`; if it never lands, check `stripe listen`.
- **Reset a test user to Free**: delete their row from the `subscription` table
  (`psql … -c "DELETE FROM subscription WHERE \"referenceId\"='<userId>';"`), and to
  reset usage counters delete from the `usage` table.

## Going to production
- Recreate the catalog in live mode with
  `STRIPE_SECRET_KEY=sk_live_… bun run stripe:catalog -- --apply`, then put the
  printed IDs into the production environment. The script covers the one-time
  $2.95 price, which is the easiest thing to miss by hand - without it Starter
  silently becomes a plain 7-day free trial.
- Use live keys (`sk_live_…`) for `STRIPE_SECRET_KEY` in production.
- Register a real webhook endpoint: Developers → Webhooks → **Add endpoint** →
  `https://YOURDOMAIN/api/auth/stripe/webhook`, select events
  `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted` → copy its signing
  secret into the production `STRIPE_WEBHOOK_SECRET`.
- Set `BETTER_AUTH_URL` to your production URL.
