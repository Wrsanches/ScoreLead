# SEO implementation — September 21, 2026

## Evidence and priorities

The Windsor.ai and Ahrefs audit used complete GSC days August 22–September 18,
2026, compared with July 25–August 21. There were 1,075 impressions and 9 clicks,
versus 1,261 and 13. This is a small sample, not enough to attribute changes to
an individual page or to forecast growth.

| Evidence | Decision |
| --- | --- |
| GSC: `icp worksheet` 4 impressions, average position 10; `ideal customer profile worksheet` 3 impressions, position 16 | Improve the existing worksheet, examples and downloads first. |
| Ahrefs US: ideal customer profile worksheet volume 70, KD 5; lead scoring template volume 100, KD 1 | Assign template intent to existing tool URLs. Volume/KD are estimates; the scoring-template SERP snapshot was June 9. |
| Enrichment feature: 203 impressions, average position about 73 | Add relevant guide/tool links and a sourced comparison; do not promise a ranking lift. |
| Spanish homepage: 134 impressions for sampled lead-scoring IA variants, average position about 86 | Keep localized links to the scoring feature, calculator and comparison clear. |
| Ahrefs September 15 crawl: health 100, no errors across 161 crawled URLs | Prioritize usefulness and authority over speculative crawl fixes. |
| DR 0; 15 of the sampled top 20 referring domains flagged spam | Seek relevant editorial references; do not buy links or mass-disavow based only on these labels. |
| Ahrefs sampled AI citations: 0 | Publish useful, attributable content. There is no special AI schema or file required for Google AI features. |

GA4 public property `531207288` reported 33 Organic Search sessions, but the
source/medium breakdown was 5 `google / organic` and 28
`search.google.com / referral`. Keep those separate when evaluating search
performance. Reddit contributed 11 sessions, 10 engaged; this is a signal for
a small distribution test, not proof of qualified demand. Six Stripe return
sessions and three explicitly tagged internal-test sessions also contaminated
channel totals. Historical reports will not be rewritten by the code fixes.

Eight public `signup_start` events do not establish a conversion rate: product
completion events belong to the app stream, which is not connected in Windsor.

## Implemented in the repository

- Tools appear immediately below their introductory text, ahead of long copy.
- ICP worksheets have completed examples, field guidance, CSV export and print
  layouts. Entries stay in the browser; exports neutralize spreadsheet formulas.
- The scoring template supports relative weights, disqualifier overrides,
  transparent thresholds, invalid-input feedback and CSV export. Worked examples
  are explicitly illustrative, not additional Ceramik results.
- Three comparison pages now include named products, pricing models,
  evaluation questions and primary vendor citations in EN/PT/ES. They disclose
  ScoreLead authorship and distinguish editorial assessment from benchmarking.
- Tool metadata and reciprocal links connect guides, features and comparisons.
- Ceramik's approved 2,450 discovered leads, 10× pipeline growth and 85% research
  time reduction remain unchanged. Customer approval is recorded without
  inventing underlying counts, dates or independent audit evidence.
- App-host analytics queues now drain after GA becomes available. Consent is
  rechecked before delivery; explicit test sessions are excluded; campaign
  attribution precedes referrers; Google service referrals stay distinct from
  search. Event locale is attached without sending worksheet entries.

## Ready-to-use distribution copy

Publish only after the new pages are live, and adapt to each community's rules.
No outreach messages or public posts were sent as part of this implementation.

**ICP resource description:** Free ideal customer profile worksheet with a
completed example, required criteria, preferences, disqualifiers and CSV
download. No signup required. https://scorelead.io/tools/icp-worksheet

**Scoring resource description:** Free B2B lead scoring template and calculator.
Set relative weights, apply disqualifiers, inspect a worked example and download
your model as CSV. It is a planning tool, not a purchase-probability predictor.
https://scorelead.io/tools/lead-scoring-calculator

**Community post draft:** We built a free worksheet to make ICP criteria easier
to test: separate must-haves from preferences, record reasons to reject an
account, then review a sample before scaling research. It includes a worked
example and CSV export. What criterion most often causes disagreement between
your sales and marketing teams? Disclosure: I work on ScoreLead.

**Resource-editor pitch draft:** Your resource page helps teams define which
accounts to prioritize. ScoreLead's free ICP worksheet adds a completed example
and downloadable criteria without requiring signup. If useful to your readers,
the resource is at https://scorelead.io/tools/icp-worksheet. I work on ScoreLead
and would welcome feedback on the worksheet's clarity.

