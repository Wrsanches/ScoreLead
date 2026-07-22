import { NextResponse } from "next/server"
import {
  deleteConnectionTemplate,
  editConnectionTemplate,
  getConnectionTemplate,
} from "@/lib/whatsapp/data"
import { MetaGraphError } from "@/lib/whatsapp/meta"
import { scopeWhatsAppRoute } from "@/lib/whatsapp/route-scope"
import { templateFormSchema } from "@/lib/whatsapp/template-form"

function metaErrorResponse(error: unknown) {
  if (error instanceof MetaGraphError) {
    const status = error.status >= 400 && error.status < 500 ? 400 : 502
    return NextResponse.json({ error: error.message, code: error.code }, { status })
  }
  const message = error instanceof Error ? error.message : "Request failed"
  return NextResponse.json({ error: message }, { status: 502 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> },
) {
  const { id, templateId } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error

  const existing = await getConnectionTemplate(scoped.connection.id, templateId)
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }
  // Meta rejects edits while a template is under review.
  if (existing.status.toUpperCase() === "PENDING") {
    return NextResponse.json(
      { error: "This template is still under review and can't be edited yet." },
      { status: 409 },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = templateFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid template" },
      { status: 400 },
    )
  }
  // Name and language are immutable on Meta; keep the stored values.
  if (parsed.data.name !== existing.name || parsed.data.language !== existing.language) {
    return NextResponse.json(
      { error: "Template name and language can't be changed after creation." },
      { status: 400 },
    )
  }

  try {
    const template = await editConnectionTemplate(scoped.connection, existing, parsed.data)
    return NextResponse.json({ template })
  } catch (error) {
    return metaErrorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> },
) {
  const { id, templateId } = await params
  const scoped = await scopeWhatsAppRoute(id)
  if ("error" in scoped) return scoped.error

  const existing = await getConnectionTemplate(scoped.connection.id, templateId)
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  try {
    await deleteConnectionTemplate(scoped.connection, existing)
    return NextResponse.json({ success: true })
  } catch (error) {
    return metaErrorResponse(error)
  }
}
