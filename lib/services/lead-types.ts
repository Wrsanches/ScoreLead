export const LEAD_STATUSES = ["new", "contacted", "interested", "not_interested", "customer"] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_SOURCES = ["google_places", "brave_search", "firecrawl", "manual"] as const
export type LeadSource = (typeof LEAD_SOURCES)[number]

export const LEAD_DISCOVERY_JOB_STATUSES = ["queued", "running", "completed", "failed"] as const
export type LeadDiscoveryJobStatus = (typeof LEAD_DISCOVERY_JOB_STATUSES)[number]

export interface LeadSocialMedia {
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
  pinterest?: string
  linkedin?: string
  twitter?: string
  whatsapp?: string
}

export interface Lead {
  id: string
  jobId: string
  businessId: string
  name: string | null
  website: string | null
  websiteDomain: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  description: string | null
  // Google Places
  googlePlaceId: string | null
  googleMapsUrl: string | null
  googleRating: number | null
  googleReviewCount: number | null
  lat: number | null
  lng: number | null
  priceRange: string | null
  photoUrl: string | null
  // Contact & social
  emails: string[] | null
  phones: string[] | null
  socialMedia: LeadSocialMedia | null
  instagramHandle: string | null
  facebookUrl: string | null
  // Enrichment
  services: string[] | null
  ownerName: string | null
  teamMembers: { name: string; role?: string }[] | null
  operatingHours: string | null
  yearEstablished: string | null
  pricingInfo: string | null
  amenities: string[] | null
  aiSummary: string | null
  websiteContent: string | null
  enrichmentSources: string[] | null
  // Scoring
  score: number
  scoreBreakdown: {
    positives: { label: string; value: number }[]
    risks: { label: string; value: number }[]
  } | null
  // Discovery
  source: LeadSource
  firecrawlEnriched: boolean
  discoveryQuery: string | null
  discoveryQueries: string[] | null
  status: LeadStatus
  createdAt: string | Date
}

export interface DiscoverRequest {
  country: string
  state?: string
  city: string
  keywords: string[]
  location: string
}

export interface DiscoverResult {
  leads: Lead[]
  totalFound: number
  alreadyExists: number
}
