import { describe, expect, it } from "bun:test"
import {
  getBusinessSwitchDestination,
  isAccountAdminPath,
  parseLegacyBusinessPath,
} from "./admin-routes"

describe("clean admin routes", () => {
  it("preserves collection pages while switching businesses", () => {
    expect(getBusinessSwitchDestination("/admin")).toBe("/admin")
    expect(getBusinessSwitchDestination("/admin/leads")).toBe("/admin/leads")
    expect(getBusinessSwitchDestination("/admin/leads/kanban")).toBe(
      "/admin/leads/kanban",
    )
  })

  it("leaves resource and form routes before changing businesses", () => {
    expect(getBusinessSwitchDestination("/admin/discovery-jobs/new")).toBe(
      "/admin/discovery-jobs",
    )
    expect(getBusinessSwitchDestination("/admin/discovery-jobs/job-1")).toBe(
      "/admin/discovery-jobs",
    )
    expect(
      getBusinessSwitchDestination("/admin/integrations/whatsapp-templates"),
    ).toBe("/admin/integrations")
  })

  it("returns account routes to the dashboard", () => {
    expect(getBusinessSwitchDestination("/admin/settings")).toBe("/admin")
    expect(getBusinessSwitchDestination("/admin/support")).toBe("/admin")
  })

  it("maps legacy business paths without losing their clean section", () => {
    expect(
      parseLegacyBusinessPath("/admin/business/business-1/leads"),
    ).toEqual({ businessId: "business-1", cleanPath: "/admin/leads" })
    expect(parseLegacyBusinessPath("/admin/business/business-1")).toEqual({
      businessId: "business-1",
      cleanPath: "/admin",
    })
  })

  it("identifies personal admin routes", () => {
    expect(isAccountAdminPath("/admin/settings/security")).toBe(true)
    expect(isAccountAdminPath("/admin/support")).toBe(true)
    expect(isAccountAdminPath("/admin/leads")).toBe(false)
  })
})
