import { z } from "zod"
export const providerSchema = z.enum(["ga4", "search_console"])
export const resourceIdSchema = z.string().uuid()
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const n = Date.parse(`${v}T00:00:00Z`)
    return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === v
  }, "Use a valid calendar date in YYYY-MM-DD format")
const unique = <T>(v: T[]) => new Set(v).size === v.length
const field = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z][A-Za-z0-9_:]*$/)
const dates = { startDate: date, endDate: date }
function dateRange(v: { startDate: string; endDate: string }) {
  return (
    v.startDate <= v.endDate &&
    Date.parse(v.endDate) - Date.parse(v.startDate) <= 366 * 86400000
  )
}
export const gaQuerySchema = z
  .object({
    resourceId: resourceIdSchema,
    ...dates,
    metrics: z.array(field).min(1).max(10).refine(unique),
    dimensions: z.array(field).max(9).refine(unique).default([]),
    filters: z
      .array(
        z
          .object({
            field,
            match: z
              .enum([
                "EXACT",
                "BEGINS_WITH",
                "ENDS_WITH",
                "CONTAINS",
                "FULL_REGEXP",
                "PARTIAL_REGEXP",
              ])
              .default("EXACT"),
            value: z.string().max(500),
            caseSensitive: z.boolean().default(false),
          })
          .strict(),
      )
      .max(10)
      .default([]),
    orderBy: z
      .object({
        field,
        kind: z.enum(["metric", "dimension"]),
        descending: z.boolean().default(true),
      })
      .strict()
      .optional(),
    limit: z.number().int().min(1).max(1000).default(100),
    offset: z.number().int().min(0).max(1000000).default(0),
  })
  .strict()
  .refine(dateRange, "Dates must be ordered and span at most 367 days")
  .refine(
    (v) =>
      !v.orderBy ||
      (v.orderBy.kind === "metric" ? v.metrics : v.dimensions).includes(
        v.orderBy.field,
      ),
    "Order by a requested field",
  )
const searchDimension = z.enum([
  "date",
  "query",
  "page",
  "country",
  "device",
  "searchAppearance",
])
export const searchQuerySchema = z
  .object({
    resourceId: resourceIdSchema,
    ...dates,
    dimensions: z.array(searchDimension).max(6).refine(unique).default([]),
    filters: z
      .array(
        z
          .object({
            dimension: searchDimension,
            operator: z
              .enum([
                "equals",
                "notEquals",
                "contains",
                "notContains",
                "includingRegex",
                "excludingRegex",
              ])
              .default("equals"),
            expression: z.string().max(4096),
          })
          .strict(),
      )
      .max(10)
      .default([]),
    type: z
      .enum(["web", "image", "video", "news", "discover", "googleNews"])
      .default("web"),
    dataState: z.enum(["final", "all"]).default("final"),
    limit: z.number().int().min(1).max(1000).default(100),
    offset: z.number().int().min(0).max(50000).default(0),
  })
  .strict()
  .refine(dateRange, "Dates must be ordered and span at most 367 days")
export const fieldsSchema = z
  .object({
    resourceId: resourceIdSchema,
    search: z.string().max(100).default(""),
    offset: z.number().int().min(0).max(10000).default(0),
    limit: z.number().int().min(1).max(100).default(50),
  })
  .strict()
