import { expect, test } from "bun:test"
import { gaQuerySchema, searchQuerySchema, fieldsSchema } from "./validation"
const base = {
  resourceId: "11111111-1111-4111-8111-111111111111",
  startDate: "2026-09-01",
  endDate: "2026-09-20",
}
test("GA reports apply bounded pagination and documented defaults", () => {
  const input = gaQuerySchema.parse({ ...base, metrics: ["sessions"] })
  expect(input.limit).toBe(100)
  expect(input.offset).toBe(0)
  expect(input.dimensions).toEqual([])
})
test("invalid dates, reversed ranges and excessive history fail validation", () => {
  for (const dates of [
    { startDate: "2026-02-30" },
    { startDate: "yesterday" },
    { endDate: "2026-08-01" },
    { startDate: "2020-01-01" },
  ])
    expect(
      gaQuerySchema.safeParse({ ...base, ...dates, metrics: ["sessions"] })
        .success,
    ).toBe(false)
  expect(
    gaQuerySchema.safeParse({
      ...base,
      startDate: "2024-02-29",
      endDate: "2024-03-01",
      metrics: ["sessions"],
    }).success,
  ).toBe(true)
})
test("GA reports reject injection, duplicate fields, unbounded pages, extra keys and invalid order fields", () => {
  for (const change of [
    { metrics: [] },
    { metrics: ["sessions", "sessions"] },
    { metrics: ["../secrets"] },
    { limit: 1001 },
    { offset: -1 },
    { property: "properties/evil" },
    { businessId: "evil" },
    { orderBy: { field: "revenue", kind: "metric" } },
  ])
    expect(
      gaQuerySchema.safeParse({ ...base, metrics: ["sessions"], ...change })
        .success,
    ).toBe(false)
})
test("Search Console supports domain property IDs through server resource IDs, not arbitrary URLs", () => {
  const parsed = searchQuerySchema.parse(base)
  expect(parsed.type).toBe("web")
  expect(parsed.dataState).toBe("final")
  for (const change of [
    { dimensions: ["page", "page"] },
    { dimensions: ["hour"] },
    { dataState: "hourly_all" },
    { url: "https://evil.test" },
    { limit: 0 },
    { offset: 50001 },
  ])
    expect(searchQuerySchema.safeParse({ ...base, ...change }).success).toBe(
      false,
    )
})
test("metadata search and pagination are bounded", () => {
  expect(
    fieldsSchema.safeParse({
      resourceId: base.resourceId,
      search: "a".repeat(101),
    }).success,
  ).toBe(false)
  expect(fieldsSchema.parse({ resourceId: base.resourceId }).limit).toBe(50)
})
