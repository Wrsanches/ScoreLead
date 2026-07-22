/**
 * Seed the isolated Meta App Review workspace in a Railway database.
 *
 * The WhatsApp test connection is copied from the local development database
 * without printing or decrypting its access token. Run this through the
 * Railway Postgres service so DATABASE_PUBLIC_URL targets the review database.
 */
const fs = require("node:fs")
const { URL } = require("node:url")
const dotenv = require("dotenv")
const { Pool } = require("pg")

const REVIEWER_EMAIL = "meta-review@scorelead.io"
const REVIEW_BUSINESS_NAME = "ScoreLead Meta Review"
const SOURCE_BUSINESS_NAME = "Ceramik"
const REVIEW_CONNECTION_ID = "meta-review-whatsapp-connection"
const REVIEW_JOB_ID = "meta-review-discovery-job"
const REVIEW_LEAD_ID = "meta-review-isolated-demo"
const REVIEW_CONSENT_ID = "meta-review-consent-granted"
const REVIEW_SUBSCRIPTION_ID = "meta-review-pro-entitlement"
const REVIEW_PHONE = "+15555550199"
const TARGET_ENVIRONMENT =
  process.argv.find((argument) => argument.startsWith("--environment="))?.split("=")[1] ||
  "testing"

function requireUrl(value, label) {
  if (!value) throw new Error(`${label} is not configured`)
  try {
    return new URL(value)
  } catch {
    throw new Error(`${label} is not a valid PostgreSQL URL`)
  }
}

