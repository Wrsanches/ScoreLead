import { db } from "@/lib/db";
import { discoveryJob, lead } from "@/lib/db/schema";
import { and, eq, or, inArray, desc } from "drizzle-orm";
import {
  apolloMonthlyRemaining,
  recordApolloUsage,
  APOLLO_LEADS_PER_JOB,
} from "@/lib/plan";
import { enrichByDomain } from "./apollo";
import { searchBusiness, filterUsefulResults } from "./brave-search";
import { searchPlaces, persistPlacePhoto } from "./google-places";
import { generateSearchQueries, type WinningExemplars } from "./query-generator";
import {
  crawlAndExtract,
  scrapeAndExtract,
  extractFromSearchResults,
  mergeEnrichment,
  delay,
  RELEVANCE_DROP_FLOOR,
} from "./lead-extractor";
import { getLeadScoreBreakdown, type ScoringICP } from "./lead-scorer";
import {
  normalizeWebsiteUrl,
  getWebsiteDomain,
  cleanBusinessName,
  nameSimilarity,
  mergeDiscoveryQueries,
} from "./lead-utils";

// ── Types ──────────────────────────────────────────────────

export interface DiscoveryPipelineParams {
  business: {
    id: string;
    userId: string;
    website: string | null;
    name: string | null;
    description: string | null;
    persona: string | null;
    clientPersona: string | null;
    field: string | null;
    category: string | null;
    tags: string | null;
    businessModel: string | null;
    services: string | null;
    serviceArea: string | null;
    location: string | null;
    language: string | null;
    competitors: string | null;
  };
  keywords: string[];
  location: string;
  /** Per-run cap: how many NEW leads this batch should insert before stopping. */
  runCap: number;
  /** Google Places page-depth reached by prior runs (0 = none yet). */
  searchDepth: number;
  /** Cumulative counters from prior runs, so this batch accumulates onto them. */
  priorInserted: number;
  priorFound: number;
  priorDuplicates: number;
}

/** Google Places text search tops out at ~3 pages (~60 results) per query. */
const MAX_PLACES_PAGES = 3;

// ── Identity keys for fuzzy dedup ──────────────────────────

type LeadCandidate = Record<string, unknown>;

function getIdentityKeys(lead: LeadCandidate) {
  const keys: string[] = [];

  if (lead.googlePlaceId)
    keys.push(`place:${String(lead.googlePlaceId).trim()}`);

  const website = normalizeWebsiteUrl(lead.website as string | undefined);
  if (website) keys.push(`site:${website}`);

  return [...new Set(keys)];
}

/** Check if two leads are the same business by fuzzy name + location matching */
function isSameBusinessByName(a: LeadCandidate, b: LeadCandidate): boolean {
  const nameA = String(a.name || "");
  const nameB = String(b.name || "");
  if (!nameA || !nameB) return false;

  const similarity = nameSimilarity(nameA, nameB);
  if (similarity < 0.6) return false;

  // If names are very similar (80%+), match regardless of location
  if (similarity >= 0.8) return true;

  // For 60-80% similarity, require same city or country
  const cityA = String(a.city || "")
    .trim()
    .toLowerCase();
  const cityB = String(b.city || "")
    .trim()
    .toLowerCase();
  const countryA = String(a.country || "")
    .trim()
    .toLowerCase();
  const countryB = String(b.country || "")
    .trim()
    .toLowerCase();

  if (cityA && cityB && cityA === cityB) return true;
  if (countryA && countryB && countryA === countryB) return true;

  return false;
}

