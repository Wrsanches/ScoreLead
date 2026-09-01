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
3. Set `NEXT_PUBLIC_GA_PUBLIC_ID` to the public acquisition GA4 stream and
   `NEXT_PUBLIC_GA_APP_ID` to a separate authenticated-product stream. The
   legacy `NEXT_PUBLIC_GA_ID` is accepted only as a public-site fallback.
4. Deploy, then confirm:

   - `https://scorelead.io/robots.txt` returns 200.
   - `https://scorelead.io/sitemap.xml` contains the localized commercial,
     tool, and article URLs.
   - `https://scorelead.io/indexnow-key.txt` returns only the IndexNow key.
   - English, Portuguese, and Spanish versions expose reciprocal hreflang
     links and self-referencing canonicals.
   - `https://scorelead.io` exposes the verified X profile in visible footer
     content and Organization `sameAs` data.
5. Validate external article references:

   ```sh
   bun run seo:check-sources
   ```

## Google Search Console

1. Create a Domain property for `scorelead.io` when DNS access is available.
   Otherwise use URL-prefix properties for `https://scorelead.io`,
   `https://scorelead.io/pt`, and `https://scorelead.io/es`.
2. Submit `https://scorelead.io/sitemap.xml`.
3. Inspect and request indexing for the homepage, blog, five feature pages,
   four use-case pages, five comparison pages, the Ceramik case study, and
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
3. A production Next.js server startup automatically submits every sitemap URL
   when `INDEXNOW_KEY` is configured. This is the deployment path; a failed
   IndexNow request is logged without preventing the application from starting.
4. To retry manually after a provider outage, notify IndexNow with either:

   ```sh
   bun run seo:indexnow
   ```

   or only the changed absolute URLs:

   ```sh
   bun run seo:indexnow -- https://scorelead.io/example https://scorelead.io/pt/example
   ```

5. Confirm receipt in Bing Webmaster Tools. HTTP 200/202 confirms receipt, not
   crawling or indexing.
6. Review Bing's AI Performance report weekly for cited URLs, citation count,
   grounding queries, and changes by locale.
7. After deployment, start a fresh Ahrefs Site Audit crawl. The production
   sitemap should contain 126 localized URLs, public signup links should point
   directly to `app.scorelead.io`, and served HTML should not contain
   `/cdn-cgi/l/email-protection` or `data-cfemail`. The IndexNow notice should
   clear after the provider records the submitted URLs. Homepage product
   illustrations must expose their localized feature name as alternative text;
   purely decorative flags and repeated avatars should remain at `alt=""`.

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

Use separate GA4 properties or web data streams for public acquisition and the
authenticated product. The runtime routes `scorelead.io` marketing pages to
`NEXT_PUBLIC_GA_PUBLIC_ID`, routes app/auth pages to
`NEXT_PUBLIC_GA_APP_ID`, and does not load analytics on preview or localhost
hosts. Only the public stream records acquisition landing touches.

Before using the public stream as a baseline, define and test GA4 internal
traffic rules for the ScoreLead team, then activate the filter. Review any
`Organic Shopping` sessions at source/medium level and correct campaign UTMs or
custom channel rules instead of treating them as SEO traffic by default.

In the GA4 web stream, open **Configure tag settings → List unwanted
referrals** and add `checkout.stripe.com` and `billing.stripe.com`. This is the
account-level control that prevents Stripe-hosted Checkout and Billing Portal
returns from starting referral sessions. The application also treats those
hosts as direct continuations in its first-party attribution store, but that
does not rewrite historical GA4 channel assignments. Annotate the change date
and compare only sessions collected after it.

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

Mark `signup_completed`, `generate_lead`, `qualified_account`, and
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

## Ahrefs Rank Tracker

Use the existing `scorelead.io` project and retain its 12 US keywords. Add the
expanded set from `docs/seo-keyword-map.csv`, using the United States for
English, Brazil for Portuguese, and Spain or the primary Spanish-speaking sales
market for Spanish. Keep the CSV's page ownership and tags so cannibalization
can be reviewed consistently.

Review weekly:

- positions and SERP features for the mapped page, not just the domain;
- cannibalization when a different ScoreLead URL ranks for the term;
- new referring domains that are topically relevant and send real traffic;
- lost links from customers, partners, directories, or editorial references;
- content gaps revealed by Search Console queries with impressions.

The Ahrefs connector is read-only in this workflow, so project and keyword
creation remain an account-level operation in Ahrefs after deployment.

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

Use a small, qualified outreach queue instead of the raw Ahrefs referring-domain
count:

1. Add only a customer, partner, sales-operations publication, legitimate SaaS
   directory, or community whose audience could use the linked page.
2. Match the pitch to one useful asset: the ICP worksheet, lead scoring
   calculator, enrichment checklist, ROI calculator, B2B prospecting guide, or
   an approved customer result.
3. Record target domain, target page, contact owner, relevance reason, asset,
   outreach date, response, earned URL, and referral/conversion outcome.
4. Review five qualified prospects per week. Exclude generic guest-post farms,
   unrelated coupon/download domains, paid-link offers, and domains whose only
   justification is DR.
5. Judge the program by relevant earned links, referral engagement, assisted
   signups, and commercial rankings—not total referring domains.
