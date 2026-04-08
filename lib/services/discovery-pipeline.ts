import { db } from "@/lib/db"
import { discoveryJob, lead } from "@/lib/db/schema"
import { eq, or, inArray } from "drizzle-orm"
import { searchBusiness, filterUsefulResults } from "./brave-search"
import { searchPlaces } from "./google-places"
import { generateSearchQueries } from "./query-generator"
import {
  crawlAndExtract,
  scrapeAndExtract,
  mergeEnrichment,
  delay,
} from "./lead-extractor"
import { getLeadScoreBreakdown } from "./lead-scorer"
import {
  normalizeWebsiteUrl,
  getWebsiteDomain,
  normalizeBusinessName,
  cleanBusinessName,
  nameSimilarity,
  mergeDiscoveryQueries,
} from "./lead-utils"

// ── Types ──────────────────────────────────────────────────

export interface DiscoveryPipelineParams {
  business: {
    id: string
    website: string | null
    name: string | null
    description: string | null
    persona: string | null
    clientPersona: string | null
    field: string | null
    category: string | null
    tags: string | null
    businessModel: string | null
    services: string | null
    serviceArea: string | null
    location: string | null
    language: string | null
    competitors: string | null
  }
  keywords: string[]
  location: string
  maxResults: number
}

// ── Identity keys for fuzzy dedup ──────────────────────────

type LeadCandidate = Record<string, unknown>

function getIdentityKeys(lead: LeadCandidate) {
  const keys: string[] = []

  if (lead.googlePlaceId) keys.push(`place:${String(lead.googlePlaceId).trim()}`)

  const website = normalizeWebsiteUrl(lead.website as string | undefined)
  if (website) keys.push(`site:${website}`)

  return [...new Set(keys)]
}

/** Check if two leads are the same business by fuzzy name + location matching */
function isSameBusinessByName(a: LeadCandidate, b: LeadCandidate): boolean {
  const nameA = String(a.name || "")
  const nameB = String(b.name || "")
  if (!nameA || !nameB) return false

  const similarity = nameSimilarity(nameA, nameB)
  if (similarity < 0.6) return false

  // If names are very similar (80%+), match regardless of location
  if (similarity >= 0.8) return true

  // For 60-80% similarity, require same city or country
  const cityA = String(a.city || "").trim().toLowerCase()
  const cityB = String(b.city || "").trim().toLowerCase()
  const countryA = String(a.country || "").trim().toLowerCase()
  const countryB = String(b.country || "").trim().toLowerCase()

  if (cityA && cityB && cityA === cityB) return true
  if (countryA && countryB && countryA === countryB) return true

  return false
}

function mergeCandidateLead(base: LeadCandidate, incoming: LeadCandidate): LeadCandidate {
  const merged = { ...incoming, ...base }

  merged.name = base.name || incoming.name || "Unknown"
  merged.website = base.website || incoming.website
  merged.websiteDomain = getWebsiteDomain(String(merged.website || ""))
  merged.address = base.address || incoming.address
  merged.city = base.city || incoming.city
  merged.state = base.state || incoming.state
  merged.country = base.country || incoming.country
  merged.googlePlaceId = base.googlePlaceId || incoming.googlePlaceId
  merged.googleMapsUrl = base.googleMapsUrl || incoming.googleMapsUrl
  merged.googleRating = base.googleRating ?? incoming.googleRating
  merged.googleReviewCount = base.googleReviewCount ?? incoming.googleReviewCount
  merged.lat = base.lat ?? incoming.lat
  merged.lng = base.lng ?? incoming.lng
  merged.priceRange = base.priceRange || incoming.priceRange
  merged.photoUrl = base.photoUrl || incoming.photoUrl
  merged.source = base.source || incoming.source
  merged.discoveryQueries = mergeDiscoveryQueries(
    base.discoveryQueries as string[] | undefined,
    incoming.discoveryQueries as string[] | undefined,
  )
  merged.discoveryQuery = (merged.discoveryQueries as string[])[0] || base.discoveryQuery || incoming.discoveryQuery

  // Merge arrays
  for (const key of ["emails", "phones", "services", "amenities"] as const) {
    const combined = [...new Set([...((base[key] as string[]) || []), ...((incoming[key] as string[]) || [])])]
    if (combined.length > 0) merged[key] = combined
  }

  if (base.email && !merged.email) merged.email = base.email
  if (incoming.email && !merged.email) merged.email = incoming.email
  if (base.phone && !merged.phone) merged.phone = base.phone
  if (incoming.phone && !merged.phone) merged.phone = incoming.phone

  return merged
}