function mergeCandidateLead(
  base: LeadCandidate,
  incoming: LeadCandidate,
): LeadCandidate {
  const merged = { ...incoming, ...base };

  merged.name = base.name || incoming.name || "Unknown";
  merged.website = base.website || incoming.website;
  merged.websiteDomain = getWebsiteDomain(String(merged.website || ""));
  merged.address = base.address || incoming.address;
  merged.city = base.city || incoming.city;
  merged.state = base.state || incoming.state;
  merged.country = base.country || incoming.country;
  merged.googlePlaceId = base.googlePlaceId || incoming.googlePlaceId;
  merged.googleMapsUrl = base.googleMapsUrl || incoming.googleMapsUrl;
  merged.googleRating = base.googleRating ?? incoming.googleRating;
  merged.googleReviewCount =
    base.googleReviewCount ?? incoming.googleReviewCount;
  merged.lat = base.lat ?? incoming.lat;
  merged.lng = base.lng ?? incoming.lng;
  merged.priceRange = base.priceRange || incoming.priceRange;
  merged.photoUrl = base.photoUrl || incoming.photoUrl;
  merged.source = base.source || incoming.source;
  merged.discoveryQueries = mergeDiscoveryQueries(
    base.discoveryQueries as string[] | undefined,
    incoming.discoveryQueries as string[] | undefined,
  );
  merged.discoveryQuery =
    (merged.discoveryQueries as string[])[0] ||
    base.discoveryQuery ||
    incoming.discoveryQuery;

  // Merge arrays
  for (const key of ["emails", "phones", "services", "amenities"] as const) {
    const combined = [
      ...new Set([
        ...((base[key] as string[]) || []),
        ...((incoming[key] as string[]) || []),
      ]),
    ];
    if (combined.length > 0) merged[key] = combined;
  }

  if (base.email && !merged.email) merged.email = base.email;
  if (incoming.email && !merged.email) merged.email = incoming.email;
  if (base.phone && !merged.phone) merged.phone = base.phone;
  if (incoming.phone && !merged.phone) merged.phone = incoming.phone;

  return merged;
}

function mergeCandidateCollection(leads: LeadCandidate[]): LeadCandidate[] {
  const byKey = new Map<string, LeadCandidate>();
  const merged: LeadCandidate[] = [];

  // First pass: merge by exact identity keys (placeId, website)
  for (const lead of leads) {
    const keys = getIdentityKeys(lead);
    let didMerge = false;

    for (const key of keys) {
      const existing = byKey.get(key);
      if (existing) {
        const mergedLead = mergeCandidateLead(existing, lead);
        byKey.set(key, mergedLead);
        // Update all keys that pointed to existing
        for (const k of getIdentityKeys(mergedLead)) {
          byKey.set(k, mergedLead);
        }
        didMerge = true;
        break;
      }
    }

    if (!didMerge) {
      for (const key of keys) byKey.set(key, lead);
      if (keys.length === 0) merged.push(lead);
    }
  }

  // Collect unique entries from byKey
  const seen = new Set<LeadCandidate>();
  for (const lead of byKey.values()) {
    if (!seen.has(lead)) {
      seen.add(lead);
      merged.push(lead);
    }
  }

  // Second pass: fuzzy name matching to catch remaining duplicates
  const final: LeadCandidate[] = [];
  for (const lead of merged) {
    let didMerge = false;
    for (let i = 0; i < final.length; i++) {
      if (isSameBusinessByName(final[i], lead)) {
        final[i] = mergeCandidateLead(final[i], lead);
        didMerge = true;
        break;
      }
    }
    if (!didMerge) final.push(lead);
  }

  return final;
}

