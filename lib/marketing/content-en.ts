import type { MarketingPageTranslation } from "./types"

export const marketingContentEn: Record<string, MarketingPageTranslation> = {
  "feature-ai-lead-discovery": {
    eyebrow: "Feature · Account discovery",
    title: "AI lead discovery built around your actual market",
    description:
      "Find B2B companies by market, geography, service, and account profile, then keep the evidence that explains why each company belongs in your pipeline.",
    answer:
      "AI lead discovery turns a specific ideal-customer hypothesis into a repeatable company search. ScoreLead combines public web and map signals, normalizes the results, and gives sales teams a reviewable account record instead of an unexplained list.",
    highlights: [
      "Search by region, keyword, service, and target-account criteria.",
      "Keep source context and remove duplicate company records.",
      "Move qualified discoveries directly into enrichment and scoring.",
    ],
    sections: [
      {
        heading: "Start with a testable market definition",
        paragraphs: [
          "A useful discovery job names the segment, geography, observable fit signals, and disqualifiers. ScoreLead uses those constraints to search broadly without treating every company as equally relevant.",
        ],
        points: ["Define the market", "Choose the region", "Record positive and negative signals"],
      },
      {
        heading: "Review evidence, not just names",
        paragraphs: [
          "Each account should be understandable before outreach. Website, location, service, reputation, and contact-channel evidence make it easier to accept, reject, or research a company further.",
        ],
      },
      {
        heading: "Feed outcomes back into the next search",
        paragraphs: [
          "Accepted accounts, rejection reasons, replies, and opportunities reveal whether the original market hypothesis was useful. That feedback makes the next discovery run more precise.",
        ],
      },
    ],
    proofLabel: "What this feature does—and does not do",
    proof:
      "ScoreLead reduces repetitive company research and organizes public evidence. It does not guarantee that a discovered company is ready to buy; your team controls the target definition, review, and outreach decision.",
    ctaTitle: "Run your first focused company search.",
    ctaDescription: "Start free and turn a market hypothesis into a reviewable account list.",
    ctaLabel: "Start discovering leads",
  },
  "feature-lead-scoring": {
    eyebrow: "Feature · Prioritization",
    title: "Transparent B2B lead scoring your team can challenge",
    description:
      "Prioritize accounts across fit, reach, trust, engagement potential, and readiness while preserving the evidence behind every score.",
    answer:
      "ScoreLead scoring is a prioritization layer, not an automatic verdict. It turns observable account signals into a consistent review queue and keeps each dimension visible so sales can understand, override, and improve the model.",
    highlights: [
      "Separate company fit from timing and readiness.",
      "See dimension-level evidence instead of one opaque number.",
      "Use clear score tiers to trigger review, enrichment, or outreach.",
    ],
    sections: [
      {
        heading: "Score the signals connected to your offer",
        paragraphs: [
          "The model evaluates the dimensions ScoreLead can observe and explain. Teams should treat hard requirements as gates and use softer signals to rank the accounts that remain.",
        ],
      },
      {
        heading: "Keep uncertainty visible",
        paragraphs: [
          "Missing data should not quietly become a negative score. Unknown fields stay distinguishable from weak evidence so representatives know when an account needs more research.",
        ],
        points: ["Market fit", "Online reach", "Trust signals", "Engagement potential", "Readiness"],
      },
      {
        heading: "Calibrate against sales outcomes",
        paragraphs: [
          "Compare scores with accepted accounts, replies, opportunities, and rejection reasons. False positives and false negatives are the evidence needed to improve prioritization.",
        ],
      },
    ],
    proofLabel: "Responsible use",
    proof:
      "A lead score supports human prioritization. It should never be presented as proof of purchase intent, used with hidden sensitive attributes, or allowed to replace a representative’s review.",
    ctaTitle: "Make the next account obvious.",
    ctaDescription: "Build a review queue with the reasoning attached.",
    ctaLabel: "Try lead scoring",
  },
  "feature-lead-enrichment": {
    eyebrow: "Feature · Account intelligence",
    title: "Lead enrichment that makes account data useful",
    description:
      "Turn a company name and domain into structured, source-aware context for qualification, routing, personalization, and CRM export.",
    answer:
      "B2B lead enrichment should reduce uncertainty, not maximize field count. ScoreLead organizes identity, fit, problem, reachability, and personalization signals while retaining the source context needed for verification.",
    highlights: [
      "Collect useful company, service, location, and public-contact context.",
      "Normalize fields for filtering without erasing the original evidence.",
      "Label missing or inferred values instead of presenting guesses as facts.",
    ],
    sections: [
      {
        heading: "Enrich for a decision",
        paragraphs: [
          "Every field should help determine fit, explain a problem hypothesis, support contact planning, or improve a message. Unused data creates maintenance work without improving sales decisions.",
        ],
      },
      {
        heading: "Preserve provenance",
        paragraphs: [
          "Web data changes. Source URLs, observation dates, and confidence labels help representatives verify important details before using them in outreach.",
        ],
        points: ["Identity", "Fit", "Problem evidence", "Reachability", "Personalization"],
      },
      {
        heading: "Export cleaner records",
        paragraphs: [
          "Consistent formats and duplicate detection make enriched accounts easier to filter and move into a CRM while keeping the underlying context available for review.",
        ],
      },
    ],
    proofLabel: "Data-quality standard",
    proof:
      "ScoreLead uses public sources and configured providers. Coverage varies by company and region, so important details should be verified before a high-stakes decision or message.",
    ctaTitle: "Give every account useful context.",
    ctaDescription: "Enrich discovered companies before your team spends time on outreach.",
    ctaLabel: "Enrich leads",
  },
  "feature-outreach-automation": {
    eyebrow: "Feature · Sales outreach",
    title: "Outreach automation with account-specific context",
    description:
      "Draft multi-step B2B outreach from verified account evidence, with human review before a message is used or scheduled.",
    answer:
      "ScoreLead turns reviewed account context into a starting sequence for outreach. The system can reference relevant company details and adapt the message by language, but the sender remains responsible for accuracy, positioning, consent, and channel rules.",
    highlights: [
      "Draft introductions, follow-ups, and value-focused messages.",
      "Use reviewed account evidence rather than generic merge fields.",
      "Generate outreach in English, Portuguese, and Spanish.",
    ],
    sections: [
      {
        heading: "Personalize around relevance",
        paragraphs: [
          "Useful personalization connects a verified observation to the problem your product addresses. It avoids empty compliments, invented familiarity, and details that do not change the value proposition.",
        ],
      },
      {
        heading: "Keep a human approval step",
        paragraphs: [
          "Representatives should check names, claims, tone, timing, and the requested action. High-value accounts deserve deeper editing than lower-priority research queues.",
        ],
        points: ["Verify the evidence", "Check the value hypothesis", "Review the call to action", "Respect local rules"],
      },
      {
        heading: "Measure conversations, not volume",
        paragraphs: [
          "Track positive replies, qualified meetings, objections, and opt-outs. Those outcomes reveal whether targeting and positioning are improving, not merely whether more messages were produced.",
        ],
      },
    ],
    proofLabel: "Sender responsibility",
    proof:
      "ScoreLead drafts content; it does not create permission to contact someone. Users must follow applicable privacy, electronic-communications, platform, and opt-out requirements.",
    ctaTitle: "Prepare better outreach in less time.",
    ctaDescription: "Start with account context, then keep your team in control.",
    ctaLabel: "Draft outreach",
  },
  "feature-sales-pipeline": {
    eyebrow: "Feature · Workflow",
    title: "A sales pipeline connected to discovery evidence",
    description:
      "Track companies from discovery through enrichment, scoring, outreach, and conversion without losing the context that qualified them.",
    answer:
      "ScoreLead links each pipeline stage to the account evidence and work that preceded it. Teams can see what was found, why it was prioritized, what outreach was prepared, and what happened next.",
    highlights: [
      "Follow accounts from discovery to customer status.",
      "Review job progress, scores, messages, and status in one workflow.",
      "Use rejection and conversion outcomes to improve future searches.",
    ],
    sections: [
      {
        heading: "Make stage definitions operational",
        paragraphs: [
          "A stage should describe completed work and the next action. Discovery, enrichment, scoring, outreach, and conversion are useful only when the team applies them consistently.",
        ],
      },
      {
        heading: "Keep quality visible",
        paragraphs: [
          "Duplicate detection, source context, and score reasoning remain attached to the record so pipeline movement does not hide weak or incomplete data.",
        ],
        points: ["Discovery jobs", "Account enrichment", "Score review", "Outreach status", "Conversion feedback"],
      },
      {
        heading: "Learn from movement and rejection",
        paragraphs: [
          "Time in stage, acceptance rate, rejection reasons, and downstream conversion show where targeting or process needs attention. The pipeline becomes a learning system rather than a static board.",
        ],
      },
    ],
    proofLabel: "Measurement principle",
    proof:
      "Pipeline activity is not the same as revenue. ScoreLead helps teams observe the workflow; business outcomes still depend on offer quality, market fit, execution, and timing.",
    ctaTitle: "Connect lead research to pipeline action.",
    ctaDescription: "Keep discovery, qualification, and outreach in one traceable workflow.",
    ctaLabel: "Build your pipeline",
  },
  "use-case-agencies": {
    eyebrow: "Use case · Agencies",
    title: "Lead generation for agencies managing multiple markets",
    description:
      "Create focused account searches for each client or service line, standardize qualification, and prepare relevant outreach without mixing market assumptions.",
    answer:
      "Agencies can use ScoreLead to separate client workspaces, define an ICP for each campaign, and create reviewable discovery and outreach workflows. This makes the research method easier to explain and repeat across accounts.",
    highlights: [
      "Keep client targets, evidence, and outreach separate.",
      "Reuse a consistent process without reusing generic messaging.",
      "Export qualified records for client delivery or CRM import.",
    ],
    sections: [
      {
        heading: "Translate the brief into observable criteria",
        paragraphs: [
          "Turn each client’s positioning into required fit signals, useful preferences, and explicit disqualifiers before launching discovery.",
        ],
      },
      {
        heading: "Show the work behind the list",
        paragraphs: [
          "Source context, score dimensions, and rejection reasons make delivery more defensible than a spreadsheet of unexplained names.",
        ],
        points: ["Client-specific ICP", "Evidence-backed accounts", "Review queue", "Localized outreach"],
      },
      {
        heading: "Report on quality",
        paragraphs: [
          "Track accepted accounts, positive conversations, and client feedback by segment. Use those results to revise the next search instead of optimizing only for list size.",
        ],
      },
    ],
    proofLabel: "Best fit",
    proof:
      "ScoreLead is most useful for agencies that own targeting and qualification. It is not a substitute for client approval, channel compliance, or a differentiated offer.",
    ctaTitle: "Run focused prospecting for every client.",
    ctaDescription: "Give each campaign its own market logic and evidence trail.",
    ctaLabel: "Start an agency workflow",
  },
  "use-case-b2b-sales-teams": {
    eyebrow: "Use case · Sales teams",
    title: "A shared prospecting system for B2B sales teams",
    description:
      "Align account discovery, qualification, scoring, and outreach around one visible definition of a good prospect.",
    answer:
      "ScoreLead gives sales teams a common workflow for deciding which companies deserve attention. Representatives can see the evidence behind an account, understand its score, and record outcomes that improve future targeting.",
    highlights: [
      "Standardize research without removing representative judgment.",
      "Prioritize accounts with explainable score dimensions.",
      "Connect replies and rejection reasons to targeting decisions.",
    ],
    sections: [
      {
        heading: "Make the ICP usable",
        paragraphs: [
          "Convert strategy documents into search filters, review criteria, and disqualifiers that representatives can apply during weekly work.",
        ],
      },
      {
        heading: "Create a consistent review queue",
        paragraphs: [
          "Use scoring to order work, then let representatives verify the evidence and choose the appropriate next action.",
        ],
        points: ["Target-account definition", "Evidence review", "Priority tiers", "Outcome feedback"],
      },
      {
        heading: "Coach with real examples",
        paragraphs: [
          "Accepted and rejected accounts give managers concrete examples for calibrating the team’s understanding of fit, readiness, and message relevance.",
        ],
      },
    ],
    proofLabel: "Adoption principle",
    proof:
      "A workflow earns trust when representatives can inspect and correct it. ScoreLead keeps reasoning visible so the team can improve the system rather than work around it.",
    ctaTitle: "Give your team one definition of a strong account.",
    ctaDescription: "Turn targeting criteria into repeatable daily sales work.",
    ctaLabel: "Set up your sales team",
  },
  "use-case-b2b-startups": {
    eyebrow: "Use case · Startups",
    title: "Founder-led lead generation that learns with every conversation",
    description:
      "Test narrow B2B market hypotheses, find companies that match, and preserve the evidence needed to learn from early sales conversations.",
    answer:
      "Early-stage teams need learning speed more than list volume. ScoreLead helps founders define a testable segment, research accounts consistently, and compare real responses with the assumptions behind the search.",
    highlights: [
      "Test one segment and problem hypothesis at a time.",
      "Spend founder attention on higher-confidence accounts.",
      "Record acceptance, objections, and conversion evidence.",
    ],
    sections: [
      {
        heading: "Start narrow enough to learn",
        paragraphs: [
          "A constrained market makes feedback interpretable. Define who has the problem, where to find them, and which observable signals suggest the problem matters.",
        ],
      },
      {
        heading: "Automate repetition, keep discovery calls human",
        paragraphs: [
          "Use automation for finding and organizing accounts, then use founder time for verification, positioning, and direct conversations.",
        ],
        points: ["Market hypothesis", "Account evidence", "Founder review", "Weekly iteration"],
      },
      {
        heading: "Change one assumption at a time",
        paragraphs: [
          "Compare replies, meetings, and objections by segment. Controlled changes make it easier to learn whether the target, offer, or message needs revision.",
        ],
      },
    ],
    proofLabel: "Early-stage reality",
    proof:
      "No prospecting tool can create product-market fit. ScoreLead helps startups run a more disciplined search and preserve the evidence needed to make better go-to-market decisions.",
    ctaTitle: "Turn your next market hypothesis into a test.",
    ctaDescription: "Find a focused account set and learn from the response.",
    ctaLabel: "Test a market",
  },
  "use-case-b2b-companies": {
    eyebrow: "Use case · Established B2B companies",
    title: "Repeatable account discovery across teams and regions",
    description:
      "Expand B2B prospecting into new segments or geographies while preserving qualification standards, source context, and local messaging.",
    answer:
      "Established B2B companies can use ScoreLead to make account research consistent across regions without flattening local differences. Shared criteria provide governance while localized searches and outreach preserve market context.",
    highlights: [
      "Apply shared qualification standards across regions.",
      "Keep localized market evidence and language visible.",
      "Export normalized, deduplicated account records.",
    ],
    sections: [
      {
        heading: "Separate global rules from local signals",
        paragraphs: [
          "Keep non-negotiable fit requirements consistent, then allow geography, language, service patterns, and market maturity to shape local discovery.",
        ],
      },
      {
        heading: "Make data reviewable before CRM entry",
        paragraphs: [
          "Normalize identity fields, retain source evidence, and resolve duplicates before records become another cleanup project.",
        ],
        points: ["Shared ICP", "Regional searches", "Quality review", "CRM-ready export"],
      },
      {
        heading: "Compare quality by segment",
        paragraphs: [
          "Measure acceptance, progression, and conversion by region or segment. Differences help teams invest where the product and message have stronger evidence.",
        ],
      },
    ],
    proofLabel: "Governance principle",
    proof:
      "Standardization should improve explainability, not erase local judgment. ScoreLead keeps market context attached to the account so regional teams can review it.",
    ctaTitle: "Scale account research without losing context.",
    ctaDescription: "Create consistent workflows for every market you serve.",
    ctaLabel: "Plan a regional workflow",
  },
  "compare-manual-lead-research": {
    eyebrow: "Comparison · Workflow",
    title: "Manual lead research vs. an AI-assisted workflow",
    description:
      "Compare the control, speed, evidence quality, and maintenance tradeoffs of manual B2B research and AI-assisted account discovery.",
    answer:
      "Manual research offers close control but becomes inconsistent and expensive at scale. AI assistance is faster at repetitive search and normalization, but it still requires a precise target, source-aware review, and human judgment before outreach.",
    highlights: [
      "Manual work is flexible but difficult to standardize.",
      "Automation improves throughput and repeatability.",
      "The strongest process combines automation with accountable review.",
    ],
    sections: [
      {
        heading: "Where manual research is strongest",
        paragraphs: [
          "A skilled researcher can interpret unusual markets, validate nuanced signals, and adapt quickly. That depth is valuable for strategic accounts and poorly documented segments.",
        ],
      },
      {
        heading: "Where automation earns its place",
        paragraphs: [
          "Search, field extraction, normalization, duplicate checks, and first-pass scoring are repetitive. A structured system performs those steps more consistently and preserves the method.",
        ],
        points: ["Discovery speed", "Repeatability", "Evidence retention", "Human exception handling"],
      },
      {
        heading: "Choose a hybrid operating model",
        paragraphs: [
          "Automate broad collection and triage, then concentrate manual research on high-priority or uncertain accounts. Measure accepted-account cost rather than raw records per hour.",
        ],
      },
    ],
    proofLabel: "Fair comparison",
    proof:
      "ScoreLead can reduce repetitive work, but the value depends on market complexity, data availability, review quality, and the cost of your current process.",
    ctaTitle: "Move repetitive research into a reviewable system.",
    ctaDescription: "Keep human judgment where it creates the most value.",
    ctaLabel: "Compare with your workflow",
  },
  "compare-spreadsheets": {
    eyebrow: "Comparison · Operations",
    title: "ScoreLead vs. spreadsheets for B2B prospecting",
    description:
      "Understand when a spreadsheet is enough and when discovery, provenance, scoring, deduplication, and workflow need a connected system.",
    answer:
      "Spreadsheets are flexible and familiar for small, temporary lists. They become fragile when teams need repeatable discovery, source history, consistent scoring, duplicate control, status changes, and multi-user accountability.",
    highlights: [
      "Spreadsheets remain useful for ad hoc analysis and export.",
      "A connected workflow reduces manual copying and formula drift.",
      "Source context and scoring logic stay attached to each account.",
    ],
    sections: [
      {
        heading: "Use a spreadsheet for simple, bounded work",
        paragraphs: [
          "A short list owned by one person may not need a system. Clear columns and a defined review date can be entirely sufficient.",
        ],
      },
      {
        heading: "Watch for operational failure points",
        paragraphs: [
          "Conflicting versions, unexplained cells, copied formulas, duplicates, missing provenance, and stale statuses signal that the list has become a workflow.",
        ],
        points: ["Version control", "Data provenance", "Scoring consistency", "Ownership and next action"],
      },
      {
        heading: "Keep exports, replace manual coordination",
        paragraphs: [
          "ScoreLead still supports CSV export. The difference is that discovery, enrichment, scoring, and status are managed before the data leaves the system.",
        ],
      },
    ],
    proofLabel: "Migration principle",
    proof:
      "Do not replace a spreadsheet merely because software exists. Move when coordination errors and maintenance cost exceed the value of spreadsheet flexibility.",
    ctaTitle: "See whether your lead sheet has become a system.",
    ctaDescription: "Use the workflow where consistency matters and export when flexibility helps.",
    ctaLabel: "Try a connected workflow",
  },
  "compare-purchased-lead-lists": {
    eyebrow: "Comparison · Data strategy",
    title: "Fresh account discovery vs. purchased lead lists",
    description:
      "Compare static third-party lists with search criteria, source context, current public evidence, and account-level qualification.",
    answer:
      "Purchased lists can provide quick coverage, but their origin, age, permissions, and fit are often unclear. Fresh discovery starts from your target definition and gathers current public company evidence, although every contact decision still requires review and lawful use.",
    highlights: [
      "Static lists may age before they reach the sales team.",
      "Fresh discovery keeps the target criteria and evidence visible.",
      "Neither method removes consent, privacy, or verification obligations.",
    ],
    sections: [
      {
        heading: "Evaluate a list beyond record count",
        paragraphs: [
          "Ask how data was collected, when it was verified, which fields are inferred, how opt-outs are handled, and whether the provider permits your intended use.",
        ],
      },
      {
        heading: "Build from the account hypothesis",
        paragraphs: [
          "Fresh discovery begins with the companies you can help and uses current observable evidence to determine whether each account deserves review.",
        ],
        points: ["Target definition", "Observation date", "Source context", "Contact-law review"],
      },
      {
        heading: "Measure usable accounts",
        paragraphs: [
          "Compare accepted, reachable, correctly targeted accounts—not just price per row. Cheap records are expensive when representatives must re-research or repair them.",
        ],
      },
    ],
    proofLabel: "Compliance note",
    proof:
      "Public availability does not automatically authorize every use. Review applicable privacy, direct-marketing, suppression, and platform requirements before contacting people.",
    ctaTitle: "Build a list around your market—not a vendor catalog.",
    ctaDescription: "Discover companies with the criteria and source context attached.",
    ctaLabel: "Start fresh discovery",
  },
  "case-study-ceramik": {
    eyebrow: "Customer story · Ceramik",
    title: "How Ceramik expanded a focused prospecting pipeline",
    description:
      "A transparent account of how Ceramik used ScoreLead to discover pottery studios, reduce manual research, and expand its pipeline during an initial 30-day period.",
    answer:
      "In a customer-reported comparison with its previous manual workflow, Ceramik attributes 2,450 discovered company leads, 10× pipeline growth, and 85% less research time to its first 30 days using ScoreLead. These figures are directional customer evidence, not independently audited performance measurements.",
    highlights: [
      "Customer-reported: 2,450 company leads discovered during the first 30 days.",
      "Customer-reported: 10× relative pipeline growth during the same period.",
      "Customer-estimated: 85% less time spent on manual research.",
    ],
    sections: [
      {
        heading: "The starting problem",
        paragraphs: [
          "Ceramik serves pottery teachers and studio operators. Finding suitable studios required repeated local searches, website review, and manual organization before the team could begin relevant conversations.",
        ],
      },
      {
        heading: "The ScoreLead workflow",
        paragraphs: [
          "The team defined the studio market, ran geographic discovery, reviewed account evidence, and used enriched context to decide which businesses entered the outreach pipeline.",
        ],
        points: ["Market definition", "Studio discovery", "Evidence review", "Pipeline prioritization"],
      },
      {
        heading: "Measurement window and definitions",
        paragraphs: [
          "The published comparison covers the first 30 days of ScoreLead use against Ceramik’s previous manual research process. Discovered leads means company records surfaced by the discovery workflow; it does not mean independently verified contacts, opportunities, or customers.",
          "The 10× pipeline figure and 85% time reduction are Ceramik’s directional estimates. Starting and ending pipeline counts, accepted-account rates, conversion counts, and time sheets were not supplied for independent review, so this page does not present those figures as audited benchmarks.",
        ],
        points: [
          "Window: first 30 days",
          "Baseline: previous manual workflow",
          "Source: customer report",
          "Independent audit: not performed",
        ],
      },
      {
        heading: "How to interpret the result",
        paragraphs: [
          "Use the figures as one customer’s directional account of an early workflow. Results depend on the target market, acceptance criteria, available public evidence, review process, and outreach execution; they are not a controlled experiment or a guarantee.",
        ],
      },
    ],
    proofLabel: "Methodology and disclosure",
    proof:
      "ScoreLead publishes these figures as customer-reported evidence with the known window, baseline, definitions, and limitations visible. Any future revision must preserve the original source and update history rather than silently replacing the numbers.",
    ctaTitle: "Build a prospecting workflow around your own market.",
    ctaDescription: "Define the target, keep the evidence, and measure accepted accounts.",
    ctaLabel: "Start your workflow",
  },
  "company-pricing": {
    eyebrow: "Pricing",
    title: "Start free. Upgrade when the workflow proves useful.",
    description:
      "Use ScoreLead’s core workflow on the Free plan, then move to Pro for higher limits across discovery, businesses, content, images, and outreach.",
    answer:
      "The Free plan costs $0 and includes one business, one discovery run of up to 10 leads, one content plan, and one AI image. The Pro plan is listed at $49 per month and unlocks the limits shown on this page.",
    highlights: ["Free: $0 per month", "Pro: $49 per month", "No credit card required to start"],
    sections: [
      {
        heading: "Free plan",
        paragraphs: [
          "Use one business workspace, run an initial discovery job, create one content plan, and generate one AI image to evaluate the workflow.",
        ],
      },
      {
        heading: "Pro plan",
        paragraphs: [
          "Pro supports multiple businesses, unlimited discovery runs, unlimited content plans, up to 30 AI images per month with a daily cap, and unlimited AI outreach generation.",
        ],
        points: ["Multiple businesses", "Unlimited discovery", "Unlimited content plans", "30 AI images per month", "Unlimited outreach"],
      },
      {
        heading: "Usage and third-party terms",
        paragraphs: [
          "Fair-use, provider, messaging, and platform constraints may apply to specific features. Current checkout terms are shown before purchase and control if this page becomes outdated.",
        ],
      },
    ],
    proofLabel: "Pricing accuracy",
    proof:
      "Prices and limits on this page reflect the product configuration published on July 23, 2026. Taxes, currencies, and future plan changes may affect the amount shown at checkout.",
    ctaTitle: "Evaluate ScoreLead with a real market.",
    ctaDescription: "Start on Free and upgrade only when you need more capacity.",
    ctaLabel: "Create a free account",
  },
  "company-security": {
    eyebrow: "Security and trust",
    title: "How ScoreLead approaches data and account security",
    description:
      "A plain-language overview of authentication, transport protections, access boundaries, data providers, and the responsibilities shared with customers.",
    answer:
      "ScoreLead uses authenticated accounts, server-side secrets, encrypted transport, scoped business access, and security headers. The service also depends on third-party infrastructure and data providers, so this page describes current controls without claiming certifications the company has not published.",
    highlights: [
      "Account and business access checks protect private workflows.",
      "Server credentials are kept out of public browser bundles.",
      "Privacy and deletion processes are documented publicly.",
    ],
    sections: [
      {
        heading: "Application controls",
        paragraphs: [
          "ScoreLead validates authenticated access to private business data, limits sensitive operations to the server, and applies rate limiting or signature checks to selected endpoints and webhooks.",
        ],
      },
      {
        heading: "Platform and provider boundaries",
        paragraphs: [
          "The service uses hosting, database, authentication, billing, email, AI, search, maps, storage, analytics, and messaging providers. Each provider has its own operational and security responsibilities.",
        ],
        points: ["TLS transport", "Server-side credentials", "Scoped access", "Webhook verification", "Deletion requests"],
      },
      {
        heading: "Report a concern",
        paragraphs: [
          "Send suspected vulnerabilities or security questions to hello@scorelead.io with enough detail to reproduce the issue. Do not access, change, or retain data that is not yours.",
        ],
      },
    ],
    proofLabel: "Current assurance level",
    proof:
      "ScoreLead does not claim SOC 2, ISO 27001, penetration-test, uptime, or encryption-at-rest certifications on this page because no supporting public evidence has been supplied.",
    ctaTitle: "Need a security answer for your review?",
    ctaDescription: "Contact the team with your specific requirement or data-flow question.",
    ctaLabel: "Contact ScoreLead",
  },
  "company-about": {
    eyebrow: "About ScoreLead",
    title: "Built to make B2B prospecting more explainable",
    description:
      "ScoreLead connects company discovery, evidence, qualification, scoring, and outreach so small teams can spend more time on informed sales conversations.",
    answer:
      "ScoreLead is B2B lead generation software for sales teams, agencies, founders, and growth operators. The product is built around a simple belief: automation should preserve the evidence and human judgment behind a prospecting decision.",
    highlights: [
      "Focused on company-level B2B discovery and qualification.",
      "Available in English, Portuguese, and Spanish.",
      "Designed for transparent, reviewable workflows.",
    ],
    sections: [
      {
        heading: "Why ScoreLead exists",
        paragraphs: [
          "Prospecting often lives across search tabs, copied spreadsheets, incomplete CRM records, and generic messaging tools. ScoreLead brings those steps into one workflow without pretending that automation removes market judgment.",
        ],
      },
      {
        heading: "What the product values",
        paragraphs: [
          "Useful evidence, explainable scores, honest uncertainty, focused targeting, and relevant outreach matter more than the largest possible list.",
        ],
        points: ["Evidence over volume", "Context over generic personalization", "Learning over vanity activity"],
      },
      {
        heading: "Who publishes this site",
        paragraphs: [
          "Product and educational content is published by the ScoreLead editorial team. Where a named author, reviewer, customer, or methodology is available, the page identifies it directly.",
        ],
      },
    ],
    proofLabel: "Entity transparency",
    proof:
      "This page intentionally avoids inventing founder biographies, office locations, company registrations, awards, or certifications that have not been provided for publication.",
    ctaTitle: "See whether the workflow fits your market.",
    ctaDescription: "Start free or contact the team with a specific prospecting problem.",
    ctaLabel: "Try ScoreLead",
  },
  "company-editorial-policy": {
    eyebrow: "Editorial standards",
    title: "How ScoreLead researches, writes, and updates content",
    description:
      "The standards used for product claims, educational guidance, sources, AI assistance, translations, corrections, and customer evidence.",
    answer:
      "ScoreLead publishes content to help B2B teams make better prospecting decisions. Articles separate product behavior from general advice, cite primary sources where they matter, disclose limitations, and avoid inventing people, customer outcomes, or authority signals.",
    highlights: [
      "Claims should be traceable to product behavior or an identified source.",
      "AI may assist drafting, but a human-owned editorial standard controls publication.",
      "Translations preserve meaning and are reviewed for locale-specific clarity.",
    ],
    sections: [
      {
        heading: "Who, how, and why",
        paragraphs: [
          "Each article identifies the publishing organization, the publication and review date, and the reason the content exists. Named experts are added only with permission and a real biography.",
        ],
      },
      {
        heading: "Sources and customer evidence",
        paragraphs: [
          "Regulatory, platform, and technical claims favor primary sources. Customer outcomes describe the measurement window and disclosure status, and they are not generalized into guarantees.",
        ],
        points: ["Primary sources", "Visible update dates", "Methodology notes", "Correction path"],
      },
      {
        heading: "Corrections and updates",
        paragraphs: [
          "Readers can send corrections to hello@scorelead.io. Material corrections update the visible review date; dates are not changed merely to make old content look fresh.",
        ],
      },
    ],
    proofLabel: "AI assistance disclosure",
    proof:
      "AI tools may support outlining, translation, and editing. ScoreLead remains responsible for the published text, source selection, product accuracy, and removal of unsupported claims.",
    ctaTitle: "Found something that needs correction?",
    ctaDescription: "Send the source, affected URL, and a short explanation to the team.",
    ctaLabel: "Contact the editors",
  },
  "author-scorelead-editorial": {
    eyebrow: "Author",
    title: "ScoreLead Editorial",
    description:
      "The product and research team responsible for ScoreLead’s guides to B2B account discovery, qualification, scoring, enrichment, and outreach.",
    answer:
      "ScoreLead Editorial is an organization author used when a named individual has not been approved for publication. It represents the team maintaining product documentation and educational content—not a fictional person.",
    highlights: [
      "Covers B2B prospecting operations and ScoreLead product workflows.",
      "Uses visible publication dates, sources, and methodology notes.",
      "Accepts corrections at hello@scorelead.io.",
    ],
    sections: [
      {
        heading: "Areas of focus",
        paragraphs: [
          "The team writes about ideal-customer definition, account discovery, enrichment, transparent scoring, data quality, pipeline design, and responsible outreach.",
        ],
      },
      {
        heading: "Review standard",
        paragraphs: [
          "Product claims are checked against current application behavior. External claims favor primary documentation, and uncertain evidence is labeled rather than strengthened through vague wording.",
        ],
        points: ["Product accuracy", "Primary sources", "Clear limitations", "Meaning-preserving translation"],
      },
      {
        heading: "Identity policy",
        paragraphs: [
          "When a real author or expert reviewer is available and consents to publication, ScoreLead will use a named profile with relevant experience and links. Until then, articles use this transparent organization identity.",
        ],
      },
    ],
    proofLabel: "Why there is no Person schema",
    proof:
      "This profile is represented as an Organization in structured data. Publishing a Person entity without a real, consenting individual would weaken trust rather than improve it.",
    ctaTitle: "Read the research behind the workflow.",
    ctaDescription: "Explore practical guides or send the team a correction.",
    ctaLabel: "Explore the blog",
  },
  "tool-icp-worksheet": {
    eyebrow: "Free tool · ICP worksheet",
    title: "Turn your ideal customer profile into usable search criteria",
    description:
      "Build a compact B2B ICP with required conditions, preferred signals, disqualifiers, problem evidence, and a clear learning plan.",
    answer:
      "A useful ICP should help a team accept or reject a company consistently. This worksheet turns broad positioning into observable account criteria that can be tested in discovery and revised with sales outcomes.",
    highlights: ["No account required", "Runs in your browser", "Print or save the completed worksheet"],
    sections: [
      {
        heading: "Describe the account, not a fictional buyer",
        paragraphs: [
          "Focus on company-level conditions: market, geography, business model, operations, problem evidence, and reasons the account may be a poor fit.",
        ],
      },
      {
        heading: "Separate requirements from preferences",
        paragraphs: [
          "Required criteria determine eligibility. Preferred signals help prioritize. Disqualifiers prevent attractive-looking but unsuitable accounts from entering the pipeline.",
        ],
      },
      {
        heading: "Connect the profile to outcomes",
        paragraphs: [
          "Review accepted accounts, objections, opportunities, and losses. Revise the profile only when evidence shows a criterion is missing or misweighted.",
        ],
      },
    ],
    proofLabel: "Privacy",
    proof: "Worksheet entries remain in the current browser page and are not sent to ScoreLead.",
    ctaTitle: "Ready to test the criteria against a market?",
    ctaDescription: "Use the worksheet first, then launch a focused discovery job.",
    ctaLabel: "Start free",
  },
  "tool-lead-scoring-calculator": {
    eyebrow: "Free tool · Scoring calculator",
    title: "Build an explainable B2B lead score",
    description:
      "Compare fit, reach, trust, engagement potential, and readiness without hiding the dimensions behind one number.",
    answer:
      "This calculator creates a transparent weighted score from five account dimensions. It is a prioritization aid: the result should be reviewed against the evidence and calibrated with accepted and rejected accounts.",
    highlights: ["Adjustable inputs", "Visible formula", "No data is submitted"],
    sections: [
      {
        heading: "Score each dimension from observable evidence",
        paragraphs: [
          "Use the same rubric for every account and keep unknown values distinct from weak signals. A score is only as useful as the evidence behind each input.",
        ],
      },
      {
        heading: "Treat hard requirements as gates",
        paragraphs: [
          "Regulatory, geographic, technical, or business-model requirements should be checked before a weighted score is used.",
        ],
      },
      {
        heading: "Calibrate with pipeline outcomes",
        paragraphs: [
          "Compare high and low scores with sales acceptance, positive conversations, opportunities, and customer quality.",
        ],
      },
    ],
    proofLabel: "Model limitation",
    proof: "The calculator uses equal weights for demonstration and does not estimate purchase intent.",
    ctaTitle: "Apply the model to discovered accounts.",
    ctaDescription: "Keep the evidence and score together inside ScoreLead.",
    ctaLabel: "Try ScoreLead scoring",
  },
  "tool-enrichment-checklist": {
    eyebrow: "Free tool · Data checklist",
    title: "Check whether a B2B account is ready for qualification",
    description:
      "Review identity, fit, problem, reachability, provenance, and freshness before data enters outreach or a CRM.",
    answer:
      "A complete-looking record is not necessarily useful. This checklist focuses on fields that support a sales decision and the source details needed to verify them.",
    highlights: ["Decision-focused fields", "Progress indicator", "No data is submitted"],
    sections: [
      {
        heading: "Confirm identity first",
        paragraphs: [
          "A normalized domain, company name, location, and profile links prevent duplicates and keep later evidence attached to the right business.",
        ],
      },
      {
        heading: "Add context for fit and relevance",
        paragraphs: [
          "Services, operating model, footprint, technology, reviews, hiring, and other public signals should connect directly to your ICP or problem hypothesis.",
        ],
      },
      {
        heading: "Preserve source and time",
        paragraphs: [
          "Record where important values came from, when they were observed, and whether they are confirmed, inferred, or unknown.",
        ],
      },
    ],
    proofLabel: "Data-use reminder",
    proof:
      "Completeness does not create permission to contact a person. Apply privacy, suppression, and channel rules separately.",
    ctaTitle: "Automate the repeatable parts of enrichment.",
    ctaDescription: "Use ScoreLead to organize public account context and source evidence.",
    ctaLabel: "Enrich an account",
  },
  "tool-roi-calculator": {
    eyebrow: "Free tool · ROI model",
    title: "Estimate the cost of manual B2B lead research",
    description:
      "Model monthly research cost, recoverable hours, and the break-even value of a more automated workflow.",
    answer:
      "This calculator converts team size, weekly research hours, loaded hourly cost, and an estimated reduction percentage into a planning estimate. It does not predict revenue or guarantee savings.",
    highlights: ["Transparent assumptions", "Editable reduction rate", "No data is submitted"],
    sections: [
      {
        heading: "Use loaded cost, not salary alone",
        paragraphs: [
          "Include the practical hourly cost of the people doing research and the tools or contractors directly involved in that work.",
        ],
      },
      {
        heading: "Estimate a conservative reduction",
        paragraphs: [
          "Automation rarely removes every research task. Keep verification, strategic-account work, exception handling, and quality review in the remaining workload.",
        ],
      },
      {
        heading: "Measure after implementation",
        paragraphs: [
          "Compare time per accepted account, data correction rate, and downstream conversion before and after the workflow changes.",
        ],
      },
    ],
    proofLabel: "Planning model",
    proof:
      "Results are arithmetic estimates based entirely on your inputs. They exclude software fees, implementation cost, taxes, and revenue effects.",
    ctaTitle: "Test the workflow before trusting the estimate.",
    ctaDescription: "Run a focused discovery job and measure actual accepted-account time.",
    ctaLabel: "Start a free test",
  },
}