async function main() {
  if (!["testing", "production"].includes(TARGET_ENVIRONMENT)) {
    throw new Error("Target environment must be testing or production")
  }
  if (process.env.RAILWAY_ENVIRONMENT_NAME !== TARGET_ENVIRONMENT) {
    throw new Error(`Refusing to seed ${process.env.RAILWAY_ENVIRONMENT_NAME || "an unknown environment"} as ${TARGET_ENVIRONMENT}`)
  }

  const localEnv = dotenv.parse(fs.readFileSync(".env.local"))
  const localUrl = requireUrl(localEnv.DATABASE_URL, ".env.local DATABASE_URL")
  const remoteUrl = requireUrl(
    process.env.DATABASE_PUBLIC_URL,
    "Railway DATABASE_PUBLIC_URL",
  )

  if (!["localhost", "127.0.0.1", "::1"].includes(localUrl.hostname)) {
    throw new Error("Refusing to use a non-local source database")
  }
  if (!remoteUrl.hostname.endsWith(".proxy.rlwy.net")) {
    throw new Error("Refusing to use a target outside Railway's public proxy")
  }

  const localPool = new Pool({
    connectionString: localUrl.toString(),
    max: 1,
    connectionTimeoutMillis: 10_000,
  })
  const remotePool = new Pool({
    connectionString: remoteUrl.toString(),
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10_000,
  })

  let remoteClient
  try {
    const sourceConnectionResult = await localPool.query(
      `SELECT wc."wabaId", wc."phoneNumberId", wc."displayPhoneNumber",
              wc."verifiedName", wc."encryptedAccessToken", wc."tokenKeyVersion",
              wc.timezone, wc."allowedWeekdays", wc."dailyLimit",
              wc."sendWindowStart", wc."sendWindowEnd"
       FROM business b
       JOIN whatsapp_connection wc ON wc."businessId" = b.id
       WHERE b.name = $1
         AND wc.status = 'connected'
         AND wc."encryptedAccessToken" IS NOT NULL
       ORDER BY wc."connectedAt" DESC
       LIMIT 1`,
      [SOURCE_BUSINESS_NAME],
    )
    if (sourceConnectionResult.rowCount !== 1) {
      throw new Error("A single connected local WhatsApp test connection was not found")
    }
    const sourceConnection = sourceConnectionResult.rows[0]

    const sourceTemplateResult = await localPool.query(
      `SELECT wt."metaTemplateId", wt.name, wt.language, wt.category,
              wt.status, wt.components, wt.supported
       FROM business b
       JOIN whatsapp_connection wc ON wc."businessId" = b.id
       JOIN whatsapp_template wt ON wt."connectionId" = wc.id
       WHERE b.name = $1
         AND wt.category = 'MARKETING'
         AND wt.status = 'APPROVED'
         AND wt.supported = true
       ORDER BY wt.name
       LIMIT 1`,
      [SOURCE_BUSINESS_NAME],
    )
    if (sourceTemplateResult.rowCount !== 1) {
      throw new Error("An approved supported Marketing template was not found locally")
    }
    const sourceTemplate = sourceTemplateResult.rows[0]

    remoteClient = await remotePool.connect()
    await remoteClient.query("BEGIN")
    await remoteClient.query("SET LOCAL statement_timeout = '30s'")

    const reviewerResult = await remoteClient.query(
      `SELECT u.id AS "userId", b.id AS "businessId"
       FROM "user" u
       JOIN business b ON b."userId" = u.id
       WHERE u.email = $1 AND b.name = $2
       FOR UPDATE`,
      [REVIEWER_EMAIL, REVIEW_BUSINESS_NAME],
    )
    if (reviewerResult.rowCount !== 1) {
      throw new Error("The isolated reviewer user and workspace were not found")
    }
    const { userId, businessId } = reviewerResult.rows[0]

    const safetyResult = await remoteClient.query(
      `SELECT
         (SELECT count(*)::int FROM lead WHERE "businessId" = $1 AND id <> $2) AS "unexpectedLeads",
         (SELECT count(*)::int FROM whatsapp_sequence WHERE "businessId" = $1) AS sequences`,
      [businessId, REVIEW_LEAD_ID],
    )
    const safety = safetyResult.rows[0]
    if (safety.unexpectedLeads !== 0 || safety.sequences !== 0) {
      throw new Error("Reviewer workspace contains unexpected leads or sequences; no changes were made")
    }

    await remoteClient.query(
      `UPDATE business
       SET description = $2,
           persona = $3,
           "clientPersona" = $4,
           field = 'B2B lead generation',
           category = 'Software',
           language = 'en',
           "serviceArea" = 'United States',
           "onboardingCompleted" = true,
           "onboardingStep" = 'complete',
           "updatedAt" = now()
       WHERE id = $1`,
      [
        businessId,
        "Isolated synthetic workspace for Meta App Review. No real customer or lead data is present.",
        "B2B businesses using compliant WhatsApp outreach",
        "A synthetic opted-in company used only for Meta App Review",
      ],
    )

    await remoteClient.query(
      `INSERT INTO subscription
         (id, plan, "referenceId", status, "periodStart", "periodEnd",
          "cancelAtPeriodEnd", seats, "billingInterval")
       VALUES ($1, 'pro', $2, 'active', now(), now() + interval '1 year', false, 1, 'year')
       ON CONFLICT (id) DO UPDATE SET
         plan = EXCLUDED.plan,
         "referenceId" = EXCLUDED."referenceId",
         status = EXCLUDED.status,
         "periodStart" = EXCLUDED."periodStart",
         "periodEnd" = EXCLUDED."periodEnd",
         "cancelAtPeriodEnd" = false,
         seats = 1,
         "billingInterval" = 'year'`,
      [REVIEW_SUBSCRIPTION_ID, userId],
    )

    const reviewPhoneNumberId = `meta-review-${sourceConnection.phoneNumberId}`
    const connectionResult = await remoteClient.query(
      `INSERT INTO whatsapp_connection
         (id, "businessId", "wabaId", "phoneNumberId", "displayPhoneNumber",
          "verifiedName", status, "encryptedAccessToken", "tokenKeyVersion",
          timezone, "allowedWeekdays", "dailyLimit", "sendWindowStart",
          "sendWindowEnd", "connectedAt", "lastTemplateSyncAt", "updatedAt")
       VALUES
         ($1, $2, $3, $4, $5, $6, 'connected', $7, $8,
          $9, $10, $11, $12, $13, now(), now(), now())
       ON CONFLICT ("businessId") DO UPDATE SET
         "wabaId" = EXCLUDED."wabaId",
         "phoneNumberId" = EXCLUDED."phoneNumberId",
         "displayPhoneNumber" = EXCLUDED."displayPhoneNumber",
         "verifiedName" = EXCLUDED."verifiedName",
         status = 'connected',
         "encryptedAccessToken" = EXCLUDED."encryptedAccessToken",
         "tokenKeyVersion" = EXCLUDED."tokenKeyVersion",
         timezone = EXCLUDED.timezone,
         "allowedWeekdays" = EXCLUDED."allowedWeekdays",
         "dailyLimit" = EXCLUDED."dailyLimit",
         "sendWindowStart" = EXCLUDED."sendWindowStart",
         "sendWindowEnd" = EXCLUDED."sendWindowEnd",
         "disconnectedAt" = NULL,
         "lastTemplateSyncAt" = now(),
         "updatedAt" = now()
       RETURNING id`,
      [
        REVIEW_CONNECTION_ID,
        businessId,
        sourceConnection.wabaId,
        reviewPhoneNumberId,
        sourceConnection.displayPhoneNumber,
        `${sourceConnection.verifiedName || "WhatsApp"} — Meta Review`,
        sourceConnection.encryptedAccessToken,
        sourceConnection.tokenKeyVersion,
        sourceConnection.timezone || "America/Sao_Paulo",
        JSON.stringify(sourceConnection.allowedWeekdays || [1, 2, 3, 4, 5]),
        Math.min(sourceConnection.dailyLimit || 20, 20),
        sourceConnection.sendWindowStart || "09:00",
        sourceConnection.sendWindowEnd || "17:00",
      ],
    )
    const connectionId = connectionResult.rows[0].id

    await remoteClient.query(
      `DELETE FROM whatsapp_template WHERE "connectionId" = $1`,
      [connectionId],
    )
    await remoteClient.query(
      `INSERT INTO whatsapp_template
         (id, "connectionId", "metaTemplateId", name, language, category,
          status, components, supported, "syncedAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', $7, true, now(), now())`,
      [
        `meta-review-template-${sourceTemplate.metaTemplateId}`,
        connectionId,
        sourceTemplate.metaTemplateId,
        sourceTemplate.name,
        sourceTemplate.language,
        sourceTemplate.category,
        JSON.stringify(sourceTemplate.components),
      ],
    )

    await remoteClient.query(
      `INSERT INTO discovery_job
         (id, "businessId", "userId", name, country, state, city, location,
          keywords, "maxResults", "serviceArea", status, "createdAt",
          "startedAt", "completedAt", "totalFound", "insertedLeads",
          "duplicateLeads", "completedQueries", attempts, runs,
          "searchDepth", exhausted)
       VALUES
         ($1, $2, $3, 'Meta Review — Synthetic Demo', 'United States', 'CA',
          'San Francisco', 'San Francisco, CA, United States',
          'synthetic B2B review lead', 1, 'United States', 'completed',
          now(), now(), now(), 1, 1, 0, 1, 1, 0, 0, true)
       ON CONFLICT (id) DO UPDATE SET
         "businessId" = EXCLUDED."businessId",
         "userId" = EXCLUDED."userId",
         status = 'completed',
         "completedAt" = now(),
         "totalFound" = 1,
         "insertedLeads" = 1,
         "completedQueries" = 1,
         exhausted = true`,
      [REVIEW_JOB_ID, businessId, userId],
    )

    await remoteClient.query(
      `INSERT INTO lead
         (id, "jobId", "businessId", name, website, "websiteDomain", email,
          phone, address, city, state, country, description, source, phones,
          services, "aiSummary", score, "scoreBreakdown", status,
          "emailVerified", "createdAt")
       VALUES
         ($1, $2, $3, 'Meta Review Demo Company', 'https://example.com',
          'example.com', 'meta-review@example.com', $4,
          'Synthetic address — not a real business', 'San Francisco', 'CA',
          'United States', $5, 'meta_app_review', $6, $7, $8, 0.95, $9,
          'new', false, now())
       ON CONFLICT (id) DO UPDATE SET
         "jobId" = EXCLUDED."jobId",
         "businessId" = EXCLUDED."businessId",
         name = EXCLUDED.name,
         website = EXCLUDED.website,
         "websiteDomain" = EXCLUDED."websiteDomain",
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         address = EXCLUDED.address,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         country = EXCLUDED.country,
         description = EXCLUDED.description,
         source = EXCLUDED.source,
         phones = EXCLUDED.phones,
         services = EXCLUDED.services,
         "aiSummary" = EXCLUDED."aiSummary",
         score = EXCLUDED.score,
         "scoreBreakdown" = EXCLUDED."scoreBreakdown",
         status = 'new'`,
      [
        REVIEW_LEAD_ID,
        REVIEW_JOB_ID,
        businessId,
        REVIEW_PHONE,
        "Synthetic company created only for Meta App Review. The phone number is non-routable and no messages are scheduled.",
        JSON.stringify([REVIEW_PHONE]),
        JSON.stringify(["B2B consulting", "Lead generation"]),
        "Synthetic qualified B2B opportunity used to demonstrate consent, template preview, and send-time guardrails.",
        JSON.stringify({
          fit: 95,
          reason: "Synthetic high-fit example for reviewer workflow validation",
        }),
      ],
    )

    await remoteClient.query(
      `INSERT INTO whatsapp_consent_event
         (id, "businessId", "leadId", "recordedByUserId", "phoneE164",
          status, purpose, source, "capturedAt", "evidenceReference",
          "evidenceNote")
       VALUES
         ($1, $2, $3, $4, $5, 'granted', 'marketing', 'written', now(),
          'meta-app-review-synthetic-consent', $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        REVIEW_CONSENT_ID,
        businessId,
        REVIEW_LEAD_ID,
        userId,
        REVIEW_PHONE,
        "Synthetic written opt-in created only for Meta App Review. It does not represent a real person or recipient.",
      ],
    )

    const verificationResult = await remoteClient.query(
      `SELECT
         (SELECT count(*)::int FROM lead WHERE "businessId" = $1) AS leads,
         (SELECT count(*)::int FROM whatsapp_connection WHERE "businessId" = $1 AND status = 'connected') AS connections,
         (SELECT count(*)::int FROM whatsapp_template wt
            JOIN whatsapp_connection wc ON wc.id = wt."connectionId"
            WHERE wc."businessId" = $1 AND wt.status = 'APPROVED'
              AND wt.category = 'MARKETING' AND wt.supported = true) AS templates,
         (SELECT count(*)::int FROM whatsapp_consent_event
            WHERE "businessId" = $1 AND status = 'granted') AS consents,
         (SELECT count(*)::int FROM whatsapp_sequence WHERE "businessId" = $1) AS sequences,
         (SELECT count(*)::int FROM subscription
            WHERE "referenceId" = $2 AND plan = 'pro' AND status = 'active'
              AND "periodEnd" > now()) AS "activeProEntitlements"`,
      [businessId, userId],
    )

    await remoteClient.query("COMMIT")
    console.log(
      JSON.stringify({
        ok: true,
        environment: TARGET_ENVIRONMENT,
        workspace: REVIEW_BUSINESS_NAME,
        ...verificationResult.rows[0],
      }),
    )
  } catch (error) {
    if (remoteClient) await remoteClient.query("ROLLBACK").catch(() => {})
    throw error
  } finally {
    if (remoteClient) remoteClient.release()
    await Promise.allSettled([localPool.end(), remotePool.end()])
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