Use EN/PT/ES destinations appropriate to the audience. For outbound distribution
links, use `utm_source=<actual_publication>&utm_medium=referral&utm_campaign=free_tools_2026_09`.
Do not put UTMs on internal links. The tracking sheet is
[seo-distribution.csv](seo-distribution.csv); blank prospect fields are
intentional, not verified outreach targets.

## Launch and measurement

1. Deploy these changes through the normal release process. Verify canonical,
   hreflang, sitemap, CSV download, printing and consent behavior on production.
2. GA4/Windsor account configuration is complete as recorded below. Use the
   separate app property for product outcomes; allow report processing before
   establishing a baseline. Team-IP filtering requires actual fixed IPs.
3. Verify one consented public-to-app journey in the appropriate streams. Use
   GA4 DebugView for diagnostics; a visit tagged `internal_test` intentionally
   sends no analytics. Avoid recording actual customer field values.
4. Retain the existing Ahrefs 32-keyword setup (US 18, BR 7, ES 7). Reconcile the
   intended keyword CSV before adding terms; no bulk tracker changes were made.
5. For the first 14 complete days, establish a clean source/medium and event
   baseline. After 28 complete days, compare equally long periods for impressions,
   clicks, tool starts/exports, qualified signups and product completion events.
   Treat tool exports as engagement, not sales. Track relevant earned links and
   referral outcomes separately. No recurring automation is created by this plan.

Primary references: [Google AI features](https://developers.google.com/search/docs/appearance/ai-features),
[GA4 unwanted referrals](https://support.google.com/analytics/answer/10327750).
Vendor references are maintained in `lib/marketing/comparisons.ts` and included
in `bun run seo:check-sources`.

## Verification notes

- SEO suite: 49 tests pass, covering localized metadata, URL ownership,
  sitemap/hreflang, scoring, CSV escaping and attribution/consent delivery.
- ESLint and TypeScript pass. Production webpack build succeeds and generates
  192 static pages. The default Turbopack build cannot bind an internal worker
  port in this environment. Webpack reports an existing Firecrawl optional
  `undici` module warning in unrelated backend discovery code.
- All 15 blog/comparison source URLs returned successful HTTP responses.
- Browser checks covered the English scoring example (71/100), disqualifier
  override, blank-weight error, disabled export and reset. Chrome downloaded
  `scorelead-lead-scoring-calculator-en.csv`; the actual file was parsed and its
  scores, weights and 71 result verified. Browser tooling did not expose the
  Blob download event, but the downloaded file was present. CSV escaping and
  formula neutralization also have unit coverage.
- At 390px, the Portuguese worksheet and Spanish comparison have no horizontal
  page overflow. Comparisons now render labelled product sections on mobile
  and a semantic table on desktop. Worksheet fields grow with their contents
  in supporting browsers, including when the worked example is loaded.
- DESIGN.md lint has no errors. The project-wide strict frontend audit reports
  16 existing findings in admin/onboarding controls and global scrollbar CSS;
  none originate in the new tool/comparison components. Those unrelated
  surfaces were not changed for this SEO work.

## Completed account setup and design pass

- Created ScoreLead App property `555227054` under the existing ScoreLead
  account, with São Paulo reporting timezone and USD matching the public
  property. Web stream `15818262903` uses `G-3RXJLNF5KG` on `app.scorelead.io`.
- Registered 16 event dimensions on the app property, and added the missing
  `locale`, `tool`, and `action` dimensions on ScoreLead Web. Public conversion
  key events were already configured. App `signup_completed`, `generate_lead`,
  `qualified_account`, and `customer_conversion` are now key events with no
  default monetary value and per-event counting.
- Verified existing public Stripe referral exclusions and saved exact-match
  checkout/billing Stripe exclusions on the app stream.
- Reconnected Windsor with the user's explicit OAuth approval and selected
  ScoreLead App. The MCP inventory confirms both ScoreLead properties. A scoped
  app report query succeeded with no processed rows yet.
- Applied the app measurement ID to Railway production (one variable change)
  and verified the service became active. Live consented checks found public
  tag `G-NSQBJHL4Z0` on `scorelead.io` and app tag `G-3RXJLNF5KG` on
  `app.scorelead.io`. App Realtime showed one active user and `first_visit`,
  `page_view`, `session_start`. These were setup diagnostics, not business
  conversions. The earlier public 48-hour no-data warning can lag collection.
- The design pass reuses Geist, Lucide icons, glass/surface materials, emerald
  actions and existing corner radii. It improves tool heading hierarchy,
  example controls, worksheet input surfaces, score/weight visibility,
  disqualifier feedback, mobile comparison reading, and article tool links.
- The SEO/content/design code remains in the working tree for the normal code
  release. The Railway deployment above applied analytics configuration to the
  existing production revision; it did not publish these working-tree changes.