async function dedupLeads(
  candidates: LeadCandidate[],
  businessId: string,
): Promise<{ newLeads: LeadCandidate[]; alreadyExists: number }> {
  if (candidates.length === 0) return { newLeads: [], alreadyExists: 0 };

  const candidatePlaceIds = candidates
    .map((l) => String(l.googlePlaceId || "").trim())
    .filter(Boolean);
  const candidateWebsites = candidates
    .map((l) => normalizeWebsiteUrl(l.website as string | undefined))
    .filter((url): url is string => Boolean(url));

  const conditions = [];
  if (candidatePlaceIds.length > 0) {
    conditions.push(inArray(lead.googlePlaceId, candidatePlaceIds));
  }
  if (candidateWebsites.length > 0) {
    conditions.push(inArray(lead.website, candidateWebsites));
  }

  // Dedup is scoped to this business: other tenants' leads must not
  // swallow ours, and an unscoped scan grows with the whole table.
  const existing =
    conditions.length > 0
      ? await db
          .select({
            googlePlaceId: lead.googlePlaceId,
            website: lead.website,
            name: lead.name,
            city: lead.city,
            state: lead.state,
            country: lead.country,
          })
          .from(lead)
          .where(and(eq(lead.businessId, businessId), or(...conditions)))
      : [];

  // Also fetch names from DB for fuzzy matching
  const allDbLeads = await db
    .select({
      name: lead.name,
      city: lead.city,
      country: lead.country,
    })
    .from(lead)
    .where(eq(lead.businessId, businessId));

  const existingKeys = new Set(
    existing.flatMap((l) => getIdentityKeys(l as LeadCandidate)),
  );
  const seenKeys = new Set<string>();
  const newLeads: LeadCandidate[] = [];
  let alreadyExists = 0;

  for (const candidate of mergeCandidateCollection(candidates)) {
    const keys = getIdentityKeys(candidate);

    // Check exact key match
    if (keys.some((key) => existingKeys.has(key) || seenKeys.has(key))) {
      alreadyExists++;
      continue;
    }

    // Check fuzzy name match against DB
    const fuzzyMatch = allDbLeads.some((dbLead) =>
      isSameBusinessByName(candidate, dbLead as LeadCandidate),
    );
    if (fuzzyMatch) {
      alreadyExists++;
      continue;
    }

    keys.forEach((key) => seenKeys.add(key));
    newLeads.push(candidate);
  }

  return { newLeads, alreadyExists };
}

// ── Main pipeline ──────────────────────────────────────────

/**
 * Bump the job heartbeat (so the queue doesn't requeue us as stalled) and
 * report the current status in the same roundtrip, for cancel checks.
 */
async function touchJob(jobId: string): Promise<string | null> {
  const rows = await db
    .update(discoveryJob)
    .set({ heartbeatAt: new Date() })
    .where(eq(discoveryJob.id, jobId))
    .returning({ status: discoveryJob.status });
  return rows[0]?.status ?? null;
}

/**
 * Persist live progress counters (and bump the heartbeat) so the polling
 * UI updates mid-query. Enrichment is slow - crawls + AI + rate-limit
 * delays per lead - so batching these writes to the end of each query
 * would leave the panel stuck at 0 for minutes. Returns the job status in
 * the same roundtrip for cancel checks.
 */
async function writeProgress(
  jobId: string,
  progress: Partial<{
    totalFound: number;
    insertedLeads: number;
    duplicateLeads: number;
    completedQueries: number;
    currentQuery: string | null;
  }>,
): Promise<string | null> {
  const rows = await db
    .update(discoveryJob)
    .set({ ...progress, heartbeatAt: new Date() })
    .where(eq(discoveryJob.id, jobId))
    .returning({ status: discoveryJob.status });
  return rows[0]?.status ?? null;
}

/**
 * Feedback loop: pull traits + query patterns from leads this business already
 * converted (interested/customer), so the next run is biased toward finding
 * more of what actually works. Returns empty arrays when there's nothing yet.
 */
async function loadWinningExemplars(
  businessId: string,
): Promise<WinningExemplars> {
  const rows = await db
    .select({
      discoveryQueries: lead.discoveryQueries,
      industry: lead.industry,
      services: lead.services,
    })
    .from(lead)
    .where(
      and(
        eq(lead.businessId, businessId),
        inArray(lead.status, ["interested", "customer"]),
      ),
    )
    .orderBy(desc(lead.createdAt))
    .limit(25);

  const queries = new Set<string>();
  const traits = new Set<string>();
  for (const r of rows) {
    for (const q of r.discoveryQueries ?? []) queries.add(q);
    if (r.industry) traits.add(r.industry);
    for (const s of r.services ?? []) traits.add(s);
  }

  return {
    queries: [...queries].slice(0, 10),
    traits: [...traits].slice(0, 10),
  };
}

/**
 * Pro-only post-pass: enrich this job's highest-scoring leads with Apollo
 * firmographics + (optionally) decision-makers, then re-score them so the
 * firmographic signals count. Runs only on the top-N by score and is bounded
 * by the user's remaining monthly Apollo budget, to control the paid API cost.
 */
