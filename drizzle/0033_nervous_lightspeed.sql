CREATE TABLE "instagram_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"instagramUserId" text NOT NULL,
	"oauthUserId" text NOT NULL,
	"username" text NOT NULL,
	"accessTokenEncrypted" text,
	"status" text DEFAULT 'connected' NOT NULL,
	"tokenExpiresAt" timestamp with time zone NOT NULL,
	"refreshAfter" timestamp with time zone NOT NULL,
	"connectedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_oauth_state" (
	"hash" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"businessId" text NOT NULL,
	"locale" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_publication" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"connectionId" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduledAt" timestamp with time zone NOT NULL,
	"timeZone" text NOT NULL,
	"caption" text NOT NULL,
	"mediaUrls" jsonb NOT NULL,
	"childContainerIds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"containerId" text,
	"containerCreatedAt" timestamp with time zone,
	"publishAttemptedAt" timestamp with time zone,
	"instagramMediaId" text,
	"permalink" text,
	"publishedAt" timestamp with time zone,
	"errorCode" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"nextAttemptAt" timestamp with time zone NOT NULL,
	"leaseToken" text,
	"leaseExpiresAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instagram_connection" ADD CONSTRAINT "instagram_connection_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_oauth_state" ADD CONSTRAINT "instagram_oauth_state_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_oauth_state" ADD CONSTRAINT "instagram_oauth_state_businessId_business_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_publication" ADD CONSTRAINT "instagram_publication_postId_content_post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."content_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_publication" ADD CONSTRAINT "instagram_publication_connectionId_instagram_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."instagram_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_connection_business_uidx" ON "instagram_connection" USING btree ("businessId");--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_connection_account_uidx" ON "instagram_connection" USING btree ("instagramUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_publication_post_uidx" ON "instagram_publication" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "instagram_publication_queue_idx" ON "instagram_publication" USING btree ("status","nextAttemptAt");