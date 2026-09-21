import type { MarketingPageTranslation } from "./types"

export const marketingContentEn: Record<string, MarketingPageTranslation> = {
  "feature-ai-lead-discovery": {
    eyebrow: "Feature · Account discovery",
    title: "AI Lead Discovery for Your Target Market",
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
    title: "AI Lead Scoring Software for B2B Sales",
    description:
      "Prioritize B2B accounts with transparent AI lead scoring software that keeps fit, reach, trust, engagement, readiness, and source evidence visible.",
    answer:
      "ScoreLead is B2B lead scoring software for teams that need explainable account prioritization. It turns observable company signals into a consistent review queue while keeping every scoring dimension visible so sales can understand, challenge, and improve the model.",
    highlights: [
      "Separate company fit from timing and readiness.",
      "See dimension-level evidence instead of one opaque number.",
      "Use clear score tiers to trigger review, enrichment, or outreach.",
    ],
    sections: [
      {
        heading: "Use lead scoring software around your real ICP",
        paragraphs: [
          "Start with the company conditions tied to customer value, then separate hard requirements from ranking signals. ScoreLead evaluates the dimensions it can observe and explain instead of treating every available field as predictive.",
        ],
        points: ["Company fit", "Reach", "Trust", "Engagement potential", "Readiness"],
      },
      {
        heading: "Keep every AI score explainable",
        paragraphs: [
          "Each account keeps dimension-level evidence beside the total. Missing data does not quietly become a negative score, and unknown fields remain distinguishable from weak signals so representatives know when an account needs more research.",
        ],
        points: ["Visible dimensions", "Source-aware evidence", "Unknown-value handling", "Human overrides"],
      },
      {
        heading: "Calibrate scoring against sales outcomes",
        paragraphs: [
          "Compare scores with accepted accounts, replies, opportunities, customers, and rejection reasons. False positives and false negatives reveal whether the model, ICP, or source data needs to change.",
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
    title: "B2B Lead Enrichment Software",
    description:
      "Turn a company name and domain into sourced B2B lead enrichment for qualification, routing, personalization, CRM export, and account research.",
    answer:
      "ScoreLead is B2B lead enrichment software designed to reduce uncertainty rather than maximize field count. It organizes identity, fit, problem, reachability, and personalization signals while retaining the source context needed for verification.",
    highlights: [
      "Collect useful company, service, location, and public-contact context.",
      "Normalize fields for filtering without erasing the original evidence.",
      "Label missing or inferred values instead of presenting guesses as facts.",
    ],
    sections: [
      {
        heading: "Enrich B2B leads for a specific decision",
        paragraphs: [
          "Every enrichment field should help determine fit, explain a problem hypothesis, support contact planning, or improve a message. Unused data creates maintenance work without improving sales decisions.",
        ],
      },
      {
        heading: "Preserve sources, dates, and uncertainty",
        paragraphs: [
          "Web data changes. Source URLs, observation dates, original values, and confidence labels help representatives verify important details before using enriched data in qualification or outreach.",
        ],
        points: ["Identity", "Fit", "Problem evidence", "Reachability", "Personalization"],
      },
      {
        heading: "Export cleaner, CRM-ready account records",
        paragraphs: [
          "Consistent formats and duplicate detection make enriched accounts easier to filter and move into a CRM while keeping the underlying evidence available for review.",
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
    title: "B2B Outreach Automation with Context",
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
  "feature-ai-content-creation": {
    eyebrow: "Feature · Content creation",
    title: "AI Instagram Content Calendar for Business",
    description:
      "Plan a month of Instagram posts, carousels, and stories from your business profile, generate on-brand images with AI, and publish on schedule.",
    answer:
      "ScoreLead reads your business profile, audience, and brand style, then drafts a month of Instagram posts with hooks, captions, and hashtags. Every post gets AI-generated images in your brand palette, and approved posts can be scheduled straight to Instagram.",
    highlights: [
      "Draft a full month of posts, carousels, and stories in one click.",
      "Generate on-brand images for every slide, using your real products as references.",
      "Approve, refine, and schedule to Instagram without leaving the calendar.",
    ],
    sections: [
      {
        heading: "Start from your business, not a blank page",
        paragraphs: [
          "The planner reads your profile, services, audience, and brand voice, then maps the month across five content pillars: educate, showcase, story, proof, and engagement. Each post arrives with a scroll-stopping first line, a caption, hashtags, and a visual idea you can edit.",
        ],
      },
      {
        heading: "Images that look like your brand",
        paragraphs: [
          "Every post and carousel slide is rendered with the latest GPT Image model in your brand colors and typography. Attach a real product photo and the AI blends it into the scene without redrawing it. Change any slide with one sentence, or upload your own photo and keep going.",
        ],
        points: [
          "Brand colors and typography on every image",
          "Real product photos used as references",
          "Refine a slide with a single sentence",
          "Upload your own photos anytime",
        ],
      },
      {
        heading: "Review, then publish on schedule",
        paragraphs: [
          "Each post opens as an Instagram-style preview with its images, caption, and hashtags. Mark it approved when it is ready, pick the date and time, and ScoreLead publishes it through Meta's official platform even when you are not logged in.",
        ],
      },
      {
        heading: "Reuse beyond Instagram",
        paragraphs: [
          "Every caption and image is yours. Download them and repost on Facebook, TikTok, or LinkedIn in the same brand system. Direct scheduling is available for Instagram today.",
        ],
      },
    ],
    proofLabel: "What the AI does and does not do",
    proof:
      "ScoreLead drafts and renders content from your profile; you approve every post before it is scheduled. Instagram publishing requires a connected Instagram Business or Creator account and follows Meta's platform rules.",
    ctaTitle: "A month of content, planned in minutes.",
    ctaDescription: "The content calendar is included from the Growth plan. Start free and see the planner first.",
    ctaLabel: "Plan my content",
  },
  "use-case-agencies": {
    eyebrow: "Use case · Agencies",
    title: "B2B Lead Generation for Agencies",
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
  "compare-sales-prospecting-software": {
    eyebrow: "Comparison · Buying guide",
    title: "Sales Prospecting Software: What to Compare",
    description:
      "Compare B2B sales prospecting software by targeting control, account evidence, data quality, scoring, workflow fit, and measurable outcomes.",
    answer:
      "The right sales prospecting software should help a team turn a defined market into a reviewable account queue. Compare how each product discovers companies, preserves source evidence, handles duplicates and unknown data, explains prioritization, supports human review, and feeds real pipeline outcomes back into targeting.",
    highlights: [
      "Start with the prospecting problem and workflow, not the longest feature list.",
      "Test data provenance, freshness, identity matching, and scoring explanations.",
      "Measure accepted accounts and pipeline progress instead of exported-record volume.",
    ],
    sections: [
      {
        heading: "Define the job before comparing products",
        paragraphs: [
          "Decide whether the team needs account discovery, contact data, enrichment, scoring, outreach support, pipeline management, or a connected workflow. A narrow requirement makes demos comparable and prevents overlapping tools from creating duplicate records and unclear ownership.",
        ],
      },
      {
        heading: "Inspect the evidence behind every account",
        paragraphs: [
          "Ask where company data came from, when it was observed, how identity is matched, and how the product represents uncertainty. Representatives should be able to verify important fields before using them in qualification or personalization.",
        ],
        points: [
          "Source and observation date",
          "Company identity and duplicate controls",
          "Explicit unknown values",
          "Correctable score reasoning",
        ],
      },
      {
        heading: "Run a representative pilot",
        paragraphs: [
          "Use one real segment and the same acceptance rules for every shortlisted product. Review a sample manually, record false matches and missing evidence, and include the time required to clean, verify, and move accounts into the next step.",
        ],
      },
      {
        heading: "Compare business outcomes and operating cost",
        paragraphs: [
          "Track accepted accounts, research time per accepted account, reachable prospects, qualified conversations, and corrections. Include onboarding, integrations, governance, and human review in total cost; software price alone does not describe workflow value.",
        ],
      },
    ],
    proofLabel: "Evaluation boundary",
    proof:
      "ScoreLead combines company discovery, enrichment, explainable scoring, reviewed outreach, and pipeline status. It does not replace market strategy, fact verification, consent decisions, or the sales representative responsible for the final approach.",
    ctaTitle: "Evaluate ScoreLead with a real target segment.",
    ctaDescription:
      "Run a focused discovery workflow and inspect the evidence before deciding.",
    ctaLabel: "Start a free evaluation",
  },
  "compare-best-lead-scoring-software": {
    eyebrow: "Comparison · Lead scoring",
    title: "Best Lead Scoring Software for B2B Teams",
    description:
      "Compare B2B lead scoring software by explainability, data coverage, workflow fit, calibration, integrations, and the decisions each product supports.",
    answer:
      "The best lead scoring software is the product that matches your buying motion and makes its prioritization useful to sales. CRM-native scoring suits teams with deep activity history; intent platforms emphasize buying signals; ScoreLead is designed for source-aware account discovery, enrichment, and explainable scoring before outreach.",
    highlights: [
      "Choose the scoring category that matches your available data.",
      "Require visible signals, unknown-value handling, and calibration controls.",
      "Pilot against accepted accounts and real pipeline outcomes before scaling.",
    ],
    sections: [
      {
        heading: "Define what the score must decide",
        paragraphs: [
          "Clarify whether the score should route inbound leads, prioritize target accounts, detect active buying behavior, or rank a newly discovered market. A product can be strong in one of those jobs and weak in another.",
        ],
        points: ["Inbound routing", "Account prioritization", "Intent detection", "Market discovery"],
      },
      {
        heading: "Compare evidence and explainability",
        paragraphs: [
          "Ask which signals contribute to the score, how missing values behave, whether sales can inspect the evidence, and how overrides are recorded. A precise-looking number is not useful when the team cannot explain or improve it.",
        ],
      },
      {
        heading: "Evaluate workflow and integration fit",
        paragraphs: [
          "Review where scoring happens, which data must already exist, how accounts reach the CRM, and whether the product supports the regions and languages you sell into. Include implementation and data-maintenance work in the comparison.",
        ],
        points: ["Required data", "CRM handoff", "Regional coverage", "Human review"],
      },
      {
        heading: "Run a measurable pilot",
        paragraphs: [
          "Test a controlled segment and compare accepted-account rate, research time, false positives, opportunities, and rejection reasons. Avoid selecting software from feature count alone.",
        ],
      },
    ],
    proofLabel: "Comparison methodology",
    proof:
      "ScoreLead is included in this comparison and therefore has a commercial interest. The framework avoids unverifiable rankings and focuses on observable product fit, evidence quality, implementation requirements, and measurable pilot outcomes.",
    ctaTitle: "Test explainable scoring on a focused account segment.",
    ctaDescription: "Keep the evidence behind every score and compare the result with your current workflow.",
    ctaLabel: "Try ScoreLead scoring",
  },
  "compare-b2b-lead-enrichment-tools": {
    eyebrow: "Comparison · Data enrichment",
    title: "B2B Lead Enrichment Tools: Evaluation Guide",
    description:
      "Evaluate B2B lead enrichment tools by coverage, provenance, freshness, field accuracy, workflow fit, compliance controls, and total usable-record cost.",
    answer:
      "The best B2B lead enrichment tool is the one that returns decision-ready data for your market with enough source context to verify important fields. Database providers emphasize broad structured coverage; research automation offers flexible web collection; ScoreLead combines public account discovery, enrichment evidence, scoring, and review in one workflow.",
    highlights: [
      "Measure usable and verified records instead of raw field count.",
      "Test coverage separately for each target market and company segment.",
      "Keep sources, dates, unknown values, and compliance review visible.",
    ],
    sections: [
      {
        heading: "Start with the decision and required fields",
        paragraphs: [
          "List the minimum identity, fit, reachability, and personalization fields needed at each workflow stage. Buying a larger dataset does not improve results when most fields are never used.",
        ],
        points: ["Identity", "Company fit", "Reachability", "Personalization evidence"],
      },
      {
        heading: "Test coverage and accuracy on your market",
        paragraphs: [
          "Use a representative sample across countries, company sizes, and segments. Verify important values against primary company sources and record missing, stale, inferred, and incorrect fields separately.",
        ],
      },
      {
        heading: "Compare provenance and maintenance",
        paragraphs: [
          "Check whether the tool exposes sources and observation dates, supports corrections, prevents duplicates, and refreshes fast-changing fields. These controls determine how much manual verification remains after enrichment.",
        ],
        points: ["Source URLs", "Observation dates", "Confidence labels", "Refresh policy"],
      },
      {
        heading: "Calculate cost per usable account",
        paragraphs: [
          "Include provider fees, credits, failed lookups, verification time, duplicate cleanup, integration work, and the share of records sales actually accepts. Cost per row hides the operational cost of weak data.",
        ],
      },
    ],
    proofLabel: "Fair evaluation",
    proof:
      "ScoreLead is one of the tools being evaluated. This guide does not claim universal superiority; coverage, accuracy, and value vary by market, provider, source availability, workflow, and intended use.",
    ctaTitle: "Evaluate enrichment with your own account sample.",
    ctaDescription: "Discover, enrich, score, and review B2B companies while keeping source context attached.",
    ctaLabel: "Try B2B enrichment",
  },
  "case-study-ceramik": {
    eyebrow: "Customer story · Ceramik",
    title: "Ceramik: A Focused B2B Prospecting Case Study",
    description:
      "How Ceramik used ScoreLead to discover pottery studios, reduce manual research, and expand a focused prospecting pipeline during its first 30 days.",
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
    proof: "These published figures are approved customer-reported results. The first 30 days and previous manual workflow define the comparison; approval does not make this an independent audit.",
    ctaTitle: "Build a prospecting workflow around your own market.",
    ctaDescription: "Define the target, keep the evidence, and measure accepted accounts.",
    ctaLabel: "Start your workflow",
  },
  "company-pricing": {
    eyebrow: "Pricing",
    title: "ScoreLead Pricing: Start Free",
    description:
      "Use ScoreLead’s core workflow on the Free plan, try Starter for $2.95, then move up as discovery, outreach, and automation volume grows.",
    answer:
      "The Free plan costs $0 and includes one business and one discovery run of up to 10 leads, scored and enriched. Starter is $2.95 for the first 7 days and $19.95 per month after that, Growth is $29.95 per month, and Pro is $59.95 per month. Every paid allowance resets monthly.",
    highlights: [
      "Free: $0 per month, no credit card",
      "Starter: $2.95 for 7 days, then $19.95 per month",
      "Growth: $29.95 per month · Pro: $59.95 per month",
    ],
    sections: [
      {
        heading: "Free plan",
        paragraphs: [
          "Use one business workspace and run an initial discovery job to evaluate the workflow end to end: scoring, web enrichment, and AI outreach copy. Free limits are one-time totals rather than monthly allowances.",
        ],
      },
      {
        heading: "Starter plan",
        paragraphs: [
          "Starter starts at $2.95 for seven days and then bills $19.95 per month unless cancelled. It covers one business with 10 discovery runs a month of up to 25 leads each, 50 AI outreach messages, and CSV export of every enriched lead.",
        ],
        points: ["10 discovery runs per month", "Up to 25 leads per run", "50 AI outreach messages", "CSV export", "Scoring and web enrichment"],
      },
      {
        heading: "Growth plan",
        paragraphs: [
          "Growth adds the outreach side: WhatsApp sequences on the official Meta Business Platform, Apollo contact enrichment on the top leads of each run, the AI content calendar with generated post images, three business workspaces, and the ability to continue a discovery run deeper into the same area.",
        ],
        points: ["WhatsApp automation", "150 contact enrichments per month", "AI content calendar and images", "3 businesses", "30 discovery runs of up to 50 leads"],
      },
      {
        heading: "Pro plan",
        paragraphs: [
          "Pro is the agency tier: unlimited businesses, unlimited discovery runs with no per-run lead cap, unlimited content plans and AI outreach, 500 contact enrichments a month, and named decision-maker contacts on enriched leads.",
        ],
        points: ["Unlimited businesses", "Unlimited discovery and outreach", "Decision-maker contacts", "500 contact enrichments per month", "30 AI images per month"],
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
    title: "ScoreLead Data and Account Security",
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
          "Send suspected vulnerabilities or security questions through the ScoreLead contact page with enough detail to reproduce the issue. Do not access, change, or retain data that is not yours.",
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
  "tool-icp-worksheet": {
    eyebrow: "Free tool · ICP worksheet",
    title: "Free Ideal Customer Profile Worksheet",
    description:
      "Build your ideal customer profile with a free ICP worksheet, completed example, CSV download, and clear criteria for accepting or rejecting accounts.",
    answer:
      "A useful ICP should help a team accept or reject a company consistently. This worksheet turns broad positioning into observable account criteria that can be tested in discovery and revised with sales outcomes.",
    highlights: ["No account required", "Runs in your browser", "CSV download and print-ready worksheet"],
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
    title: "Free Lead Scoring Template & Calculator",
    description:
      "Use a free lead scoring template with adjustable weights, disqualifiers, a worked example, and CSV download to prioritize B2B accounts.",
    answer:
      "This calculator creates a transparent weighted score from five account dimensions. It is a prioritization aid: the result should be reviewed against the evidence and calibrated with accepted and rejected accounts.",
    highlights: ["Adjustable inputs", "Visible formula", "Adjustable weights and CSV export"],
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
    proof: "The calculator uses your relative weights and planning thresholds. It does not estimate purchase intent or reproduce ScoreLead’s AI model.",
    ctaTitle: "Apply the model to discovered accounts.",
    ctaDescription: "Keep the evidence and score together inside ScoreLead.",
    ctaLabel: "Try ScoreLead scoring",
  },
  "tool-enrichment-checklist": {
    eyebrow: "Free tool · Data checklist",
    title: "B2B Lead Enrichment Checklist",
    description:
      "Review identity, fit, problem, reachability, provenance, and freshness with a free B2B lead enrichment checklist before outreach or CRM import.",
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
      "Model monthly B2B lead research cost, recoverable hours, and the break-even value of a more automated prospecting workflow.",
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
