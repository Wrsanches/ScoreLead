import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { whatsappTemplate } from "@/lib/db/schema"
import { getUserPlan } from "@/lib/plan"
import {
  getOwnedBusiness,
  getWhatsAppConnection,
  syncWhatsAppTemplates,
} from "@/lib/whatsapp/data"

async function scope(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!(await getOwnedBusiness(id, session.user.id))) {
    return { error: NextResponse.json({ error: "Business not found" }, { status: 404 }) }
  }
  if (await getUserPlan(session.user.id) !== "pro") {
    return { error: NextResponse.json({ error: "WhatsApp automation requires Pro", code: "PLAN_LIMIT" }, { status: 402 }) }
  }
  const connection = await getWhatsAppConnection(id)
  if (!connection || connection.status !== "connected") {
    return { error: NextResponse.json({ error: "WhatsApp is not connected" }, { status: 409 }) }
  }
  return { connection }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const result = await scope(id)
  if (result.error) return result.error
  const templates = await db
    .select()
    .from(whatsappTemplate)
    .where(and(
      eq(whatsappTemplate.connectionId, result.connection.id),
      eq(whatsappTemplate.status, "APPROVED"),
      eq(whatsappTemplate.supported, true),
    ))
    .orderBy(whatsappTemplate.name, whatsappTemplate.language)
  return NextResponse.json({ templates })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const result = await scope(id)
  if (result.error) return result.error
  try {
    return NextResponse.json({ templates: await syncWhatsAppTemplates(result.connection) })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Template sync failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
