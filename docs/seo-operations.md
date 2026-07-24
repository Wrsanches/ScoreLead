# ScoreLead SEO and GEO Operations

This runbook covers the external steps that cannot be completed from the
repository alone: search-engine ownership, production submission, monitoring,
and legitimate authority building.

## Production setup

1. Keep the Google Search Console DNS verification record in place. Bing
   ownership is inherited by importing the verified Google property, so no
   search-console verification environment variables are required.
2. Generate independent IndexNow values:

   ```sh
   openssl rand -hex 16
   ```

   Store one as `INDEXNOW_KEY` and the other as
   `INDEXNOW_WEBHOOK_SECRET`. Never prefix either with `NEXT_PUBLIC_`.
3. Deploy, then confirm:

   - `https://scorelead.io/robots.txt` returns 200.
   - `https://scorelead.io/sitemap.xml` contains the localized commercial,
     tool, and article URLs.
   - `https://scorelead.io/indexnow-key.txt` returns only the IndexNow key.
   - English, Portuguese, and Spanish versions expose reciprocal hreflang
     links and self-referencing canonicals.
   - `https://scorelead.io` exposes the verified X profile in visible footer
     content and Organization `sameAs` data.
4. Validate external article references:

   ```sh
   bun run seo:check-sources
   ```

## Google Search Console

1. Create a Domain property for `scorelead.io` when DNS access is available.
   Otherwise use URL-prefix properties for `https://scorelead.io`,
   `https://scorelead.io/pt`, and `https://scorelead.io/es`.
2. Submit `https://scorelead.io/sitemap.xml`.
3. Inspect and request indexing for the homepage, blog, five feature pages,
   four use-case pages, three comparison pages, the Ceramik case study, and
   four tools.
4. Review weekly:

   - indexed vs. submitted pages;
   - non-brand impressions and clicks by locale;
   - commercial landing-page queries;
   - Core Web Vitals by page type;
   - duplicate, canonical, hreflang, and structured-data warnings.

## Bing Webmaster Tools and IndexNow

1. Keep the imported Google Search Console property connected and verified.
2. Submit the sitemap.
3. After each production content release, notify IndexNow with either:

   ```sh
   bun run seo:indexnow
   ```

   or only the changed absolute URLs:

   ```sh
   bun run seo:indexnow -- https://scorelead.io/example https://scorelead.io/pt/example
   ```

4. Confirm receipt in Bing Webmaster Tools. HTTP 200/202 confirms receipt, not
   crawling or indexing.
5. Review Bing's AI Performance report weekly for cited URLs, citation count,
   grounding queries, and changes by locale.

## Crawler verification

Run these checks against production and verify HTTP 200 with no challenge page:

```sh
curl -A "Googlebot" -I https://scorelead.io/features/ai-lead-discovery
curl -A "Bingbot" -I https://scorelead.io/features/ai-lead-discovery
curl -A "OAI-SearchBot" -I https://scorelead.io/features/ai-lead-discovery
curl -A "ChatGPT-User" -I https://scorelead.io/features/ai-lead-discovery
curl -A "Claude-SearchBot" -I https://scorelead.io/features/ai-lead-discovery
curl -A "Claude-User" -I https://scorelead.io/features/ai-lead-discovery
curl -A "PerplexityBot" -I https://scorelead.io/features/ai-lead-discovery
curl -A "Perplexity-User" -I https://scorelead.io/features/ai-lead-discovery
```

Repeat for `/pt` and `/es`. If a CDN or WAF is added, maintain explicit
allow-rules for search crawlers and test again after every policy change.
`GPTBot`, `ClaudeBot`, and `Applebot-Extended` are training-policy agents, not
search eligibility agents; keep any future allow/block decision in their
separate robots group.

## GA4 measurement

Create GA4 custom dimensions for:

- `acquisition_channel`
- `acquisition_source`
- `first_touch_channel`
- `first_touch_source`
- `first_touch_landing`
- `last_touch_channel`
- `last_touch_source`
- `last_touch_landing`
- `page_group`
- `page_id`
- `article_slug`
- `placement`
- `pipeline_status`

Mark `signup_completed`, `lead_capture_completed`, `qualified_account`, and
`customer_conversion` as key events. Keep `signup_submitted` as a diagnostic
step for email-verification drop-off. The app classifies known ChatGPT,
Perplexity, Claude, Copilot, Gemini, Meta AI, and You.com referrals as `ai`,
and honors ChatGPT's `utm_source=chatgpt.com`.

Create a weekly exploration with locale, landing page, page group, acquisition
channel, first-touch source, and last-touch source as dimensions. Verify events
in GA4 DebugView after each analytics deployment. Use high-intent impressions,
qualified organic or AI-referred signups, and conversion rate as the primary
90-day measures. Record the first 14 complete days as the baseline; compare
later rolling 28-day periods with that baseline.

## Content and authority cadence

- Review commercial pages and sources quarterly or when product behavior
  changes. Change visible dates only after a material review.
- Use the real first-live date for publication metadata. Do not stagger dates
  to imply a release cadence that did not occur.
- Keep illustrative dashboard and pipeline values visibly labeled as sample
  data, and remove unsupported performance statements from demo copy.
- Add named people and `Person` schema only after the individual supplies a
  publishable biography and consents to the profile.
- Archive written customer approval for every public case study. Update the
  Ceramik case study when underlying baseline counts, accepted-account rates,
  conversion counts, time records, or corrected results are supplied.
- Seek links through real customer stories, partner integrations, relevant
  SaaS directories, and promotion of the free tools. Do not buy links, create
  fake reviews, or mark up ratings that are not visible and verifiable.
