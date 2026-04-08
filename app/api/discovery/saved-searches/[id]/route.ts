import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { savedSearch } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const [search] = await db
    .select()
    .from(savedSearch)
    .where(
      and(
        eq(savedSearch.id, id),
        eq(savedSearch.userId, session.user.id),
      ),
    )

  if (!search) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(search)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const [search] = await db
    .select({ id: savedSearch.id })
    .from(savedSearch)
    .where(
      and(
        eq(savedSearch.id, id),
        eq(savedSearch.userId, session.user.id),
      ),
    )

  if (!search) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.delete(savedSearch).where(eq(savedSearch.id, id))

  return NextResponse.json({ success: true })
}
