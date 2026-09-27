CREATE TABLE "google_reporting_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"resourceId" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fetchedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_reporting_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"connectedBy" text NOT NULL,
	"provider" text NOT NULL,
	"subject" text NOT NULL,
	"email" text NOT NULL,
	"accessTokenEncrypted" text NOT NULL,
	"refreshTokenEncrypted" text NOT NULL,
	"tokenExpiresAt" timestamp with time zone NOT NULL,
	"scopes" text[] NOT NULL,
	"status" text DEFAULT 'connected' NOT NULL,
	"lastError" text,
	"lastCheckedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_reporting_oauth_state" (
	"hash" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"businessId" text NOT NULL,
	"provider" text NOT NULL,
	"verifierEncrypted" text NOT NULL,
	"locale" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_reporting_resource" (
	"id" text PRIMARY KEY NOT NULL,
	"connectionId" text NOT NULL,
	"externalId" text NOT NULL,
	"name" text NOT NULL,
	"selected" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reporting_mcp_authorization" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"redirectUri" text NOT NULL,
	"challenge" text NOT NULL,
	"state" text,
	"scope" text NOT NULL,
	"audience" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"decidedAt" timestamp with time zone,
	"codeHash" text,
	"codeExpiresAt" timestamp with time zone,
	"codeUsedAt" timestamp with time zone,
	"grantId" text,
	CONSTRAINT "reporting_mcp_authorization_codeHash_unique" UNIQUE("codeHash")
);
--> statement-breakpoint
CREATE TABLE "reporting_mcp_client" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"redirectUris" text[] NOT NULL,
	"scopes" text[] NOT NULL,
	"grantTypes" text[] NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reporting_mcp_grant" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"userId" text NOT NULL,
	"businessId" text NOT NULL,
	"resourceIds" text[] NOT NULL,
	"scope" text NOT NULL,
	"audience" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"revokedAt" timestamp with time zone,
	"lastUsedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reporting_mcp_token" (
	"hash" text PRIMARY KEY NOT NULL,
	"grantId" text NOT NULL,
	"kind" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"usedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reporting_rate_bucket" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "google_reporting_cache" ADD CONSTRAINT "google_reporting_cache_resourceId_google_reporting_resource_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."google_reporting_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_reporting_connection" ADD CONSTRAINT "google_reporting_connection_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_reporting_connection" ADD CONSTRAINT "google_reporting_connection_connectedBy_user_id_fk" FOREIGN KEY ("connectedBy") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_reporting_oauth_state" ADD CONSTRAINT "google_reporting_oauth_state_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_reporting_oauth_state" ADD CONSTRAINT "google_reporting_oauth_state_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_reporting_resource" ADD CONSTRAINT "google_reporting_resource_connectionId_google_reporting_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."google_reporting_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_mcp_authorization" ADD CONSTRAINT "reporting_mcp_authorization_clientId_reporting_mcp_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."reporting_mcp_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_mcp_authorization" ADD CONSTRAINT "reporting_mcp_authorization_grantId_reporting_mcp_grant_id_fk" FOREIGN KEY ("grantId") REFERENCES "public"."reporting_mcp_grant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_mcp_grant" ADD CONSTRAINT "reporting_mcp_grant_clientId_reporting_mcp_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."reporting_mcp_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_mcp_grant" ADD CONSTRAINT "reporting_mcp_grant_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_mcp_grant" ADD CONSTRAINT "reporting_mcp_grant_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporting_mcp_token" ADD CONSTRAINT "reporting_mcp_token_grantId_reporting_mcp_grant_id_fk" FOREIGN KEY ("grantId") REFERENCES "public"."reporting_mcp_grant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "google_reporting_cache_expiry_idx" ON "google_reporting_cache" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "google_reporting_account_uidx" ON "google_reporting_connection" USING btree ("businessId","provider","subject");--> statement-breakpoint
CREATE INDEX "google_reporting_state_expiry_idx" ON "google_reporting_oauth_state" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "google_reporting_resource_uidx" ON "google_reporting_resource" USING btree ("connectionId","externalId");--> statement-breakpoint
CREATE INDEX "reporting_mcp_auth_expiry_idx" ON "reporting_mcp_authorization" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "reporting_mcp_grant_business_idx" ON "reporting_mcp_grant" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "reporting_mcp_token_grant_idx" ON "reporting_mcp_token" USING btree ("grantId");--> statement-breakpoint
CREATE INDEX "reporting_mcp_token_expiry_idx" ON "reporting_mcp_token" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "reporting_rate_expiry_idx" ON "reporting_rate_bucket" USING btree ("expiresAt");