function mergeCandidateCollection(leads: LeadCandidate[]): LeadCandidate[] {
  const byKey = new Map<string, LeadCandidate>()
  const merged: LeadCandidate[] = []

  // First pass: merge by exact identity keys (placeId, website)
  for (const lead of leads) {
    const keys = getIdentityKeys(lead)
    let didMerge = false

    for (const key of keys) {
      const existing = byKey.get(key)
      if (existing) {
        const mergedLead = mergeCandidateLead(existing, lead)
        byKey.set(key, mergedLead)
        // Update all keys that pointed to existing
        for (const k of getIdentityKeys(mergedLead)) {
          byKey.set(k, mergedLead)
        }
        didMerge = true
        break
      }
    }

    if (!didMerge) {
      for (const key of keys) byKey.set(key, lead)
      if (keys.length === 0) merged.push(lead)
    }
  }

  // Collect unique entries from byKey
  const seen = new Set<LeadCandidate>()
  for (const lead of byKey.values()) {
    if (!seen.has(lead)) {
      seen.add(lead)
      merged.push(lead)
    }
  }

  // Second pass: fuzzy name matching to catch remaining duplicates
  const final: LeadCandidate[] = []
  for (const lead of merged) {
    let didMerge = false
    for (let i = 0; i < final.length; i++) {
      if (isSameBusinessByName(final[i], lead)) {
        final[i] = mergeCandidateLead(final[i], lead)
        didMerge = true
        break
      }
    }
    if (!didMerge) final.push(lead)
  }

  return final
}

async function dedupLeads(
  candidates: LeadCandidate[],
  _businessId: string,
): Promise<{ newLeads: LeadCandidate[]; alreadyExists: number }> {
  if (candidates.length === 0) return { newLeads: [], alreadyExists: 0 }

  const candidatePlaceIds = candidates
    .map((l) => String(l.googlePlaceId || "").trim())
    .filter(Boolean)
  const candidateWebsites = candidates
    .map((l) => normalizeWebsiteUrl(l.website as string | undefined))
    .filter((url): url is string => Boolean(url))

  const conditions = []
  if (candidatePlaceIds.length > 0) {
    conditions.push(inArray(lead.googlePlaceId, candidatePlaceIds))
  }
  if (candidateWebsites.length > 0) {
    conditions.push(inArray(lead.website, candidateWebsites))
  }

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
          .where(or(...conditions))
      : []

  // Also fetch names from DB for fuzzy matching
  const allDbLeads = await db
    .select({
      name: lead.name,
      city: lead.city,
      country: lead.country,
    })
    .from(lead)

  const existingKeys = new Set(existing.flatMap((l) => getIdentityKeys(l as LeadCandidate)))
  const seenKeys = new Set<string>()
  const newLeads: LeadCandidate[] = []
  let alreadyExists = 0

  for (const candidate of mergeCandidateCollection(candidates)) {
    const keys = getIdentityKeys(candidate)

    // Check exact key match
    if (keys.some((key) => existingKeys.has(key) || seenKeys.has(key))) {
      alreadyExists++
      continue
    }

    // Check fuzzy name match against DB
    const fuzzyMatch = allDbLeads.some((dbLead) =>
      isSameBusinessByName(candidate, dbLead as LeadCandidate),
    )
    if (fuzzyMatch) {
      alreadyExists++
      continue
    }

    keys.forEach((key) => seenKeys.add(key))
    newLeads.push(candidate)
  }

  return { newLeads, alreadyExists }
}

// ── Main pipeline ──────────────────────────────────────────

