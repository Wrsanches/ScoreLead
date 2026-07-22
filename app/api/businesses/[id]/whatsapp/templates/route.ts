import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { whatsappTemplate } from "@/lib/db/schema"
import {
  createConnectionTemplate,
  listConnectionTemplates,
} from "@/lib/whatsapp/data"
import { MetaGraphError } from "@/lib/whatsapp/meta"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"
import { templateFormSchema } from "@/lib/whatsapp/template-form"

/** Map a Meta Graph error to a client-facing response. */
function metaErrorResponse(error: unknown) {
  if (error instanceof MetaGraphError) {
    // Surface Meta's own message; treat their 4xx as a 400 (bad template),
    // anything else as an upstream failure.
    const status = error.status >= 400 && error.status < 500 ? 400 : 502
    return NextResponse.json({ error: error.message, code: error.code }, { status })
  }
  const message = error instanceof Error ? error.message : "Request failed"
  return NextResponse.json({ error: message }, { status: 502 })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error

  // ?scope=all returns every template (management view); the default returns
  // only the approved + supported templates the sending pipeline can use.
  const scope = new URL(request.url).searchParams.get("scope")
  if (scope === "all") {
    const templates = await listConnectionTemplates(scoped.connection.id)
    return NextResponse.json({ templates })
  }

  const templates = await db
    .select()
    .from(whatsappTemplate)
    .where(
      and(
        eq(whatsappTemplate.connectionId, scoped.connection.id),
        eq(whatsappTemplate.status, "APPROVED"),
        eq(whatsappTemplate.supported, true),
      ),
    )
    .orderBy(whatsappTemplate.name, whatsappTemplate.language)
  return NextResponse.json({ templates })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error

  const body = await request.json().catch(() => null)
  const parsed = templateFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid template" },
      { status: 400 },
    )
  }

  try {
    const template = await createConnectionTemplate(scoped.connection, parsed.data)
    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    return metaErrorResponse(error)
  }
}
