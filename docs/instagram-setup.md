# Instagram publishing

ScoreLead uses **Instagram API with Instagram Login** in the existing Meta app. Each business connects one professional Instagram account (Business or Creator). Customers authorize profile access and publishing; no passwords or access tokens are accepted in the UI. A single Instagram account cannot belong to multiple ScoreLead businesses.

The first version publishes single photos and carousels of 2–10 photos. Stories and Reels remain editorial drafts. Saving/approving a draft does not authorize publication: the user explicitly clicks **Schedule on Instagram**.

## Meta configuration

The ScoreLead app already has a verified business and technology provider, and approved WhatsApp permissions. Those approvals do not include Instagram publishing.

1. Open the existing **ScoreLead** app in Meta for Developers, add **Manage messaging & content on Instagram**, and choose **API setup with Instagram login**.
2. Use the **Instagram App ID and Instagram App Secret** shown within that setup as `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`. Do not reuse the parent WhatsApp/Meta credentials.
3. Register the exact OAuth redirect URI: `https://app.scorelead.io/api/instagram/callback`. Set `INSTAGRAM_REDIRECT_URI` to the same value. Test/staging origins need their own exact registered URI and environment settings.
4. Configure deauthorization callback: `https://app.scorelead.io/api/instagram/deauthorize`. This endpoint verifies Meta's signed request, erases the connection token and cancels unsent publications. Configure data-deletion callback: `https://app.scorelead.io/api/instagram/data-deletion`. It validates the signed request, deletes the provider's account identifiers, username, tokens, container/media identifiers and links, cancels unsent publications, and returns an authenticated confirmation receipt. Authored ScoreLead drafts and duplicate-prevention status remain. Keep the app's privacy policy and full account-deletion instructions URLs current.
5. Request **instagram_business_basic** and **instagram_business_content_publish**. Before testing, open **App roles → Roles → Add people**, choose **Instagram Tester**, and select the exact Instagram handle from the suggestions. The account owner must accept the invitation under **Instagram → Apps and websites → Tester Invites** at `https://www.instagram.com/accounts/manage_access/`. A pending invitation is insufficient; completing OAuth consent alone also does not complete this tester setup. Submit the functioning connection, photo upload, scheduling, cancellation and disconnect flow for App Review / Advanced Access before onboarding unrelated customer businesses.
6. Generate a separate `INSTAGRAM_TOKEN_ENCRYPTION_KEY` with `openssl rand -base64 32`. Store it only on the server; losing it requires reconnecting accounts. Tokens use AES-256-GCM with the business ID as authenticated data.

Customer activation stays disabled until `INSTAGRAM_INTEGRATION_ENABLED=true` and all required credentials are configured. Never enable a staging worker against the production database.

During App Review, set `INSTAGRAM_ALLOWED_BUSINESS_IDS` to the comma-separated IDs of the approved test workspaces before enabling the integration. Connection, OAuth callback, and scheduling enforce this list on the server; other workspaces keep the unavailable state. After Advanced Access approval, clear the list to enable customer onboarding. Existing authorized jobs can still complete/reconcile when a workspace is removed from the rollout list.

Configuration verified in the Meta dashboard on 2026-09-11: the Instagram case is installed in parent app `27622597120683836`; its Instagram app is **ScoreLead-IG**, ID `1109926375021798`. The production OAuth, deauthorization and data-deletion URLs above are saved. Both `instagram_business_basic` and `instagram_business_content_publish` are added and marked **Ready for testing**, with no successful test calls yet. This is not Advanced Access approval. No messaging, comments or insights permissions were requested.

