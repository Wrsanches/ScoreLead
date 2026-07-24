# ScoreLead SEO and GEO Strategy

Updated: 2026-07-24

## Positioning

ScoreLead competes as AI lead generation software for B2B teams that need a
reviewable path from target market to qualified account pipeline. It should not
present itself as a generic CRM, consumer lead finder, purchased-list vendor,
or autonomous message sender.

The core category story is:

1. define a target market;
2. discover companies;
3. retain useful public account context;
4. score fit transparently;
5. review outreach;
6. track accepted accounts and customers.

## Published Search Cluster

- Features:
  - `/features/ai-lead-discovery`
  - `/features/lead-scoring`
  - `/features/lead-enrichment`
  - `/features/outreach-automation`
  - `/features/sales-pipeline`
- Use cases:
  - `/use-cases/agencies`
  - `/use-cases/b2b-sales-teams`
  - `/use-cases/b2b-startups`
  - `/use-cases/b2b-companies`
- Comparisons:
  - `/compare/manual-lead-research`
  - `/compare/spreadsheets`
  - `/compare/purchased-lead-lists`
- Trust and conversion:
  - `/pricing`
  - `/security`
  - `/about`
  - `/editorial-policy`
  - `/authors/scorelead-editorial`
  - `/case-studies/ceramik`
- Linkable tools:
  - `/tools/icp-worksheet`
  - `/tools/lead-scoring-calculator`
  - `/tools/enrichment-checklist`
  - `/tools/lead-research-roi-calculator`

Every route above ships in English, Portuguese, and Spanish with localized
copy, metadata, canonicals, and reciprocal hreflang annotations.

## GEO Principles

- Optimize for ordinary crawlability, indexing, usefulness, and evidence.
  `llms.txt` is a convenience index, not a substitute for those fundamentals.
- Put the direct answer in visible server-rendered text near the top.
- Make product mechanics, definitions, limitations, and update dates explicit.
- Keep external claims tied to current primary or first-party sources.
- Label illustrative product data so it cannot be mistaken for customer
  performance.
- Publish customer metrics only with the source, window, baseline, definition,
  limitations, and approval status recorded.
- Use an organization byline until a real person supplies a publishable
  biography and consents to a named profile.

## Authority Priorities

Do not expand into programmatic industry or region pages yet. The next content
investment is original evidence:

1. strengthen the Ceramik case study when underlying counts or time records are
   supplied;
2. publish anonymized discovery or scoring benchmarks only when the sample,
   date range, exclusions, and calculation can be disclosed;
3. turn verified product workflows into firsthand field notes and screenshots;
4. earn links from customers, partners, relevant SaaS directories, and
   promotion of the free tools;
5. keep the ScoreLead name, description, logo, website, and X profile
   consistent.

## Content Truth Rules

- Use the real first-publication date for every page.
- Change `dateModified` only after a material review or correction.
- Never invent a person, credential, review, benchmark, baseline, or customer
  result.
- Do not describe demo values as outcomes. Place a visible disclosure next to
  every illustrative dashboard, score, contact, message, or pipeline.
- Keep factual comparison pages neutral and sourced.
- Check outbound sources before every production content release:

  ```sh
  bun run seo:check-sources
  ```

## Technical Requirements

- Public pages return 200 and expose important content without client-side
  JavaScript.
- Private API, admin, and onboarding routes remain excluded from crawling.
- Every indexable URL appears in the sitemap with its actual modification date,
  a self-canonical, and reciprocal locale alternates.
- Structured data must match visible content and use real entity identifiers.
- Search, user-requested retrieval, and training crawlers remain separate
  policy groups in `robots.txt`.
- Submit created, materially updated, and removed URLs through IndexNow after
  deployment.

## Measurement

The primary outcome is qualified signups, not raw traffic or mentions.

- Preserve immutable first-touch and latest non-direct attribution.
- Track article and commercial CTA clicks, signup starts, signup submissions,
  completed signups, qualified accounts, and customer conversions.
- Create GA4 custom dimensions for acquisition, locale, landing page, page
  group, article, placement, and pipeline status.
- Review Google Search Console, Bing index coverage, and Bing AI Performance
  weekly.
- Record the first 14 complete production days as the baseline, then compare
  rolling 28-day high-intent impressions, AI referrals, qualified signups, and
  conversion rate.
