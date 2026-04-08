import { NextResponse } from "next/server"

const VALID_PHOTO_NAME = /^places\/[a-zA-Z0-9_-]+\/photos\/[a-zA-Z0-9_-]+$/

export async function GET(request: Request) {
  const url = new URL(request.url)
  const photoName = url.searchParams.get("name")

  if (!photoName || !VALID_PHOTO_NAME.test(photoName)) {
    return NextResponse.json({ error: "Invalid photo name" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${apiKey}`,
      { redirect: "follow" },
    )

    if (!res.ok) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    const contentType = res.headers.get("content-type") || "image/jpeg"
    const buffer = await res.arrayBuffer()

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 })
  }
}
