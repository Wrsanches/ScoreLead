import { betterAuth, type BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"

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
          {
            name: "pro",
            priceId: process.env.STRIPE_PRO_PRICE_ID,
            annualDiscountPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
          },
        ],
      },
    }),
  )
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
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
