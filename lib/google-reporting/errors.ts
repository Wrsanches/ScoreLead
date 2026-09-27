export class ReportingError extends Error {
  constructor(
    public code: string,
    public status = 400,
    public retryAfter?: number,
  ) {
    super(code)
  }
}
export function reportingErrorResponse(error: unknown) {
  const known = error instanceof ReportingError
  return Response.json(
    { error: known ? error.code : "REPORTING_UNAVAILABLE" },
    {
      status: known ? error.status : 503,
      headers: {
        "Cache-Control": "no-store",
        ...(known && error.retryAfter
          ? { "Retry-After": String(error.retryAfter) }
          : {}),
      },
    },
  )
}
