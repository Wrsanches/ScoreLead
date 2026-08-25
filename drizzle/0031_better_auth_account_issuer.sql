ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "account"
SET "issuer" = CASE
	WHEN "providerId" = 'credential' THEN 'local:credential'
	WHEN "providerId" = 'google' THEN 'https://accounts.google.com'
END;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "account" WHERE "issuer" IS NULL) THEN
		RAISE EXCEPTION 'Unsupported account provider found while backfilling issuer';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "account"
		GROUP BY "issuer", "accountId"
		HAVING COUNT(*) > 1
	) THEN
		RAISE EXCEPTION 'Duplicate account issuer/accountId identity found';
	END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" USING btree ("issuer","accountId");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");
