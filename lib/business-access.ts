import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { business, user } from "@/lib/db/schema"

export const PLATFORM_ADMIN_ROLE = "admin"

export type BusinessAccess = {
  businessId: string
  ownerUserId: string
  ownerName: string
  ownerEmail: string
  isOwner: boolean
  isPlatformAdmin: boolean
  readOnly: boolean
}

export function canAccessBusiness(input: {
  actorUserId: string
  actorRole: string | null | undefined
  ownerUserId: string
  mode: "view" | "manage"
}): boolean {
  const isOwner = input.actorUserId === input.ownerUserId
  if (input.mode === "manage") return isOwner
  return isOwner || input.actorRole === PLATFORM_ADMIN_ROLE
}

export async function getUserRole(userId: string): Promise<string> {
  const [row] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return row?.role ?? "user"
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === PLATFORM_ADMIN_ROLE
}

/**
 * Resolves whether an authenticated actor may view a business. Owners retain
 * normal management rights; platform admins get read-only access to businesses
 * owned by other users.
 */
export async function getBusinessAccess(
  actorUserId: string,
  businessId: string,
): Promise<BusinessAccess | null> {
  const [[actor], [target]] = await Promise.all([
    db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, actorUserId))
      .limit(1),
    db
      .select({
        businessId: business.id,
        ownerUserId: business.userId,
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(business)
      .innerJoin(user, eq(business.userId, user.id))
      .where(eq(business.id, businessId))
      .limit(1),
  ])

  if (
    !actor ||
    !target ||
    !canAccessBusiness({
      actorUserId,
      actorRole: actor.role,
      ownerUserId: target.ownerUserId,
      mode: "view",
    })
  ) {
    return null
  }

  const isOwner = actorUserId === target.ownerUserId
  return {
    ...target,
    isOwner,
    isPlatformAdmin: actor.role === PLATFORM_ADMIN_ROLE,
    readOnly: !isOwner,
  }
}

export async function canManageBusiness(
  actorUserId: string,
  businessId: string,
): Promise<boolean> {
  const [target] = await db
    .select({ ownerUserId: business.userId })
    .from(business)
    .where(eq(business.id, businessId))
    .limit(1)

  return target
    ? canAccessBusiness({
        actorUserId,
        actorRole: null,
        ownerUserId: target.ownerUserId,
        mode: "manage",
      })
    : false
}
