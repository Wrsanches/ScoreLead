import { z } from "zod"
import { googleJson } from "./api"
import { cachedReport, selectedResource, withGoogleAccess } from "./data"
import { ReportingError } from "./errors"
import { gaQuerySchema, searchQuerySchema, fieldsSchema } from "./validation"

export function gaReportBody(input: z.output<typeof gaQuerySchema>) {
  return {
    dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
    dimensions: input.dimensions.map((name) => ({ name })),
    metrics: input.metrics.map((name) => ({ name })),
    ...(input.filters.length
      ? {
          dimensionFilter: {
            andGroup: {
              expressions: input.filters.map((f) => ({
                filter: {
                  fieldName: f.field,
                  stringFilter: {
                    matchType: f.match,
                    value: f.value,
                    caseSensitive: f.caseSensitive,
                  },
                },
              })),
            },
          },
        }
      : {}),
    ...(input.orderBy
      ? {
          orderBys: [
            {
              desc: input.orderBy.descending,
              ...(input.orderBy.kind === "metric"
                ? { metric: { metricName: input.orderBy.field } }
                : { dimension: { dimensionName: input.orderBy.field } }),
            },
          ],
        }
      : {}),
    limit: String(input.limit),
    offset: String(input.offset),
    returnPropertyQuota: true,
  }
}
export async function queryAnalytics(
  businessId: string,
  args: z.input<typeof gaQuerySchema>,
) {
  const input = gaQuerySchema.parse(args)
  return cachedReport(
    businessId,
    input.resourceId,
    { type: "ga4", ...input },
    async ({ connection, resource }) => {
      if (
        connection.provider !== "ga4" ||
        !/^properties\/\d+$/.test(resource.externalId)
      )
        throw new ReportingError("WRONG_RESOURCE_TYPE")
      const body = gaReportBody(input)
      return withGoogleAccess(businessId, connection.id, async (token) => {
        const compatibility = await googleJson<{
          dimensionCompatibilities?: {
            compatibility: string
            dimensionMetadata?: { apiName: string }
          }[]
          metricCompatibilities?: {
            compatibility: string
            metricMetadata?: { apiName: string }
          }[]
        }>(
          `https://analyticsdata.googleapis.com/v1beta/${resource.externalId}:checkCompatibility`,
          token,
          {
            dimensions: body.dimensions,
            metrics: body.metrics,
            dimensionFilter: body.dimensionFilter,
          },
        )
        if (
          compatibility.dimensionCompatibilities?.some(
            (v) =>
              input.dimensions.includes(v.dimensionMetadata?.apiName || "") &&
              v.compatibility === "INCOMPATIBLE",
          ) ||
          compatibility.metricCompatibilities?.some(
            (v) =>
              input.metrics.includes(v.metricMetadata?.apiName || "") &&
              v.compatibility === "INCOMPATIBLE",
          )
        )
          throw new ReportingError("INCOMPATIBLE_REPORT_FIELDS")
        const data = await googleJson<
          Record<string, unknown> & { rows?: unknown[]; rowCount?: number }
        >(
          `https://analyticsdata.googleapis.com/v1beta/${resource.externalId}:runReport`,
          token,
          body,
        )
        const returnedRows = data.rows?.length || 0
        return {
          source: "google_analytics_4",
          resource: {
            id: resource.id,
            name: resource.name,
            externalId: resource.externalId,
          },
          period: { startDate: input.startDate, endDate: input.endDate },
          data,
          pagination: {
            offset: input.offset,
            returnedRows,
            rowCount: data.rowCount || 0,
            nextOffset:
              input.offset + returnedRows < (data.rowCount || 0) &&
              returnedRows > 0
                ? input.offset + returnedRows
                : null,
          },
          limitations: [
            "Dates use the GA4 property's reporting time zone, returned in data.metadata.timeZone. Recent data may still change.",
            "Preserve Google metadata, including sampling, thresholding, currency and data-loss flags. User metrics are not additive across rows.",
            "Key events reflect the property's configuration; they are not automatically qualified leads or revenue.",
          ],
        }
      })
    },
  )
}
export function searchReportBody(input: z.output<typeof searchQuerySchema>) {
  return {
    startDate: input.startDate,
    endDate: input.endDate,
    dimensions: input.dimensions,
    type: input.type,
    dataState: input.dataState,
    rowLimit: input.limit,
    startRow: input.offset,
    ...(input.filters.length
      ? {
          dimensionFilterGroups: [{ groupType: "and", filters: input.filters }],
        }
      : {}),
  }
}
export async function querySearchConsole(
  businessId: string,
  args: z.input<typeof searchQuerySchema>,
) {
  const input = searchQuerySchema.parse(args)
  return cachedReport(
    businessId,
    input.resourceId,
    { reportType: "search_console", ...input },
    async ({ connection, resource }) => {
      if (connection.provider !== "search_console")
        throw new ReportingError("WRONG_RESOURCE_TYPE")
      const data = await withGoogleAccess(businessId, connection.id, (token) =>
        googleJson<Record<string, unknown> & { rows?: unknown[] }>(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(resource.externalId)}/searchAnalytics/query`,
          token,
          searchReportBody(input),
        ),
      )
      const returnedRows = data.rows?.length || 0
      return {
        source: "google_search_console",
        resource: {
          id: resource.id,
          name: resource.name,
          externalId: resource.externalId,
        },
        period: {
          startDate: input.startDate,
          endDate: input.endDate,
          timeZone: "America/Los_Angeles",
          dataState: input.dataState,
        },
        dimensions: input.dimensions,
        data,
        pagination: {
          offset: input.offset,
          returnedRows,
          nextOffset:
            returnedRows === input.limit && input.offset + returnedRows <= 50000
              ? input.offset + returnedRows
              : null,
          totalRowsKnown: false,
        },
        limitations: [
          "Search Console returns top rows, not an exhaustive export. Anonymized queries and internal limits can make grouped totals differ from site totals.",
          "CTR is a fraction; position is an average. Aggregate CTR from clicks / impressions, not by summing or averaging row CTR.",
          "Recent days may be delayed or incomplete. Empty rows mean no returned data, not a verified zero. API history is limited to approximately 16 months.",
          "Search Console and GA4 use different definitions, time zones and attribution; clicks and sessions are not interchangeable.",
        ],
      }
    },
  )
}
export async function reportingFields(
  businessId: string,
  args: z.input<typeof fieldsSchema>,
) {
  const input = fieldsSchema.parse(args)
  const { connection } = await selectedResource(businessId, input.resourceId)
  if (connection.provider === "search_console")
    return {
      source: "google_search_console",
      dimensions: [
        "date",
        "query",
        "page",
        "country",
        "device",
        "searchAppearance",
      ],
      metrics: [
        { name: "clicks", description: "Clicks from Google Search" },
        { name: "impressions", description: "Search result impressions" },
        {
          name: "ctr",
          description: "Clicks / impressions, a fraction from 0 to 1",
        },
        {
          name: "position",
          description: "Average topmost search result position",
        },
      ],
      filterOperators: [
        "equals",
        "notEquals",
        "contains",
        "notContains",
        "includingRegex",
        "excludingRegex",
      ],
      dataStates: ["final", "all"],
      note: "All four metrics are returned. Grouping and privacy limits affect totals.",
    }
  const result = await cachedReport(
    businessId,
    input.resourceId,
    { type: "metadata" },
    async ({ resource }) =>
      withGoogleAccess(businessId, connection.id, (token) =>
        googleJson<Record<string, unknown>>(
          `https://analyticsdata.googleapis.com/v1beta/${resource.externalId}/metadata`,
          token,
        ),
      ),
  )
  const data = result as Record<string, unknown>
  const fields = [
    ...((data.dimensions || []) as Record<string, unknown>[]).map((f) => ({
      ...f,
      kind: "dimension",
    })),
    ...((data.metrics || []) as Record<string, unknown>[]).map((f) => ({
      ...f,
      kind: "metric",
    })),
  ].filter((f) =>
    JSON.stringify(f).toLowerCase().includes(input.search.toLowerCase()),
  )
  return {
    source: "google_analytics_4",
    fields: fields.slice(input.offset, input.offset + input.limit),
    totalFields: fields.length,
    nextOffset:
      input.offset + input.limit < fields.length
        ? input.offset + input.limit
        : null,
    freshness: result.freshness,
    note: "Includes property-specific custom fields. query_analytics checks compatibility before running reports.",
  }
}
