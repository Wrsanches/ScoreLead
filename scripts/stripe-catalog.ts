/**
 * Create (or verify) the ScoreLead product catalog in Stripe.
 *
 *   bun run stripe:catalog             # dry run - prints what it WOULD create
 *   bun run stripe:catalog -- --apply  # create the missing objects
 *   bun run stripe:catalog -- --apply --write-env   # ...and patch .env.local
 *
 * A live run asks for confirmation at the terminal; add --yes to skip that when
 * running without a TTY.
 *
 * ONE RUN TARGETS ONE ENVIRONMENT. Stripe keeps test-mode and live-mode objects
 * in separate namespaces, and a sandbox is a different account again, so a
 * product created in one does not exist in the others. Run this once per
 * environment with that environment's key:
 *
 *   bun run stripe:catalog -- --apply                       # test (key from .env.local)
 *   STRIPE_SECRET_KEY=sk_live_... bun run stripe:catalog -- --apply    # live
 *   STRIPE_SECRET_KEY=sk_test_<sandbox> bun run stripe:catalog -- --apply
 *
 * An explicit STRIPE_SECRET_KEY in the environment wins over the env file, so a
 * live key never has to be written to disk. The price IDs it prints then go
 * into that environment's config (Railway variables for production), not here.
 *
 * Idempotent: every price carries a lookup_key and every product a metadata
 * slug, so an existing object is reused instead of duplicated. Re-running is
 * safe, which is the point - the live-mode setup is easy to get wrong by hand
 * (the one-time $2.95 trial fee is especially easy to forget).
 *
 * Objects are created through the `stripe` CLI, but with an explicit --api-key
 * taken from .env.local rather than the CLI's default profile: that profile can
 * point at a different Stripe account than the app authenticates against (it
 * does on this machine), which would silently build the catalog in the wrong
 * account.
 */

import { createInterface } from "node:readline/promises"

const APPLY = process.argv.includes("--apply")
const WRITE_ENV = process.argv.includes("--write-env")
/** Skip the live-mode confirmation (for non-interactive runs). */
const YES = process.argv.includes("--yes")
const ENV_FILE =
  process.argv.find((a) => a.startsWith("--env-file="))?.split("=")[1] ??
  process.env.ENV_FILE ??
  ".env.local"

type Interval = "month" | "year" | "once"

interface ProductSpec {
  slug: string
  name: string
  description: string
}

interface PriceSpec {
  lookupKey: string
  product: string
  /** Amount in cents. */
  amount: number
  interval: Interval
  envVar: string
}

/**
 * Keep these in sync with PLAN_LIMITS pricing copy in lib/marketing/pricing.ts
 * and the `billing` namespace in i18n/locales/*.json.
 */
const PRODUCTS: ProductSpec[] = [
  {
    slug: "starter",
    name: "ScoreLead Starter",
    description: "Find, score and write outreach for one business.",
  },
  {
    slug: "growth",
    name: "ScoreLead Growth",
    description:
      "WhatsApp automation, contact enrichment and the AI content calendar.",
  },
  {
    slug: "pro",
    name: "ScoreLead Pro",
    description:
      "Agency scale: unlimited prospecting and decision-maker contacts.",
  },
]

const PRICES: PriceSpec[] = [
  { lookupKey: "scorelead_starter_monthly", product: "starter", amount: 1995, interval: "month", envVar: "STRIPE_STARTER_PRICE_ID" },
  { lookupKey: "scorelead_starter_annual", product: "starter", amount: 19900, interval: "year", envVar: "STRIPE_STARTER_ANNUAL_PRICE_ID" },
  // The paid trial's up-front charge. MUST be one-time, not recurring: it rides
  // along as an extra line item on the trialing subscription's checkout.
  { lookupKey: "scorelead_starter_trial_fee", product: "starter", amount: 295, interval: "once", envVar: "STRIPE_STARTER_TRIAL_FEE_PRICE_ID" },
  { lookupKey: "scorelead_growth_monthly", product: "growth", amount: 2995, interval: "month", envVar: "STRIPE_GROWTH_PRICE_ID" },
  { lookupKey: "scorelead_growth_annual", product: "growth", amount: 29900, interval: "year", envVar: "STRIPE_GROWTH_ANNUAL_PRICE_ID" },
  { lookupKey: "scorelead_pro_monthly", product: "pro", amount: 5995, interval: "month", envVar: "STRIPE_PRO_PRICE_ID" },
  { lookupKey: "scorelead_pro_annual", product: "pro", amount: 59900, interval: "year", envVar: "STRIPE_PRO_ANNUAL_PRICE_ID" },
]

