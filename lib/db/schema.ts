import { pgTable, text, timestamp, boolean, integer, real, jsonb } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
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
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
})

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
  outreachMessages: jsonb("outreachMessages").$type<{ step: number; label: string; subject?: string; body: string }[]>(),
  // Scoring
  score: real("score").notNull().default(1),
  scoreBreakdown: jsonb("scoreBreakdown").$type<{
    positives: { label: string; value: number; category: string }[]
    risks: { label: string; value: number; category: string }[]
    categories: Record<string, number>
  }>(),
  // Discovery metadata
  source: text("source").notNull(),
  firecrawlEnriched: boolean("firecrawlEnriched").notNull().default(false),
  discoveryQuery: text("discoveryQuery"),
  discoveryQueries: jsonb("discoveryQueries").$type<string[]>(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

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
