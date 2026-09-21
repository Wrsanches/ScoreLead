import { NextResponse } from "next/server"
import { scopeResendRoute } from "@/lib/resend/route-scope"
import { createEmailTemplate, listEmailTemplates } from "@/lib/resend/data"
import { emailTemplateFormSchema } from "@/lib/resend/template-form"
import { templateValidationResponse } from "@/lib/resend/http"
import { prepareTemplateForSave } from "@/lib/resend/template-save"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "view", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  return NextResponse.json({ templates: await listEmailTemplates(id) })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scoped = await scopeResendRoute(id, "manage", { requireConnection: false })
  if ("error" in scoped) return scoped.error
  const parsed = emailTemplateFormSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return templateValidationResponse(parsed.error)
  const prepared = await prepareTemplateForSave(id, parsed.data)
  if (!prepared.ok) return prepared.response
  const template = await createEmailTemplate(id, prepared.values, scoped.session.user.id)
  return NextResponse.json({ template }, { status: 201 })
}
