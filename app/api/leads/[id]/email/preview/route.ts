import { NextResponse } from "next/server"
import { z } from "zod"
import { renderEmailTemplate } from "@/lib/resend/render"
import { sendContext } from "@/lib/resend/send"
import { scopeLeadEmail } from "../_shared"

const schema = z.object({ templateId: z.string().min(1), to: z.string().email().optional() })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", code: "INVALID_INPUT" }, { status: 400 })
  const scoped = await scopeLeadEmail(id, parsed.data.templateId)
  if ("error" in scoped) return scoped.error
  const to = parsed.data.to?.toLowerCase() ?? scoped.recipients[0] ?? ""
  const ctx = sendContext(
    {
      connection: scoped.connection,
      lead: scoped.lead,
      business: scoped.business,
      senderName: scoped.session.user.name,
      to,
    },
    "preview",
  )
  const rendered = renderEmailTemplate(
    { subject: scoped.template.subject, bodyHtml: scoped.template.bodyHtml },
    ctx,
  )
  return NextResponse.json({ ...rendered, to, recipients: scoped.recipients, from: `${scoped.connection.fromName} <${scoped.connection.fromEmail}>` })
}
