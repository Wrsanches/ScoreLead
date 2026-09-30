CREATE TABLE "github_authorization" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"businessId" text NOT NULL,
	"githubLogin" text NOT NULL,
	"encryptedToken" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_oauth_state" (
	"hash" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"businessId" text NOT NULL,
	"verifierEncrypted" text NOT NULL,
	"locale" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_connection" ADD COLUMN "authType" text DEFAULT 'token' NOT NULL;--> statement-breakpoint
ALTER TABLE "github_connection" ADD COLUMN "installationId" text;--> statement-breakpoint
ALTER TABLE "github_connection" ADD COLUMN "repositoryId" text;--> statement-breakpoint
ALTER TABLE "github_connection" ADD COLUMN "githubLogin" text;--> statement-breakpoint
ALTER TABLE "github_authorization" ADD CONSTRAINT "github_authorization_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_authorization" ADD CONSTRAINT "github_authorization_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_oauth_state" ADD CONSTRAINT "github_oauth_state_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_oauth_state" ADD CONSTRAINT "github_oauth_state_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_authorization_actor_business_uidx" ON "github_authorization" USING btree ("userId","businessId");