async function enrichTopLeadsWithApollo(
  jobId: string,
  userId: string,
  icp: ScoringICP,
): Promise<void> {
  if (!process.env.APOLLO_API_KEY) return;

  const budget = await apolloMonthlyRemaining(userId);
  if (budget <= 0) return;

  // Pull this job's best leads; filter to eligible ones (have a domain, not yet
  // Apollo-enriched) in JS, then take the top-N within budget.
  const candidates = await db
    .select()
    .from(lead)
    .where(eq(lead.jobId, jobId))
    .orderBy(desc(lead.score))
    .limit(APOLLO_LEADS_PER_JOB + 20);

  const eligible = candidates
    .filter((l) => l.websiteDomain || l.website)
    .filter((l) => !(l.enrichmentSources ?? []).includes("apollo"))
    .slice(0, Math.min(APOLLO_LEADS_PER_JOB, budget));

  let enriched = 0;
  for (const row of eligible) {
    const data = await enrichByDomain(String(row.website || row.websiteDomain));
    if (!data) continue;

    const sources = [...new Set([...(row.enrichmentSources ?? []), "apollo"])];
    // Re-score with the firmographic signals now present.
    const breakdown = getLeadScoreBreakdown(
      {
        ...row,
        industry: data.industry ?? row.industry,
        employeeCount: data.employeeCount ?? row.employeeCount,
        techStack: data.techStack ?? row.techStack,
        emailVerified: data.emailVerified ?? row.emailVerified,
      } as Record<string, unknown>,
      icp,
    );

    await db
      .update(lead)
      .set({
        industry: data.industry ?? row.industry,
        employeeCount: data.employeeCount ?? row.employeeCount,
        revenueRange: data.revenueRange ?? row.revenueRange,
        techStack: data.techStack ?? row.techStack,
        decisionMakers: data.decisionMakers ?? row.decisionMakers,
        emailVerified: data.emailVerified || row.emailVerified,
        // Fill a missing primary email with Apollo's, when it found one.
        email: row.email || data.email || null,
        enrichmentSources: sources,
        score: breakdown.score,
        scoreBreakdown: {
          positives: breakdown.positives,
          risks: breakdown.risks,
          categories: breakdown.categories,
        },
      })
      .where(eq(lead.id, row.id));

    enriched++;
  }

  if (enriched > 0) {
    await recordApolloUsage(userId, enriched);
    console.log(
      `[discovery] Job ${jobId.slice(0, 8)} Apollo-enriched ${enriched} lead(s)`,
    );
  }
}

