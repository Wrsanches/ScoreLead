import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export type NotificationPreferences = {
  leadAlerts: boolean
  weeklyDigest: boolean
  productUpdates: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  leadAlerts: true,
  weeklyDigest: true,
  productUpdates: false,
}

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  stripeCustomerId: text("stripeCustomerId"),
  notificationPreferences: jsonb("notificationPreferences")
    .$type<NotificationPreferences>()
    .notNull()
    .default(DEFAULT_NOTIFICATION_PREFERENCES),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const business = pgTable("business", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  website: text("website"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  linkedin: text("linkedin"),
  other: text("other"),
  location: text("location"),
  name: text("name"),
  description: text("description"),
  persona: text("persona"),
  clientPersona: text("clientPersona"),
  field: text("field"),
  category: text("category"),
  tags: text("tags"),
  logo: text("logo"),
  language: text("language"),
  brandColors: jsonb("brandColors").$type<string[]>(),
  brandColorPrimary: text("brandColorPrimary"),
  brandColorSecondary: text("brandColorSecondary"),
  brandFonts: jsonb("brandFonts").$type<string[]>(),
  brandStyle: text("brandStyle"),
  businessModel: text("businessModel"),
  services: text("services"),
  serviceArea: text("serviceArea"),
  competitors: text("competitors"),
  suggestedKeywords: jsonb("suggestedKeywords").$type<string[]>(),
  lastDiscoveryKeywords: jsonb("lastDiscoveryKeywords").$type<string[]>(),
  onboardingCompleted: boolean("onboardingCompleted").notNull().default(false),
  onboardingStep: text("onboardingStep").notNull().default("links"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const savedSearch = pgTable("saved_search", {
  id: text("id").primaryKey(),
  businessId: text("businessId")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  country: text("country").notNull(),
  state: text("state"),
  city: text("city"),
  location: text("location").notNull(),
  keywords: jsonb("keywords").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const discoveryJob = pgTable("discovery_job", {
  id: text("id").primaryKey(),
  businessId: text("businessId")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  country: text("country").notNull(),
  state: text("state"),
  city: text("city"),
  location: text("location").notNull(),
  keywords: text("keywords").notNull(),
  maxResults: integer("maxResults").notNull(),
  serviceArea: text("serviceArea").notNull(),
  status: text("status").notNull().default("queued"),
  totalFound: integer("totalFound").notNull().default(0),
  insertedLeads: integer("insertedLeads").notNull().default(0),
  duplicateLeads: integer("duplicateLeads").notNull().default(0),
  completedQueries: integer("completedQueries").notNull().default(0),
  currentQuery: text("currentQuery"),
  errorMessage: text("errorMessage"),
  // Batched discovery: a job runs in parts. Each "Continue" run pages one
  // level deeper into Google Places and accumulates onto the same row.
  runs: integer("runs").notNull().default(0), // # of Continue batches run after the first
  searchDepth: integer("searchDepth").notNull().default(0), // Places page-depth cursor (0 = page 1 only)
  exhausted: boolean("exhausted").notNull().default(false), // mirrors status; gates the Continue action
  // Queue bookkeeping: workers bump heartbeatAt while running so stalled
  // jobs (killed instance, crashed worker) can be detected and requeued.
  attempts: integer("attempts").notNull().default(0),
  heartbeatAt: timestamp("heartbeatAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
}, (table) => [
  index("discovery_job_status_idx").on(table.status),
  index("discovery_job_user_idx").on(table.userId),
  index("discovery_job_business_idx").on(table.businessId),
])

export const lead = pgTable("lead", {
  id: text("id").primaryKey(),
  jobId: text("jobId")
    .notNull()
    .references(() => discoveryJob.id, { onDelete: "cascade" }),
  businessId: text("businessId")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  // Core identity
  name: text("name"),
  website: text("website"),
  websiteDomain: text("websiteDomain"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  description: text("description"),
  // Google Places data
  googlePlaceId: text("googlePlaceId"),
  googleMapsUrl: text("googleMapsUrl"),
  googleRating: real("googleRating"),
  googleReviewCount: integer("googleReviewCount"),
  lat: real("lat"),
  lng: real("lng"),
  priceRange: text("priceRange"),
  photoUrl: text("photoUrl"),
  googleReviews: jsonb("googleReviews").$type<{ author: string; rating: number; text: string; date: string }[]>(),
  // Contact & social
  emails: jsonb("emails").$type<string[]>(),
  phones: jsonb("phones").$type<string[]>(),
  socialMedia: jsonb("socialMedia").$type<Record<string, string>>(),
  instagramHandle: text("instagramHandle"),
  facebookUrl: text("facebookUrl"),
  // Enrichment data
  services: jsonb("services").$type<string[]>(),
  ownerName: text("ownerName"),
  teamMembers: jsonb("teamMembers").$type<{ name: string; role?: string }[]>(),
  operatingHours: text("operatingHours"),
  yearEstablished: text("yearEstablished"),
  pricingInfo: text("pricingInfo"),
  amenities: jsonb("amenities").$type<string[]>(),
  aiSummary: text("aiSummary"),
  websiteContent: text("websiteContent"),
  enrichmentSources: jsonb("enrichmentSources").$type<string[]>(),
  // Firmographics (Apollo.io enrichment)
  industry: text("industry"),
  employeeCount: integer("employeeCount"),
  revenueRange: text("revenueRange"),
  techStack: jsonb("techStack").$type<string[]>(),
  decisionMakers: jsonb("decisionMakers").$type<
    { name: string; title?: string; linkedin?: string; email?: string }[]
  >(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  outreachMessages: jsonb("outreachMessages").$type<{ step: number; label: string; subject?: string; body: string }[]>(),
  // Scoring
  score: real("score").notNull().default(1),
  scoreBreakdown: jsonb("scoreBreakdown").$type<{
    positives: { label: string; value: number; category: string }[]
    risks: { label: string; value: number; category: string }[]
    categories: Record<string, number>
  }>(),
  // Relevance: graded 0-1 fit against the search context (was a binary flag).
  relevanceScore: real("relevanceScore"),
  relevanceReason: text("relevanceReason"),
  // Discovery metadata
  source: text("source").notNull(),
  firecrawlEnriched: boolean("firecrawlEnriched").notNull().default(false),
  discoveryQuery: text("discoveryQuery"),
  discoveryQueries: jsonb("discoveryQueries").$type<string[]>(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [
  index("lead_business_idx").on(table.businessId),
  index("lead_job_idx").on(table.jobId),
])

/**
 * One customer-owned WhatsApp Business Platform connection per ScoreLead
 * business. Access tokens are encrypted before they reach this table.
 */
export const whatsappConnection = pgTable("whatsapp_connection", {
  id: text("id").primaryKey(),
  businessId: text("businessId")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  wabaId: text("wabaId").notNull(),
  phoneNumberId: text("phoneNumberId").notNull(),
  displayPhoneNumber: text("displayPhoneNumber"),
  verifiedName: text("verifiedName"),
  status: text("status").notNull().default("connected"),
  encryptedAccessToken: text("encryptedAccessToken"),
  tokenKeyVersion: integer("tokenKeyVersion").notNull().default(1),
  timezone: text("timezone").notNull().default("UTC"),
  allowedWeekdays: jsonb("allowedWeekdays")
    .$type<number[]>()
    .notNull()
    .default([1, 2, 3, 4, 5]),
  dailyLimit: integer("dailyLimit").notNull().default(20),
  sendWindowStart: text("sendWindowStart").notNull().default("09:00"),
  sendWindowEnd: text("sendWindowEnd").notNull().default("17:00"),
  connectedAt: timestamp("connectedAt").notNull().defaultNow(),
  disconnectedAt: timestamp("disconnectedAt"),
  lastTemplateSyncAt: timestamp("lastTemplateSyncAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("whatsapp_connection_business_uidx").on(table.businessId),
  uniqueIndex("whatsapp_connection_phone_number_uidx").on(table.phoneNumberId),
  index("whatsapp_connection_waba_idx").on(table.wabaId),
])

/** One-time server-side nonce binding Embedded Signup to a user + business. */
export const whatsappSignupNonce = pgTable("whatsapp_signup_nonce", {
  id: text("id").primaryKey(),
  businessId: text("businessId")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [
  index("whatsapp_signup_nonce_business_idx").on(table.businessId),
  index("whatsapp_signup_nonce_expires_idx").on(table.expiresAt),
])

export type WhatsAppTemplateComponent = {
  type: string
  format?: string
  text?: string
  buttons?: Array<Record<string, unknown>>
  example?: Record<string, unknown>
}

/** Local cache of Meta templates; only supported approved marketing rows are selectable. */
export const whatsappTemplate = pgTable("whatsapp_template", {
  id: text("id").primaryKey(),
  connectionId: text("connectionId")
    .notNull()
    .references(() => whatsappConnection.id, { onDelete: "cascade" }),
  metaTemplateId: text("metaTemplateId").notNull(),
  name: text("name").notNull(),
  language: text("language").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  components: jsonb("components").$type<WhatsAppTemplateComponent[]>().notNull(),
  supported: boolean("supported").notNull().default(false),
  rejectionReason: text("rejectionReason"),
  syncedAt: timestamp("syncedAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("whatsapp_template_meta_uidx").on(table.connectionId, table.metaTemplateId),
  index("whatsapp_template_selectable_idx").on(table.connectionId, table.status, table.supported),
])

/** Append-only WhatsApp marketing-consent audit log. */
export const whatsappConsentEvent = pgTable("whatsapp_consent_event", {
  id: text("id").primaryKey(),
  businessId: text("businessId")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  leadId: text("leadId")
    .notNull()
    .references(() => lead.id, { onDelete: "cascade" }),
  recordedByUserId: text("recordedByUserId")
    .references(() => user.id, { onDelete: "cascade" }),
  phoneE164: text("phoneE164").notNull(),
  status: text("status").notNull(),
  purpose: text("purpose").notNull().default("marketing"),
  source: text("source").notNull(),
  capturedAt: timestamp("capturedAt").notNull(),
  evidenceReference: text("evidenceReference"),
  evidenceNote: text("evidenceNote"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [
  index("whatsapp_consent_lead_phone_idx").on(table.leadId, table.phoneE164, table.createdAt),
  index("whatsapp_consent_business_phone_idx").on(table.businessId, table.phoneE164, table.createdAt),
])

export type WhatsAppTemplateParameter = {
  type: "text"
  parameterName?: string
  text: string
}

export type WhatsAppConsentSnapshot = {
  eventId: string
  status: "granted"
  phoneE164: string
  purpose: string
  source: string
  capturedAt: string
  evidenceReference: string | null
}

export const whatsappSequence = pgTable("whatsapp_sequence", {
  id: text("id").primaryKey(),
  businessId: text("businessId")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  leadId: text("leadId")
    .notNull()
    .references(() => lead.id, { onDelete: "cascade" }),
  connectionId: text("connectionId")
    .notNull()
    .references(() => whatsappConnection.id, { onDelete: "cascade" }),
  recipientPhone: text("recipientPhone").notNull(),
  status: text("status").notNull().default("draft"),
  timezone: text("timezone").notNull(),
  consentSnapshot: jsonb("consentSnapshot").$type<WhatsAppConsentSnapshot>(),
  approvedByUserId: text("approvedByUserId").references(() => user.id, { onDelete: "set null" }),
  approvedAt: timestamp("approvedAt"),
  pausedAt: timestamp("pausedAt"),
  pauseReason: text("pauseReason"),
  completedAt: timestamp("completedAt"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [
  index("whatsapp_sequence_lead_idx").on(table.leadId, table.createdAt),
  index("whatsapp_sequence_recipient_idx").on(table.businessId, table.recipientPhone, table.status),
  uniqueIndex("whatsapp_sequence_active_recipient_uidx")
    .on(table.businessId, table.recipientPhone)
    .where(sql`${table.status} = 'scheduled'`),
])

export const whatsappSequenceStep = pgTable("whatsapp_sequence_step", {
  id: text("id").primaryKey(),
  sequenceId: text("sequenceId")
    .notNull()
    .references(() => whatsappSequence.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  offsetDays: integer("offsetDays").notNull(),
  localSendTime: text("localSendTime").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: text("status").notNull().default("queued"),
  metaTemplateId: text("metaTemplateId").notNull(),
  templateName: text("templateName").notNull(),
  templateLanguage: text("templateLanguage").notNull(),
  templateComponents: jsonb("templateComponents").$type<WhatsAppTemplateComponent[]>().notNull(),
  templateParameters: jsonb("templateParameters").$type<WhatsAppTemplateParameter[]>().notNull(),
  renderedBody: text("renderedBody").notNull(),
  metaMessageId: text("metaMessageId"),
  attemptCount: integer("attemptCount").notNull().default(0),
  retryAt: timestamp("retryAt"),
  requestStartedAt: timestamp("requestStartedAt"),
  acceptedAt: timestamp("acceptedAt"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  failedAt: timestamp("failedAt"),
  errorCode: text("errorCode"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("whatsapp_sequence_step_position_uidx").on(table.sequenceId, table.position),
  uniqueIndex("whatsapp_sequence_step_message_uidx").on(table.metaMessageId),
  index("whatsapp_sequence_step_queue_idx").on(table.status, table.scheduledAt, table.retryAt),
])

/** Minimal reply record for pause-and-handoff; this is intentionally not a full inbox. */
export const whatsappInboundMessage = pgTable("whatsapp_inbound_message", {
  id: text("id").primaryKey(),
  connectionId: text("connectionId")
    .notNull()
    .references(() => whatsappConnection.id, { onDelete: "cascade" }),
  leadId: text("leadId").references(() => lead.id, { onDelete: "set null" }),
  metaMessageId: text("metaMessageId").notNull(),
  fromPhone: text("fromPhone").notNull(),
  messageType: text("messageType").notNull(),
  textBody: text("textBody"),
  receivedAt: timestamp("receivedAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("whatsapp_inbound_message_meta_uidx").on(table.metaMessageId),
  index("whatsapp_inbound_message_recipient_idx").on(table.connectionId, table.fromPhone, table.receivedAt),
])

/** Small idempotency ledger for delivery and template-status webhook changes. */
export const whatsappWebhookEvent = pgTable("whatsapp_webhook_event", {
  id: text("id").primaryKey(),
  eventKey: text("eventKey").notNull(),
  eventType: text("eventType").notNull(),
  processedAt: timestamp("processedAt").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("whatsapp_webhook_event_key_uidx").on(table.eventKey),
])

export const contentPost = pgTable("content_post", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  businessId: text("businessId")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("instagram"),
  scheduledFor: timestamp("scheduledFor").notNull(),
  postType: text("postType").notNull().default("single"),
  pillar: text("pillar"),
  caption: text("caption").notNull().default(""),
  hashtags: jsonb("hashtags").$type<string[]>().default([]),
  visualIdea: text("visualIdea"),
  callToAction: text("callToAction"),
  images: jsonb("images").$type<
    { url: string; headline: string; prompt: string }[]
  >(),
  status: text("status").notNull().default("draft"),
  aiGenerated: boolean("aiGenerated").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Managed by the @better-auth/stripe plugin. Field names must match what the
// plugin reads/writes. referenceId is the user id (account-level subscription).
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull(),
  referenceId: text("referenceId").notNull(),
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  status: text("status").notNull(),
  periodStart: timestamp("periodStart"),
  periodEnd: timestamp("periodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd"),
  cancelAt: timestamp("cancelAt"),
  canceledAt: timestamp("canceledAt"),
  endedAt: timestamp("endedAt"),
  seats: integer("seats"),
  trialStart: timestamp("trialStart"),
  trialEnd: timestamp("trialEnd"),
  billingInterval: text("billingInterval"),
  stripeScheduleId: text("stripeScheduleId"),
})

// Custom freemium usage metering. One row per user. Lifetime counters enforce
// the Free caps; aiImagesMonth/Day(+key) enforce Pro image fair-use caps.
export const usage = pgTable("usage", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  discoveryJobs: integer("discoveryJobs").notNull().default(0),
  outreachMessages: integer("outreachMessages").notNull().default(0),
  contentPlans: integer("contentPlans").notNull().default(0),
  aiImages: integer("aiImages").notNull().default(0),
  aiImagesMonth: integer("aiImagesMonth").notNull().default(0),
  aiImagesMonthKey: text("aiImagesMonthKey"),
  aiImagesDay: integer("aiImagesDay").notNull().default(0),
  aiImagesDayKey: text("aiImagesDayKey"),
  // Apollo enrichment fair-use (Pro): lifetime + monthly counters.
  apolloEnrichments: integer("apolloEnrichments").notNull().default(0),
  apolloEnrichmentsMonth: integer("apolloEnrichmentsMonth").notNull().default(0),
  apolloEnrichmentsMonthKey: text("apolloEnrichmentsMonthKey"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
