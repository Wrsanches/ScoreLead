import { eq } from "drizzle-orm"
import { cache } from "react"
import { db } from "@/lib/db"
import { business, user } from "@/lib/db/schema"

export const PLATFORM_ADMIN_ROLE = "admin"

export type BusinessAccess = {
  businessId: string
  businessName: string | null
  ownerUserId: string
  ownerName: string
  ownerEmail: string
  isOwner: boolean
  isPlatformAdmin: boolean
  readOnly: boolean
}

export type ViewableBusiness = {
  id: string
  name: string | null
  logo: string | null
  field: string | null
  website: string | null
  tags: string | null
  services: string | null
  lastDiscoveryKeywords: string[] | null
  suggestedKeywords: string[] | null
  ownerUserId?: string
  ownerName?: string | null
  ownerEmail?: string | null
  readOnly: boolean
}

export function canAccessBusiness(input: {
  actorUserId: string
  actorRole: string | null | undefined
  ownerUserId: string
  mode: "view" | "manage"
}): boolean {
  const isOwner = input.actorUserId === input.ownerUserId
  const isAdmin = input.actorRole === PLATFORM_ADMIN_ROLE
  if (input.mode === "manage") return isOwner || isAdmin
  return isOwner || isAdmin
}

export const getUserRole = cache(async (userId: string): Promise<string> => {
  const [row] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return row?.role ?? "user"
})

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === PLATFORM_ADMIN_ROLE
}

export const listViewableBusinesses = cache(async function listViewableBusinesses(
  actorUserId: string,
): Promise<ViewableBusiness[]> {
  if (await isPlatformAdmin(actorUserId)) {
    const businesses = await db
      .select({
        id: business.id,
        name: business.name,
        logo: business.logo,
        field: business.field,
        website: business.website,
        tags: business.tags,
        services: business.services,
        lastDiscoveryKeywords: business.lastDiscoveryKeywords,
        suggestedKeywords: business.suggestedKeywords,
        ownerUserId: business.userId,
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(business)
      .innerJoin(user, eq(business.userId, user.id))
      .orderBy(user.name, business.name)

    return businesses.map((row) => ({
      ...row,
      readOnly: false,
    }))
  }

  const businesses = await db
    .select({
      id: business.id,
      name: business.name,
      logo: business.logo,
      field: business.field,
      website: business.website,
      tags: business.tags,
      services: business.services,
      lastDiscoveryKeywords: business.lastDiscoveryKeywords,
      suggestedKeywords: business.suggestedKeywords,
    })
    .from(business)
    .where(eq(business.userId, actorUserId))

  return businesses.map((row) => ({ ...row, readOnly: false }))
})

/**
 * Resolves whether an authenticated actor may access a business. Owners retain
 * normal management rights, and platform admins may manage other businesses as
 * delegated actors while ownership remains with the original user.
 */
export const getBusinessAccess = cache(async function getBusinessAccess(
  actorUserId: string,
  businessId: string,
): Promise<BusinessAccess | null> {
  const [actorRole, [target]] = await Promise.all([
    getUserRole(actorUserId),
    db
      .select({
        businessId: business.id,
        businessName: business.name,
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
    !target ||
    !canAccessBusiness({
      actorUserId,
      actorRole,
      ownerUserId: target.ownerUserId,
      mode: "view",
    })
  ) {
    return null
  }

  const isOwner = actorUserId === target.ownerUserId
  const isAdmin = actorRole === PLATFORM_ADMIN_ROLE
  return {
    ...target,
    isOwner,
    isPlatformAdmin: isAdmin,
    readOnly: !isOwner && !isAdmin,
  }
})

export async function canManageBusiness(
  actorUserId: string,
  businessId: string,
): Promise<boolean> {
  const [actorRole, [target]] = await Promise.all([
    getUserRole(actorUserId),
    db
      .select({ ownerUserId: business.userId })
      .from(business)
      .where(eq(business.id, businessId))
      .limit(1),
  ])

  return target
    ? canAccessBusiness({
        actorUserId,
        actorRole,
        ownerUserId: target.ownerUserId,
        mode: "manage",
      })
    : false
}
