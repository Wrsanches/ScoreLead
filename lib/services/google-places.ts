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

export async function searchPlaces(
  query: string,
  location: string,
): Promise<GooglePlaceResult[]> {
  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.types,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.photos,places.reviews",
        },
        body: JSON.stringify({
          textQuery: `${query} in ${location}`,
          maxResultCount: 20,
        }),
      },
    )

    if (!response.ok) {
      console.error(`Google Places failed: ${response.statusText}`)
      return []
    }

    const data = await response.json()
    const places = data.places || []

    return places.map(
      (p: {
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
      }) => ({
        name: p.displayName?.text || "",
        address: p.formattedAddress || "",
        types: p.types || [],
        website: p.websiteUri || undefined,
        phone: p.nationalPhoneNumber || undefined,
        placeId: p.id,
        rating: p.rating,
        reviewCount: p.userRatingCount,
        photoRef: p.photos?.[0]?.name || undefined,
        reviews: (p.reviews || []).map((r) => ({
          author: r.authorAttribution?.displayName || "Anonymous",
          rating: r.rating || 0,
          text: r.text?.text || "",
          date: r.relativePublishTimeDescription || r.publishTime || "",
        })).filter((r) => r.text.length > 0),
      }),
    )
  } catch (error) {
    console.error("Google Places search failed:", error)
    return []
  }
}
