import { NextResponse } from "next/server"
import { syncWhatsAppTemplates } from "@/lib/whatsapp/data"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"

/** Pull the latest templates (and their statuses) down from Meta. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error
  try {
    return NextResponse.json({
      templates: await syncWhatsAppTemplates(scoped.connection),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Template sync failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
