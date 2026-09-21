import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema"
import { TOKEN_EMAIL_CONTEXT } from "@/lib/resend/blocks"
import type { TemplateSaveValues } from "@/lib/resend/data"
import { EMAIL_HTML_MAX_BYTES } from "@/lib/resend/render"
import { loadRenderDeps, renderTemplate } from "@/lib/resend/render-template"
import type { EmailTemplateFormInput } from "@/lib/resend/template-form"

/**
 * Turns validated form input into what gets stored. Blocks mode renders the
 * HTML snapshot (tokens intact) with the shared components current right now;
 * html mode stores the body as written.
 */
export async function prepareTemplateForSave(
  businessId: string,
  input: EmailTemplateFormInput,
): Promise<{ ok: true; values: TemplateSaveValues } | { ok: false; response: NextResponse }> {
  if (input.bodyMode === "html") {
    return {
      ok: true,
      values: { name: input.name, subject: input.subject, bodyMode: "html", bodyDoc: null, bodyHtml: input.bodyHtml ?? "" },
    }
  }
  const [biz] = await db.select().from(business).where(eq(business.id, businessId)).limit(1)
  if (!biz) return { ok: false, response: NextResponse.json({ error: "Business not found" }, { status: 404 }) }
  const rendered = await renderTemplate(
    { subject: input.subject, bodyMode: "blocks", bodyDoc: input.bodyDoc ?? null, bodyHtml: "" },
    await loadRenderDeps(biz),
    TOKEN_EMAIL_CONTEXT,
  )
  if (rendered.bytes > EMAIL_HTML_MAX_BYTES) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Rendered email exceeds the size limit", code: "HTML_TOO_LARGE" }, { status: 400 }),
    }
  }
  return {
    ok: true,
    values: { name: input.name, subject: input.subject, bodyMode: "blocks", bodyDoc: input.bodyDoc ?? null, bodyHtml: rendered.html },
  }
}
