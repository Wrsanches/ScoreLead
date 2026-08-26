# ScoreLead SEO and GEO Strategy

Updated: 2026-08-26

## Audit baseline

The August 2026 Ahrefs, Google Search Console, and GA4 review established the
starting point for this plan:

- Search Console recorded about 1,738 impressions and 28 clicks over the latest
  13 weeks. The latest complete four-week window grew to 1,217 impressions and
  13 clicks, while CTR fell from 2.01% to 1.07% as non-brand visibility grew.
- GA4 recorded 25 organic sessions and 14 engaged sessions, with organic
  landings almost entirely on `/`. No signup, onboarding, discovery, or
  subscription conversion was attributed to organic traffic in the period.
- Ahrefs reported Domain Rating 0 and 161 live referring domains. Most sampled
  referring domains were irrelevant or spam-like, so raw domain count is not
  an authority KPI.
- The Ahrefs Rank Tracker contained 12 US keywords but no Brazil or Spain
  coverage. The expanded, page-owned set is in `docs/seo-keyword-map.csv`.
- The crawl found long titles, short descriptions, invalid article editor
  markup, one Cloudflare email-protection URL, and 114 URLs not submitted to
  IndexNow. These repository-level issues were corrected in the August update.

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
  - `/compare/sales-prospecting-software`
  - `/compare/purchased-lead-lists`
  - `/compare/best-lead-scoring-software`
  - `/compare/b2b-lead-enrichment-tools`
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
- New localized workflow guide:
  - `/blog/b2b-prospecting-guide`

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

Do not disavow or contact spam domains solely because they appear in Ahrefs.
Investigate only when Search Console reports a manual action or there is clear
evidence of a manipulative campaign controlled by ScoreLead.

## Keyword map

Track the English terms first, then add Portuguese and Spanish equivalents once
the English query data is stable. One primary page owns each intent to avoid
internal competition.

| Intent | Primary query | Landing page |
| --- | --- | --- |
| Category | AI lead generation software | `/` |
| Workflow | B2B prospecting | `/blog/b2b-prospecting-guide` |
| Comparison | Sales prospecting software | `/compare/sales-prospecting-software` |
| Feature | B2B lead scoring software | `/features/lead-scoring` |
| Comparison | Best lead scoring software | `/compare/best-lead-scoring-software` |
| Tool | Lead scoring calculator | `/tools/lead-scoring-calculator` |
| Feature | B2B lead enrichment software | `/features/lead-enrichment` |
| Comparison | B2B lead enrichment tools | `/compare/b2b-lead-enrichment-tools` |
| Tool | Lead enrichment checklist | `/tools/enrichment-checklist` |
| Workflow | Sales prospecting automation | `/blog/sales-prospecting-automation` |
| Workflow | B2B sales pipeline stages | `/blog/b2b-sales-pipeline-guide` |
| Feature | AI lead discovery | `/features/ai-lead-discovery` |
| Template | Ideal customer profile worksheet | `/tools/icp-worksheet` |
| Cost | Lead research ROI calculator | `/tools/lead-research-roi-calculator` |

The complete English, Portuguese, and Spanish tracker manifest, including
country, tag, priority, and canonical owner, is maintained in
`docs/seo-keyword-map.csv`. A query may appear on supporting pages in natural
copy, but only the mapped page should use it as its primary title and intent.

## 90-day execution order

1. Weeks 1–2: deploy the technical fixes, submit the sitemap, configure the
   keyword set above in Ahrefs Rank Tracker, and verify `generate_lead` in GA4.
2. Weeks 3–6: collect query-level Search Console data, improve pages with high
   impressions and weak click-through rate, and add only evidence-backed copy.
3. Weeks 7–10: promote the free calculators and checklists to relevant sales
   operations communities, SaaS directories, partners, and customers who can
   genuinely reference them.
4. Weeks 11–13: publish one approved customer result or original aggregate
   benchmark with its methodology, then compare the rolling 28-day period with
   the baseline.

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
- Keep public acquisition analytics and authenticated product analytics in
  separate GA4 properties or data streams.
- Track article and commercial CTA clicks, signup starts, signup submissions,
  `generate_lead`, completed signups, qualified accounts, and customer
  conversions.
- Create GA4 custom dimensions for acquisition, locale, landing page, page
  group, article, placement, and pipeline status.
- Review Google Search Console, Bing index coverage, and Bing AI Performance
  weekly.
- Record the first 14 complete production days as the baseline, then compare
  rolling 28-day high-intent impressions, AI referrals, qualified signups, and
  conversion rate.
