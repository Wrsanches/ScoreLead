import { buildKey, extForMime, isS3Configured, putObject } from "@/lib/s3"

export interface GooglePlaceReview {
  author: string
  rating: number
  text: string
  date: string
}

export interface GooglePlaceResult {
  name: string
  address: string
  types: string[]
  website?: string
  phone?: string
  placeId: string
  rating?: number
  reviewCount?: number
  photoRef?: string
  reviews: GooglePlaceReview[]
}

interface RawPlace {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  types?: string[]
  websiteUri?: string
  nationalPhoneNumber?: string
  rating?: number
  userRatingCount?: number
  photos?: { name: string }[]
  reviews?: {
    authorAttribution?: { displayName?: string }
    rating?: number
    text?: { text?: string }
    publishTime?: string
    relativePublishTimeDescription?: string
  }[]
}

function mapPlace(p: RawPlace): GooglePlaceResult {
  return {
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    types: p.types || [],
    website: p.websiteUri || undefined,
    phone: p.nationalPhoneNumber || undefined,
    placeId: p.id,
    rating: p.rating,
    reviewCount: p.userRatingCount,
    photoRef: p.photos?.[0]?.name || undefined,
    reviews: (p.reviews || [])
      .map((r) => ({
        author: r.authorAttribution?.displayName || "Anonymous",
        rating: r.rating || 0,
        text: r.text?.text || "",
        date: r.relativePublishTimeDescription || r.publishTime || "",
      }))
      .filter((r) => r.text.length > 0),
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Text-search Google Places. Pass `maxPages` > 1 to page deeper via
 * `nextPageToken` (the new Places API returns up to ~20 results/page and
 * ~3 pages total per query). Batched discovery uses this so each
 * "Continue" run reaches results the earlier runs never saw.
 */
export async function searchPlaces(
  query: string,
  location: string,
  opts: { maxPages?: number } = {},
): Promise<GooglePlaceResult[]> {
  const maxPages = Math.max(1, opts.maxPages ?? 1)
  const results: GooglePlaceResult[] = []
  let pageToken: string | undefined

  try {
    for (let page = 0; page < maxPages; page++) {
      // A fresh nextPageToken is rejected for ~1-2s; wait before reusing it.
      if (pageToken) await sleep(2000)

      const body: Record<string, unknown> = pageToken
        ? { pageToken }
        : { textQuery: `${query} in ${location}`, maxResultCount: 20 }

      let response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
            // nextPageToken must be in the field mask or it's never returned.
            "X-Goog-FieldMask":
              "nextPageToken,places.id,places.displayName,places.formattedAddress,places.types,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.photos,places.reviews",
          },
          body: JSON.stringify(body),
        },
      )

      // A token that isn't ready yet returns 400; wait a beat and retry once.
      if (!response.ok && pageToken && response.status === 400) {
        await sleep(2000)
        response = await fetch(
          "https://places.googleapis.com/v1/places:searchText",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
              "X-Goog-FieldMask":
                "nextPageToken,places.id,places.displayName,places.formattedAddress,places.types,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.photos,places.reviews",
            },
            body: JSON.stringify(body),
          },
        )
      }

      if (!response.ok) {
        // Google returns a JSON error body explaining the failure (invalid
        // field mask, empty query, key restriction, etc.). statusText alone
        // ("Bad Request") is useless for diagnosis, so surface the body.
        const detail = await response.text().catch(() => "")
        console.error(
          `Google Places failed: ${response.status} ${response.statusText} - ${detail}`,
        )
        // Return whatever we gathered so far (graceful degradation when a
        // deeper page fails - the run just goes less deep).
        break
      }

      const data = await response.json()
      for (const p of (data.places || []) as RawPlace[]) results.push(mapPlace(p))

      pageToken = data.nextPageToken
      if (!pageToken) break // no more pages available for this query
    }

    return results
  } catch (error) {
    console.error("Google Places search failed:", error)
    return results
  }
}

/**
 * Fetches a Google Places photo and stores it in S3, returning the public URL.
 * Returns null if S3 isn't configured or the fetch/upload fails, so callers can
 * fall back to the on-demand proxy URL.
 */
export async function persistPlacePhoto(
  photoRef: string,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey || !isS3Configured()) return null
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/${photoRef}/media?maxHeightPx=400&key=${apiKey}`,
      { redirect: "follow" },
    )
    if (!res.ok) return null
    const contentType = (res.headers.get("content-type") || "image/jpeg")
      .split(";")[0]
      .trim()
    const buffer = Buffer.from(await res.arrayBuffer())
    const key = buildKey("lead-photo", { ext: extForMime(contentType) })
    return await putObject({ key, body: buffer, contentType })
  } catch (error) {
    console.error("Failed to persist place photo:", error)
    return null
  }
}