Official references: [Instagram Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login.md), [publishing](https://developers.facebook.com/documentation/instagram-platform/content-publishing.md), [App Review](https://developers.facebook.com/documentation/instagram-platform/app-review.md).

## Database and execution

Deploy migrations `0033_nervous_lightspeed.sql` and `0034_keen_goliath.sql` before starting the new version. Railway already runs `bun run db:migrate` before deploy. The second migration releases the account uniqueness constraint for disconnected connections, allowing an account to move to another ScoreLead business.

On a persistent Node server (Railway), `instrumentation.ts` runs the Instagram queue at startup and every 30 seconds when enabled. PostgreSQL leases prevent multiple replicas from sending the same job. On serverless hosting, run this endpoint at least once a minute:

```text
GET /api/jobs/instagram/pump
Authorization: Bearer <CRON_SECRET>
```

Do not rely on an open browser tab or on Next.js `after()` for scheduled publication. Short interruptions are recovered at the next pump. Processing delay and Meta availability mean the chosen time is a target, not a real-time guarantee. Posts delayed more than one hour fail for explicit rescheduling rather than appearing unexpectedly much later.

Long-lived access tokens refresh after 30 days; failures retry hourly while the token remains valid. Expired/revoked tokens require reconnecting. Workers continue refreshing connected accounts even with no upcoming posts.

## Media and scheduling

- Original images must already belong to the post in ScoreLead's S3 storage; arbitrary remote URLs are never fetched by the publisher.
- At scheduling time, images are copied into immutable JPEG files under `instagram-publications/<publication-id>/`. PNG and WebP are accepted as inputs; images are oriented, EXIF metadata removed, converted to sRGB and fitted into 1080×1350 with white margins. The original image is preserved without cropping. Input limit: 8 MB and 40 million pixels.
- Publication stores an immutable caption, media list, UTC instant and IANA time zone. The editor explicitly displays the browser's time zone. Ambiguous DST hours are rejected.
- Meta containers are created close to the scheduled time (within 15 minutes), since unpublished containers expire after 24 hours. `media_publish` is called only when due and processing has finished.
- Scheduled, publishing, published and uncertain posts cannot be edited or deleted through the calendar. Cancel unsent schedules first. Publishing/cancellation use the same row locks as content changes.
- The attempt marker is committed **before** the final network request. If the process crashes or a response is lost, recovery checks that same container's status. It never blindly repeats `media_publish` or creates a new container after an uncertain send. A confirmed `PUBLISHED` container completes the job, even if its media ID/permalink could not be recovered. An unresolved outcome becomes **Check Instagram** (`needs_review`); an operator must verify the profile before any manual resolution. This favors preventing duplicate public posts over automatic retries of uncertain sends.
- A provider-confirmed media processing error can be corrected and scheduled again. Disconnect cancels unsent work; a final send already in progress finishes before disconnect can remove its token.

Configure S3 lifecycle cleanup for the `instagram-publications/` prefix, retaining objects at least **370 days** because users can schedule up to one year ahead. Replaced failed/cancelled schedules clean up their old copies immediately. User-uploaded originals follow the existing content-calendar lifecycle.

## Validation

If the Instagram authorization screen succeeds but no connection appears, check the persistent error beneath the connection card and the server's `[instagram] OAuth connection failed` diagnostic. It identifies token exchange, profile lookup, or saving as the failed stage; token exchange also distinguishes the authorization-code exchange from the long-lived-token exchange. Diagnostics redact request credentials and URLs. An error 100 with `Unsupported request - method type: get` does not by itself establish that the HTTP method is wrong: Meta documents GET for the long-lived-token exchange. For an app without Advanced Access, verify the exact Instagram account's accepted tester role and permission access before changing the documented request.

Unit tests make no real API calls:

```sh
bun test lib/instagram
```

Database tests mock Instagram, but exercise real PostgreSQL leases, transaction boundaries, cancellation, OAuth state consumption and recovery. Run migrations against a **disposable local database whose name ends in `_test`**, then:

```sh
DATABASE_URL=postgresql://<local-user>@127.0.0.1:<port>/scorelead_instagram_test bun run db:migrate
DATABASE_URL=postgresql://<local-user>@127.0.0.1:<port>/scorelead_instagram_test bun test ./lib/jobs/instagram-queue.integration.ts
```

The integration test fails closed for non-local databases. Production acceptance still requires an authorized Meta test account, a real upload and an explicitly approved test publication, followed by token refresh and disconnect checks.
