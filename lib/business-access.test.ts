import { describe, expect, test } from "bun:test"
import { canAccessBusiness } from "@/lib/business-access"

describe("business access policy", () => {
  test("owners can view and manage their business", () => {
    const input = {
      actorUserId: "owner",
      actorRole: "user",
      ownerUserId: "owner",
    }

    expect(canAccessBusiness({ ...input, mode: "view" })).toBe(true)
    expect(canAccessBusiness({ ...input, mode: "manage" })).toBe(true)
  })

  test("platform admins can view another user's business", () => {
    expect(
      canAccessBusiness({
        actorUserId: "admin",
        actorRole: "admin",
        ownerUserId: "owner",
        mode: "view",
      }),
    ).toBe(true)
  })

  test("platform admins cannot manage another user's business", () => {
    expect(
      canAccessBusiness({
        actorUserId: "admin",
        actorRole: "admin",
        ownerUserId: "owner",
        mode: "manage",
      }),
    ).toBe(false)
  })

  test("regular users cannot access another user's business", () => {
    for (const mode of ["view", "manage"] as const) {
      expect(
        canAccessBusiness({
          actorUserId: "other-user",
          actorRole: "user",
          ownerUserId: "owner",
          mode,
        }),
      ).toBe(false)
    }
  })
})