const CURRENCY = "usd"

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

/** Read-only lookups go straight to the REST API; it is simpler to parse. */
async function get(
  key: string,
  path: string,
  params: Record<string, string> = {},
) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`https://api.stripe.com/v1/${path}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Basic ${btoa(`${key}:`)}` },
  })
  const body = await res.json()
  if (!res.ok) fail(`Stripe ${path} failed: ${body?.error?.message ?? res.status}`)
  return body
}

/** Creates go through the CLI, as asked - with an explicit key, not the profile. */
async function cli(key: string, args: string[]): Promise<{ id: string }> {
  const proc = Bun.spawn(["stripe", ...args, "--api-key", key], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [out, err] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  if ((await proc.exited) !== 0) {
    fail(`stripe ${args.join(" ")} failed:\n${err || out}`)
  }
  try {
    return JSON.parse(out.trim())
  } catch {
    return fail(`could not parse stripe output:\n${out}\n${err}`)
  }
}

async function main() {
  // The env file is optional when the key is supplied directly, which is how a
  // live run should be done - no live key on disk.
  const envText = await Bun.file(ENV_FILE)
    .text()
    .catch(() => "")

  // An explicit environment variable wins, so `STRIPE_SECRET_KEY=sk_live_...`
  // targets production without editing .env.local.
  const fromEnv = process.env.STRIPE_SECRET_KEY?.trim()
  const fromFile = envText
    .split("\n")
    .find((l) => l.startsWith("STRIPE_SECRET_KEY="))
    ?.slice("STRIPE_SECRET_KEY=".length)
    .trim()
  const key = fromEnv || fromFile
  // `bun run` auto-loads .env.local into process.env, so the mere presence of
  // fromEnv does not mean the operator overrode anything. Only call it an
  // override when it actually differs from the file - this line is what you
  // check before creating live objects, so it must not lie.
  const keySource =
    fromEnv && fromEnv !== fromFile
      ? "STRIPE_SECRET_KEY (explicit override)"
      : ENV_FILE

  if (!key) {
    fail(
      `No STRIPE_SECRET_KEY found (looked in the environment and ${ENV_FILE}).`,
    )
  }
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    fail("STRIPE_SECRET_KEY does not look like a Stripe secret key")
  }
  const live = key.startsWith("sk_live_")

  if (!Bun.which("stripe")) {
    fail("stripe CLI not found. brew install stripe/stripe-cli/stripe")
  }

  const account = await get(key, "account")
  console.log(
    `account : ${account.id} (${account.settings?.dashboard?.display_name ?? "?"})`,
  )
  console.log(`mode    : ${live ? "LIVE (production)" : "test"}`)
  console.log(`key from: ${keySource}`)
  console.log(`action  : ${APPLY ? "APPLY" : "dry run (pass --apply to create)"}`)
  console.log(
    `note    : only this account+mode is touched; ${live ? "test" : "live"} mode needs its own run`,
  )

  if (live && APPLY) {
    console.log("\n!! LIVE mode: these prices can be charged to real customers.")
    if (YES) {
      console.log("   --yes supplied, continuing without prompting.")
    } else if (!process.stdin.isTTY) {
      // Prompting with no terminal attached would just hang forever.
      fail("   Not a terminal. Re-run with --yes to confirm non-interactively.")
    } else {
      // Read a single line. Reading Bun.stdin as a stream waits for EOF, not
      // for Enter, which makes the prompt look hung until Ctrl-D.
      const rl = createInterface({ input: process.stdin, output: process.stdout })
      const answer = (await rl.question("   Type 'live' to continue: ")).trim()
      rl.close()
      if (answer !== "live") fail("aborted")
    }
  }

  console.log("\n== products ==")
  const productIds = new Map<string, string>()
  const existingProducts = await get(key, "products", { limit: "100" })
  for (const spec of PRODUCTS) {
    const hit = existingProducts.data.find(
      (p: { id: string; name: string; metadata?: Record<string, string> }) =>
        p.metadata?.slug === spec.slug || p.name === spec.name,
    )
    if (hit) {
      console.log(`  reuse   ${spec.slug.padEnd(8)} -> ${hit.id}  "${hit.name}"`)
      productIds.set(spec.slug, hit.id)
    } else if (APPLY) {
      const created = await cli(key, [
        "products", "create",
        "--name", spec.name,
        "--description", spec.description,
        "-d", `metadata[slug]=${spec.slug}`,
      ])
      console.log(`  create  ${spec.slug.padEnd(8)} -> ${created.id}  "${spec.name}"`)
      productIds.set(spec.slug, created.id)
    } else {
      console.log(`  WOULD CREATE product ${spec.slug.padEnd(8)} "${spec.name}"`)
      productIds.set(spec.slug, `prod_DRYRUN_${spec.slug}`)
    }
  }

  console.log("\n== prices ==")
  const envOut = new Map<string, string>()
  for (const spec of PRICES) {
    const found = await get(key, "prices", {
      "lookup_keys[]": spec.lookupKey,
      limit: "1",
    })
    const hit = found.data.find((p: { active: boolean }) => p.active)
    const label =
      `${spec.lookupKey.padEnd(28)} ${(spec.amount / 100).toFixed(2).padStart(8)} ` +
      `${CURRENCY.toUpperCase()} ${spec.interval.padEnd(6)}`
    if (hit) {
      console.log(`  reuse   ${label} -> ${hit.id}`)
      envOut.set(spec.envVar, hit.id)
      continue
    }
    if (APPLY) {
      const args = [
        "prices", "create",
        "--product", productIds.get(spec.product)!,
        "--currency", CURRENCY,
        "--unit-amount", String(spec.amount),
        "-d", `lookup_key=${spec.lookupKey}`,
      ]
      if (spec.interval !== "once") {
        args.push("-d", `recurring[interval]=${spec.interval}`)
      }
      const created = await cli(key, args)
      console.log(`  create  ${label} -> ${created.id}`)
      envOut.set(spec.envVar, created.id)
    } else {
      console.log(`  WOULD CREATE ${label}`)
    }
  }

  console.log(`\n== env vars for ${ENV_FILE} ==`)
  for (const spec of PRICES) {
    console.log(`${spec.envVar}=${envOut.get(spec.envVar) ?? ""}`)
  }

  if (APPLY && WRITE_ENV && live) {
    console.log(
      `\nSkipping --write-env: these are LIVE price IDs and ${ENV_FILE} is the` +
        `\nlocal dev config. Put them in the production environment instead` +
        `\n(e.g. Railway variables).`,
    )
  } else if (APPLY && WRITE_ENV) {
    let next = envText
    for (const spec of PRICES) {
      const id = envOut.get(spec.envVar)
      if (!id) continue
      const re = new RegExp(`^${spec.envVar}=.*$`, "m")
      next = re.test(next)
        ? next.replace(re, `${spec.envVar}=${id}`)
        : `${next.replace(/\n*$/, "\n")}${spec.envVar}=${id}\n`
    }
    await Bun.write(ENV_FILE, next)
    console.log(`\nWrote the price IDs into ${ENV_FILE}.`)
  }

  if (APPLY) {
    console.log("\nRestart the dev server so the Stripe plugin picks up the new IDs.")
    console.log("NOTE: repointing STRIPE_PRO_PRICE_ID does not move existing")
    console.log("      subscribers - Stripe prices attach per subscription. Leave")
    console.log("      the old $49 price active or their renewals will break.")
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
