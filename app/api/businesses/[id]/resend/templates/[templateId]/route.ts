import { NextResponse } from "next/server"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { deleteEmailTemplate, getEmailTemplate, updateEmailTemplate } from "@/lib/resend/data"
import { emailTemplateFormSchema } from "@/lib/resend/template-form"
import { templateValidationResponse } from "@/lib/resend/http"
import { prepareTemplateForSave } from "@/lib/resend/template-save"

type Params = { params: Promise<{ id: string; templateId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id, templateId } = await params
  const scoped = await scopeResendRoute(id, "view", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const template = await getEmailTemplate(id, templateId)
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })
  return NextResponse.json({ template })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id, templateId } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const parsed = emailTemplateFormSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return templateValidationResponse(parsed.error)
  const prepared = await prepareTemplateForSave(id, parsed.data)
  if (!prepared.ok) return prepared.response
  const template = await updateEmailTemplate(id, templateId, prepared.values)
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 })
  return NextResponse.json({ template })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, templateId } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const removed = await deleteEmailTemplate(id, templateId)
  if (!removed) return NextResponse.json({ error: "Template not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