export async function runDiscoveryJob(
  jobId: string,
  params: DiscoveryPipelineParams,
) {
  const { business, keywords, location, runCap, searchDepth } = params;
  // ICP for relative scoring: the same lead scores higher/lower depending on
  // how well it fits this searcher's business and ideal customer.
  const icp: ScoringICP = {
    field: business.field,
    category: business.category,
    clientPersona: business.clientPersona,
    services: business.services,
    serviceArea: business.serviceArea,
    competitors: business.competitors,
    location: business.location,
  };
  // Counters are cumulative across batches: seed them from the prior run so
  // the panel keeps climbing instead of resetting to 0 each Continue.
  let totalInserted = params.priorInserted;
  let totalDuplicates = params.priorDuplicates;
  let totalFound = params.priorFound;
  // Per-run counter: this batch stops once it inserts `runCap` NEW leads.
  let runInserted = 0;
  let consecutiveEmptyQueries = 0;
  let hitCap = false;

  // Each Continue run pages one level deeper into Google Places (run 1 -> 1
  // page, run 2 -> 2 pages, ...), capped at the API's ~3-page ceiling.
  const pagesThisRun = Math.min(searchDepth + 1, MAX_PLACES_PAGES);

  console.log(
    `[discovery] Job ${jobId.slice(0, 8)} started (depth ${pagesThisRun}, runCap ${runCap})`,
  );

  try {
    await db
      .update(discoveryJob)
      .set({
        status: "running",
        startedAt: new Date(),
        heartbeatAt: new Date(),
      })
      .where(eq(discoveryJob.id, jobId));

    // Step 1: Generate search queries, biased by what has already converted.
    const winning = await loadWinningExemplars(business.id);
    const queries = await generateSearchQueries({
      business,
      keywords,
      location,
      winning,
    });

    const totalQueries = queries.length;
    console.log(
      `[discovery] Job ${jobId.slice(0, 8)} generated ${totalQueries} queries`,
    );

    // Step 2: Process each query
    for (let qi = 0; qi < queries.length; qi++) {
      // Heartbeat + cancel check
      const statusNow = await touchJob(jobId);
      if (statusNow === "cancelled") {
        console.log(`[discovery] Job ${jobId.slice(0, 8)} was cancelled`);
        return;
      }

      const query = queries[qi];

      // touchJob just bumped the heartbeat, so this only sets the query.
      await db
        .update(discoveryJob)
        .set({ currentQuery: query })
        .where(eq(discoveryJob.id, jobId));

      console.log(
        `[discovery] Job ${jobId.slice(0, 8)} query ${qi + 1}/${totalQueries}: ${query}`,
      );

      // Search Google Places (paging deeper on continuation runs)
      const places = await searchPlaces(query, location, {
        maxPages: pagesThisRun,
      });
      const googleLeads: LeadCandidate[] = await Promise.all(
        places.map(async (place) => ({
          name: place.name,
          website: place.website || null,
          websiteDomain: getWebsiteDomain(place.website) ?? null,
          phone: place.phone || null,
          address: place.address,
          city: params.location.split(",")[0]?.trim() || null,
          country: params.location.split(",").pop()?.trim() || null,
          googlePlaceId: place.placeId,
          googleRating: place.rating ?? null,
          googleReviewCount: place.reviewCount ?? null,
          googleReviews: place.reviews.length > 0 ? place.reviews : null,
          lat: null,
          lng: null,
          priceRange: null,
          // Persist the photo to S3; fall back to the on-demand proxy if that
          // fails or S3 isn't configured.
          photoUrl: place.photoRef
            ? ((await persistPlacePhoto(place.photoRef)) ??
              `/api/leads/photo?name=${encodeURIComponent(place.photoRef)}`)
            : null,
          source: "google_places",
          firecrawlEnriched: false,
          discoveryQuery: query,
          discoveryQueries: [query],
        })),
      );

      // Also search Brave
      try {
        const braveResults = await searchBusiness(query);
        for (const r of braveResults) {
          // Skip aggregator sites
          try {
            const hostname = new URL(r.url).hostname.replace("www.", "");
            const skipDomains = [
              "yelp.com",
              "facebook.com",
              "instagram.com",
              "yellowpages.com",
              "tripadvisor.com",
              "google.com",
              "wikipedia.org",
              "twitter.com",
              "x.com",
              "reddit.com",
              "linkedin.com",
              "linktr.ee",
              "tiktok.com",
              "youtube.com",
              "pinterest.com",
              "econodata.com.br",
              "rentechdigital.com",
              "glassdoor.com",
              "indeed.com",
              "crunchbase.com",
            ];
            if (skipDomains.some((d) => hostname.includes(d))) continue;
          } catch {
            continue;
          }

          googleLeads.push({
            name: cleanBusinessName(r.title),
            website: r.url,
            websiteDomain: getWebsiteDomain(r.url),
            description: r.description,
            city: params.location.split(",")[0]?.trim() || null,
            country: params.location.split(",").pop()?.trim() || null,
            source: "brave_search",
            firecrawlEnriched: false,
            discoveryQuery: query,
            discoveryQueries: [query],
          });
        }
      } catch {
        // Brave search is supplementary
      }

      // Merge candidates across this query and dedup against DB
      const merged = mergeCandidateCollection(googleLeads);

      // Exclude user's own website
      const userDomain = getWebsiteDomain(business.website);
      const filtered = userDomain
        ? merged.filter(
            (l) => getWebsiteDomain(l.website as string) !== userDomain,
          )
        : merged;

      const { newLeads, alreadyExists } = await dedupLeads(
        filtered,
        business.id,
      );

      totalFound += merged.length;
      totalDuplicates += alreadyExists;

      // Persist Found/Duplicates now, before the slow per-lead enrichment
      // loop, so the panel reflects this query immediately.
      await writeProgress(jobId, {
        totalFound,
        duplicateLeads: totalDuplicates,
        completedQueries: qi,
      });

      // Step 3: Enrich each new lead (stop once this batch hits its cap)
      for (let li = 0; li < newLeads.length && runInserted < runCap; li++) {
        // Enrichment is the slow part (crawls + AI calls per lead), so
        // heartbeat, push live counters, and honor cancellation per lead,
        // not just per query.
        const leadLoopStatus = await writeProgress(jobId, {
          totalFound,
          insertedLeads: totalInserted,
          duplicateLeads: totalDuplicates,
          completedQueries: qi,
        });
        if (leadLoopStatus === "cancelled") {
          console.log(`[discovery] Job ${jobId.slice(0, 8)} was cancelled`);
          return;
        }

        let candidate = newLeads[li];
        candidate.id = crypto.randomUUID();

        // Deep crawl if website exists
        const businessContext = {
          field: business.field,
          category: business.category,
          description: business.description,
          keywords,
        };

        if (candidate.website) {
          try {
            const crawlData = await crawlAndExtract(
              String(candidate.website),
              candidate.country as string | undefined,
              businessContext,
            );
            candidate = mergeEnrichment(
              candidate,
              crawlData,
              String(candidate.website),
            );
            if (crawlData.aiSummary) candidate.aiSummary = crawlData.aiSummary;
            if (crawlData.websiteContent)
              candidate.websiteContent = crawlData.websiteContent;
            if (crawlData.enrichmentSources) {
              candidate.enrichmentSources = [
                ...new Set([
                  ...((candidate.enrichmentSources as string[]) || []),
                  ...crawlData.enrichmentSources,
                ]),
              ];
            }
            candidate.firecrawlEnriched = true;
            candidate.relevant = crawlData.relevant;
            candidate.relevanceScore = crawlData.relevanceScore;
            candidate.relevanceReason = crawlData.relevanceReason;
            candidate.businessCategory = crawlData.businessCategory;

            // Prefer AI-extracted business name over raw page title
            if (crawlData.businessName && candidate.source === "brave_search") {
              candidate.name = crawlData.businessName;
            }
          } catch {
            // Keep partially enriched
          }
        }

        // Secondary: web search to enrich social/contact data. This is the
        // primary signal for leads with no website of their own (e.g. studios
        // that live on Instagram): the result snippets + URLs carry the social
        // handles, phone/WhatsApp, address, and services.
        if (candidate.name) {
          try {
            const braveQuery = `"${candidate.name}" ${location}`;
            const braveResults = await searchBusiness(braveQuery);

            // Mine snippets + URLs across all results. Run the AI extractor when
            // the lead has no website (otherwise the site crawl already did it),
            // so website-less leads still get services, a category, and a
            // relevance grade instead of being scored on Google Places alone.
            const snippetData = await extractFromSearchResults(braveResults, {
              runAI: !candidate.website,
              country: candidate.country as string | undefined,
              businessContext,
              sourceLabel: braveQuery,
            });
            candidate = mergeEnrichment(candidate, snippetData, braveQuery);

            // Adopt AI category/relevance from snippets when the crawl didn't
            // provide them (i.e. for website-less leads).
            if (
              snippetData.relevanceScore != null &&
              candidate.relevanceScore == null
            ) {
              candidate.relevanceScore = snippetData.relevanceScore;
              candidate.relevanceReason = snippetData.relevanceReason;
            }
            if (!candidate.businessCategory && snippetData.businessCategory) {
              candidate.businessCategory = snippetData.businessCategory;
            }
            if (!candidate.aiSummary && snippetData.aiSummary) {
              candidate.aiSummary = snippetData.aiSummary;
            }
            if (snippetData.enrichmentSources || braveResults.length > 0) {
              candidate.enrichmentSources = [
                ...new Set([
                  ...((candidate.enrichmentSources as string[]) || []),
                  "web_search",
                ]),
              ];
            }

            // Still scrape non-social directory pages for deeper data; skip
            // social pages, which scrape poorly and are already covered above.
            const useful = filterUsefulResults(braveResults).filter((r) => {
              try {
                const host = new URL(r.url).hostname;
                return !/(instagram|facebook|tiktok|twitter|x)\.com/.test(host);
              } catch {
                return false;
              }
            });
            for (const result of useful) {
              try {
                const pageData = await scrapeAndExtract(result.url);
                candidate = mergeEnrichment(candidate, pageData, result.url);
              } catch {
                // Ignore failed secondary enrichments
              }
            }
          } catch {
            // Brave enrichment is supplementary
          }
        }

        // Step 4: Relevance check - only hard-drop leads well below the floor.
        // Borderline leads are kept and ranked down via the fit score, rather
        // than silently discarded by a binary flag.
        const relScore = candidate.relevanceScore as number | undefined;
        if (relScore != null && relScore < RELEVANCE_DROP_FLOOR) {
          console.log(
            `[discovery] Job ${jobId.slice(0, 8)} skipping low-relevance lead: ${candidate.name} (${relScore.toFixed(2)}, ${candidate.businessCategory || "unknown"})`,
          );
          continue;
        }

        // Step 5: Score the lead
        candidate.websiteDomain =
          getWebsiteDomain(String(candidate.website || "")) ?? null;
        const breakdown = getLeadScoreBreakdown(
          candidate as Record<string, unknown>,
          icp,
        );
        candidate.score = breakdown.score;
        candidate.scoreBreakdown = {
          positives: breakdown.positives,
          risks: breakdown.risks,
          categories: breakdown.categories,
        };

        // Step 6: Insert into DB
        try {
          await db.insert(lead).values({
            id: String(candidate.id),
            jobId,
            businessId: business.id,
            name: (candidate.name as string) || null,
            website: (candidate.website as string) || null,
            websiteDomain: (candidate.websiteDomain as string) || null,
            email: (candidate.email as string) || null,
            phone: (candidate.phone as string) || null,
            address: (candidate.address as string) || null,
            city: (candidate.city as string) || null,
            state: (candidate.state as string) || null,
            country: (candidate.country as string) || null,
            description: (candidate.description as string) || null,
            googlePlaceId: (candidate.googlePlaceId as string) || null,
            googleMapsUrl: (candidate.googleMapsUrl as string) || null,
            googleRating: (candidate.googleRating as number) ?? null,
            googleReviewCount: (candidate.googleReviewCount as number) ?? null,
            lat: (candidate.lat as number) ?? null,
            lng: (candidate.lng as number) ?? null,
            priceRange: (candidate.priceRange as string) || null,
            photoUrl: (candidate.photoUrl as string) || null,
            googleReviews:
              (candidate.googleReviews as {
                author: string;
                rating: number;
                text: string;
                date: string;
              }[]) || null,
            emails: (candidate.emails as string[]) || null,
            phones: (candidate.phones as string[]) || null,
            socialMedia:
              (candidate.socialMedia as Record<string, string>) || null,
            instagramHandle: (candidate.instagramHandle as string) || null,
            facebookUrl: (candidate.facebookUrl as string) || null,
            services: (candidate.services as string[]) || null,
            ownerName: (candidate.ownerName as string) || null,
            teamMembers:
              (candidate.teamMembers as { name: string; role?: string }[]) ||
              null,
            operatingHours: (candidate.operatingHours as string) || null,
            yearEstablished: (candidate.yearEstablished as string) || null,
            pricingInfo: (candidate.pricingInfo as string) || null,
            amenities: (candidate.amenities as string[]) || null,
            aiSummary: (candidate.aiSummary as string) || null,
            websiteContent: (candidate.websiteContent as string) || null,
            enrichmentSources:
              (candidate.enrichmentSources as string[]) || null,
            score: breakdown.score,
            scoreBreakdown: {
              positives: breakdown.positives,
              risks: breakdown.risks,
              categories: breakdown.categories,
            },
            relevanceScore: (candidate.relevanceScore as number) ?? null,
            relevanceReason: (candidate.relevanceReason as string) || null,
            source: String(candidate.source || "google_places"),
            firecrawlEnriched: Boolean(candidate.firecrawlEnriched),
            discoveryQuery: (candidate.discoveryQuery as string) || null,
            discoveryQueries: (candidate.discoveryQueries as string[]) || null,
            status: "new",
          });

          totalInserted++;
          runInserted++;
          console.log(
            `[discovery] Job ${jobId.slice(0, 8)} inserted lead: ${candidate.name} (${breakdown.score.toFixed(1)})`,
          );
          // Reflect the new lead in the panel right away, rather than
          // waiting for the next lead's heartbeat or the query to finish.
          await writeProgress(jobId, { insertedLeads: totalInserted });
        } catch (err) {
          console.error(`[discovery] Failed to insert lead:`, err);
        }

        // Rate limiting between enrichments
        if (li < newLeads.length - 1) {
          await delay(2000);
        }
      }

      // Track consecutive empty queries for early exit
      if (newLeads.length === 0) {
        consecutiveEmptyQueries++;
      } else {
        consecutiveEmptyQueries = 0;
      }

      // Update job progress
      await db
        .update(discoveryJob)
        .set({
          completedQueries: qi + 1,
          totalFound,
          insertedLeads: totalInserted,
          duplicateLeads: totalDuplicates,
          heartbeatAt: new Date(),
        })
        .where(eq(discoveryJob.id, jobId));

      // Early exit: this batch filled its per-run cap.
      if (runInserted >= runCap) {
        console.log(
          `[discovery] Job ${jobId.slice(0, 8)} reached runCap (${runCap})`,
        );
        hitCap = true;
        break;
      }

      // Early exit: 3 consecutive queries with no new leads (diminishing
      // returns). Disabled on continuation runs (pagesThisRun > 1): deep
      // pages often start with already-seen leads, so bailing here would
      // wrongly flag the city exhausted while later queries still have data.
      if (pagesThisRun === 1 && consecutiveEmptyQueries >= 3) {
        console.log(
          `[discovery] Job ${jobId.slice(0, 8)} stopping early - ${consecutiveEmptyQueries} consecutive empty queries`,
        );
        break;
      }
    }

    // Pro-only enrichment pass over this run's best leads (cost-controlled).
    try {
      await enrichTopLeadsWithApollo(jobId, business.userId, icp);
    } catch (err) {
      console.error(`[discovery] Apollo enrichment pass failed:`, err);
    }

    // Decide the terminal state for this batch:
    //  - hit the cap            -> "partial"   (more data likely, Continue on)
    //  - found nothing new      -> "exhausted" (city tapped out)
    //  - some new, room to page -> "partial"   (try a deeper page next time)
    //  - some new, paged to floor-> "exhausted"
    const exhausted = hitCap
      ? false
      : runInserted === 0 || pagesThisRun >= MAX_PLACES_PAGES;
    const status = exhausted ? "exhausted" : "partial";

    await db
      .update(discoveryJob)
      .set({
        status,
        exhausted,
        searchDepth: pagesThisRun,
        totalFound,
        insertedLeads: totalInserted,
        duplicateLeads: totalDuplicates,
        completedQueries: queries.length,
        currentQuery: null,
        completedAt: new Date(),
      })
      .where(eq(discoveryJob.id, jobId));

    console.log(
      `[discovery] Job ${jobId.slice(0, 8)} ${status} - +${runInserted} this run, ${totalInserted} total, ${totalDuplicates} duplicates`,
    );
  } catch (error) {
    console.error("Discovery pipeline failed:", error);

    await db
      .update(discoveryJob)
      .set({
        status: "failed",
        totalFound,
        insertedLeads: totalInserted,
        duplicateLeads: totalDuplicates,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(discoveryJob.id, jobId));

    throw error;
  }
}
