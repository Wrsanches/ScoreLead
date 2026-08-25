import { betterAuth, type BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"
import {
  notifySlackAccountCreated,
  notifySlackSubscriptionCreated,
} from "@/lib/slack"

async function notifyNewSubscription(opts: {
  referenceId: string
  plan: string
  billingInterval?: string | null
  status: string
  subscribedAt: Date
}) {
  let account: { name: string; email: string } | undefined

  try {
    const accounts = await db
      .select({ name: schema.user.name, email: schema.user.email })
      .from(schema.user)
      .where(eq(schema.user.id, opts.referenceId))
      .limit(1)
    account = accounts[0]
  } catch {
    console.error("Could not load the subscribing account for its Slack notification")
  }

  await notifySlackSubscriptionCreated({
    accountId: opts.referenceId,
    name: account?.name,
    email: account?.email,
    plan: opts.plan,
    billingInterval: opts.billingInterval,
    status: opts.status,
    subscribedAt: opts.subscribedAt,
  })
}

// Only enable Stripe billing when a key is configured, so the app keeps working
// before billing is set up (Stripe throws if constructed with an empty key).
const plugins: BetterAuthPlugin[] = []
if (process.env.STRIPE_SECRET_KEY) {
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
  plugins.push(
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          // The $2.95/7-day paid trial. Better Auth spreads `lineItems` into the
          // Checkout session's line_items alongside the trial on
          // subscription_data, so Stripe bills the one-time $2.95 at checkout
          // and the $19.95 recurring price when the trial ends on day 8.
          // Entitlement-wise this is Starter (see PLAN_TIER in lib/plan.ts).
          {
            name: "starter_trial",
            priceId: process.env.STRIPE_STARTER_PRICE_ID,
            freeTrial: { days: 7 },
            lineItems: process.env.STRIPE_STARTER_TRIAL_FEE_PRICE_ID
              ? [{ price: process.env.STRIPE_STARTER_TRIAL_FEE_PRICE_ID, quantity: 1 }]
              : undefined,
          },
          {
            name: "starter",
            priceId: process.env.STRIPE_STARTER_PRICE_ID,
            annualDiscountPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
          },
          {
            name: "growth",
            priceId: process.env.STRIPE_GROWTH_PRICE_ID,
            annualDiscountPriceId: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID,
          },
          {
            name: "pro",
            priceId: process.env.STRIPE_PRO_PRICE_ID,
            annualDiscountPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
          },
        ],
        onSubscriptionComplete: async ({ event, subscription, plan }) => {
          await notifyNewSubscription({
            referenceId: subscription.referenceId,
            plan: plan.name,
            billingInterval: subscription.billingInterval,
            status: subscription.status,
            subscribedAt: new Date(event.created * 1_000),
          })
        },
        // Covers subscriptions created outside ScoreLead Checkout, such as in
        // the Stripe Dashboard. Better Auth keeps this distinct from the
        // checkout-completed callback above, so normal purchases alert once.
        onSubscriptionCreated: async ({ event, subscription, plan }) => {
          await notifyNewSubscription({
            referenceId: subscription.referenceId,
            plan: plan.name,
            billingInterval: subscription.billingInterval,
            status: subscription.status,
            subscribedAt: new Date(event.created * 1_000),
          })
        },
      },
    }),
  )
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.SCORELEAD_PUBLIC_URL,
    process.env.SCORELEAD_APP_URL,
  ].filter((origin): origin is string => Boolean(origin)),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await notifySlackAccountCreated({
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          })
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, name: user.name, url })
    },
  },
  emailVerification: {
    // Also re-sends when an unverified user attempts to sign in.
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ to: user.email, name: user.name, url })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins,
})
