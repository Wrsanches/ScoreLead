import { NextResponse } from "next/server"
import { instagramEnabled } from "@/lib/instagram/config"
import {
  getConnection,
  publicConnection,
  disconnectInstagram,
} from "@/lib/instagram/data"
import { instagramAccess, publishingResponse } from "@/lib/instagram/http"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await instagramAccess(request, id)
    return NextResponse.json(
      {
        enabled: instagramEnabled(),
        connection: publicConnection(await getConnection(id)),
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    return publishingResponse(error)
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await instagramAccess(request, id, true)
    const connection = await getConnection(id)
    if (connection) await disconnectInstagram(connection.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return publishingResponse(error)
  }
}
