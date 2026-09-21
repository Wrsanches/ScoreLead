import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { emailComponent } from "@/lib/db/schema"
import {
  EMAIL_COMPONENT_KINDS,
  emailComponentPropsByKind,
  type EmailComponentKind,
  type EmailComponentSet,
  type EmailComponentsUpdate,
} from "@/lib/resend/blocks"

/** Stored header/footer for a business. Invalid rows read as null (defaults apply). */
export async function getEmailComponents(businessId: string): Promise<EmailComponentSet> {
  const rows = await db.select().from(emailComponent).where(eq(emailComponent.businessId, businessId))
  const set: EmailComponentSet = { header: null, footer: null }
  for (const row of rows) {
    const kind = row.kind as EmailComponentKind
    if (!EMAIL_COMPONENT_KINDS.includes(kind)) continue
    const parsed = emailComponentPropsByKind[kind].safeParse(row.props)
    if (!parsed.success) {
      console.warn(`[resend] stored ${kind} component for ${businessId} is invalid; using defaults`)
      continue
    }
    // The three branches have different prop types; the kind narrows which slot we fill.
    ;(set as Record<EmailComponentKind, unknown>)[kind] = parsed.data
  }
  return set
}

export async function upsertEmailComponents(
  businessId: string,
  patch: EmailComponentsUpdate,
  userId: string,
): Promise<EmailComponentSet> {
  const now = new Date()
  for (const kind of EMAIL_COMPONENT_KINDS) {
    const props = patch[kind]
    if (!props) continue
    await db
      .insert(emailComponent)
      .values({ id: randomUUID(), businessId, kind, props, updatedByUserId: userId, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [emailComponent.businessId, emailComponent.kind],
        set: { props, updatedByUserId: userId, updatedAt: now },
      })
  }
  return getEmailComponents(businessId)
}