export async function runDiscoveryJob(
  jobId: string,
  params: DiscoveryPipelineParams,
) {
  const { business, keywords, location, maxResults } = params
  let totalInserted = 0
  let totalDuplicates = 0
  let totalFound = 0
  let consecutiveEmptyQueries = 0

  console.log(`[discovery] Job ${jobId.slice(0, 8)} started`)

  try {
    await db
      .update(discoveryJob)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(discoveryJob.id, jobId))

    // Step 1: Generate search queries
    const queries = await generateSearchQueries({
      business,
      keywords,
      location,
    })

    const totalQueries = queries.length
    console.log(`[discovery] Job ${jobId.slice(0, 8)} generated ${totalQueries} queries`)

    // Step 2: Process each query
    for (let qi = 0; qi < queries.length; qi++) {
      // Check if cancelled
      const [currentJob] = await db
        .select({ status: discoveryJob.status })
        .from(discoveryJob)
        .where(eq(discoveryJob.id, jobId))
      if (currentJob?.status === "cancelled") {
        console.log(`[discovery] Job ${jobId.slice(0, 8)} was cancelled`)
        return
      }

      const query = queries[qi]

      await db
        .update(discoveryJob)
        .set({ currentQuery: query })
        .where(eq(discoveryJob.id, jobId))

      console.log(`[discovery] Job ${jobId.slice(0, 8)} query ${qi + 1}/${totalQueries}: ${query}`)

      // Search Google Places
      const places = await searchPlaces(query, location)
      const googleLeads: LeadCandidate[] = places.map((place) => ({
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
        photoUrl: place.photoRef
          ? `/api/leads/photo?name=${encodeURIComponent(place.photoRef)}`
          : null,
        source: "google_places",
        firecrawlEnriched: false,
        discoveryQuery: query,
        discoveryQueries: [query],
      }))

      // Also search Brave
      try {
        const braveResults = await searchBusiness(query)
        for (const r of braveResults) {
          // Skip aggregator sites
          try {
            const hostname = new URL(r.url).hostname.replace("www.", "")
            const skipDomains = ["yelp.com", "facebook.com", "instagram.com", "yellowpages.com", "tripadvisor.com", "google.com", "wikipedia.org", "twitter.com", "x.com", "reddit.com", "linkedin.com", "linktr.ee", "tiktok.com", "youtube.com", "pinterest.com", "econodata.com.br", "rentechdigital.com", "glassdoor.com", "indeed.com", "crunchbase.com"]
            if (skipDomains.some((d) => hostname.includes(d))) continue
          } catch {
            continue
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
          })
        }
      } catch {
        // Brave search is supplementary
      }

      // Merge candidates across this query and dedup against DB
      const merged = mergeCandidateCollection(googleLeads)

      // Exclude user's own website
      const userDomain = getWebsiteDomain(business.website)
      const filtered = userDomain
        ? merged.filter((l) => getWebsiteDomain(l.website as string) !== userDomain)
        : merged

      const { newLeads, alreadyExists } = await dedupLeads(filtered, business.id)

      totalFound += merged.length
      totalDuplicates += alreadyExists

      // Step 3: Enrich each new lead
      for (let li = 0; li < newLeads.length && totalInserted < maxResults; li++) {
        let candidate = newLeads[li]
        candidate.id = crypto.randomUUID()

        // Deep crawl if website exists
        const businessContext = {
          field: business.field,
          category: business.category,
          description: business.description,
          keywords,
        }

        if (candidate.website) {
          try {
            const crawlData = await crawlAndExtract(
              String(candidate.website),
              candidate.country as string | undefined,
              businessContext,
            )
            candidate = mergeEnrichment(candidate, crawlData, String(candidate.website))
            if (crawlData.aiSummary) candidate.aiSummary = crawlData.aiSummary
            if (crawlData.websiteContent) candidate.websiteContent = crawlData.websiteContent
            if (crawlData.enrichmentSources) {
              candidate.enrichmentSources = [
                ...new Set([
                  ...((candidate.enrichmentSources as string[]) || []),
                  ...crawlData.enrichmentSources,
                ]),
              ]
            }
            candidate.firecrawlEnriched = true
            candidate.relevant = crawlData.relevant
            candidate.businessCategory = crawlData.businessCategory

            // Prefer AI-extracted business name over raw page title
            if (crawlData.businessName && candidate.source === "brave_search") {
              candidate.name = crawlData.businessName
            }
          } catch {
            // Keep partially enriched
          }
        }

        // Secondary: Brave search for social media enrichment
        if (candidate.name) {
          try {
            const braveQuery = `"${candidate.name}" ${location}`
            const braveResults = await searchBusiness(braveQuery)
            const useful = filterUsefulResults(braveResults)
            for (const result of useful) {
              try {
                const pageData = await scrapeAndExtract(result.url)
                candidate = mergeEnrichment(candidate, pageData, result.url)
              } catch {
                // Ignore failed secondary enrichments
              }
            }
          } catch {
            // Brave enrichment is supplementary
          }
        }

        // Step 4: Relevance check - skip leads the AI flagged as irrelevant
        if (candidate.relevant === false) {
          console.log(`[discovery] Job ${jobId.slice(0, 8)} skipping irrelevant lead: ${candidate.name} (category: ${candidate.businessCategory || "unknown"})`)
          continue
        }

        // Step 5: Score the lead
        candidate.websiteDomain = getWebsiteDomain(String(candidate.website || "")) ?? null
        const breakdown = getLeadScoreBreakdown(candidate as Record<string, unknown>)
        candidate.score = breakdown.score
        candidate.scoreBreakdown = { positives: breakdown.positives, risks: breakdown.risks, categories: breakdown.categories }

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
            googleReviews: (candidate.googleReviews as { author: string; rating: number; text: string; date: string }[]) || null,
            emails: (candidate.emails as string[]) || null,
            phones: (candidate.phones as string[]) || null,
            socialMedia: (candidate.socialMedia as Record<string, string>) || null,
            instagramHandle: (candidate.instagramHandle as string) || null,
            facebookUrl: (candidate.facebookUrl as string) || null,
            services: (candidate.services as string[]) || null,
            ownerName: (candidate.ownerName as string) || null,
            teamMembers: (candidate.teamMembers as { name: string; role?: string }[]) || null,
            operatingHours: (candidate.operatingHours as string) || null,
            yearEstablished: (candidate.yearEstablished as string) || null,
            pricingInfo: (candidate.pricingInfo as string) || null,
            amenities: (candidate.amenities as string[]) || null,
            aiSummary: (candidate.aiSummary as string) || null,
            websiteContent: (candidate.websiteContent as string) || null,
            enrichmentSources: (candidate.enrichmentSources as string[]) || null,
            score: breakdown.score,
            scoreBreakdown: { positives: breakdown.positives, risks: breakdown.risks, categories: breakdown.categories },
            source: String(candidate.source || "google_places"),
            firecrawlEnriched: Boolean(candidate.firecrawlEnriched),
            discoveryQuery: (candidate.discoveryQuery as string) || null,
            discoveryQueries: (candidate.discoveryQueries as string[]) || null,
            status: "new",
          })

          totalInserted++
          console.log(`[discovery] Job ${jobId.slice(0, 8)} inserted lead: ${candidate.name} (${breakdown.score.toFixed(1)})`)
        } catch (err) {
          console.error(`[discovery] Failed to insert lead:`, err)
        }

        // Rate limiting between enrichments
        if (li < newLeads.length - 1) {
          await delay(2000)
        }
      }

      // Track consecutive empty queries for early exit
      if (newLeads.length === 0) {
        consecutiveEmptyQueries++
      } else {
        consecutiveEmptyQueries = 0
      }

      // Update job progress
      await db
        .update(discoveryJob)
        .set({
          completedQueries: qi + 1,
          totalFound,
          insertedLeads: totalInserted,
          duplicateLeads: totalDuplicates,
        })
        .where(eq(discoveryJob.id, jobId))

      // Early exit: reached max results
      if (totalInserted >= maxResults) {
        console.log(`[discovery] Job ${jobId.slice(0, 8)} reached maxResults (${maxResults})`)
        break
      }

      // Early exit: 3 consecutive queries with no new leads (diminishing returns)
      if (consecutiveEmptyQueries >= 3) {
        console.log(`[discovery] Job ${jobId.slice(0, 8)} stopping early - ${consecutiveEmptyQueries} consecutive empty queries`)
        break
      }
    }

    // Complete
    await db
      .update(discoveryJob)
      .set({
        status: "completed",
        totalFound,
        insertedLeads: totalInserted,
        duplicateLeads: totalDuplicates,
        completedQueries: queries.length,
        currentQuery: null,
        completedAt: new Date(),
      })
      .where(eq(discoveryJob.id, jobId))

    console.log(`[discovery] Job ${jobId.slice(0, 8)} completed - ${totalInserted} inserted, ${totalDuplicates} duplicates`)
  } catch (error) {
    console.error("Discovery pipeline failed:", error)

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
      .where(eq(discoveryJob.id, jobId))

    throw error
  }
}
