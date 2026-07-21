import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

/**
 * Resolve a business-local schedule in PostgreSQL. `AT TIME ZONE` uses the
 * database IANA timezone rules, so DST transitions do not depend on a worker's
 * host timezone or JavaScript runtime.
 */
export async function buildScheduledAtInPostgres(input: {
  now?: Date
  offsetDays: number
  localSendTime: string
  timezone: string
  allowedWeekdays: number[]
}): Promise<Date> {
  const now = input.now ?? new Date()
  const weekdays = input.allowedWeekdays.join(",")
  const result = await db.execute<{ scheduledAt: Date | string }>(sql`
    WITH schedule_input AS (
      SELECT
        ${now.toISOString()}::timestamptz AS now_utc,
        ${input.timezone}::text AS timezone,
        ${input.offsetDays}::integer AS offset_days,
        ${input.localSendTime}::time AS send_time,
        string_to_array(${weekdays}, ',')::integer[] AS allowed_weekdays
    ), target AS (
      SELECT
        schedule_input.*,
        (now_utc AT TIME ZONE timezone)::date + offset_days AS target_date
      FROM schedule_input
    ), candidates AS (
      SELECT target.*, target_date + day_offset::integer AS local_date
      FROM target
      CROSS JOIN generate_series(0, 14) AS day_offset
    )
    SELECT ((local_date + send_time) AT TIME ZONE timezone) AS "scheduledAt"
    FROM candidates
    WHERE extract(dow FROM local_date)::integer = ANY(allowed_weekdays)
      AND ((local_date + send_time) AT TIME ZONE timezone) > now_utc
    ORDER BY local_date
    LIMIT 1
  `)
  const value = result.rows[0]?.scheduledAt
  if (!value) throw new Error("Could not resolve an allowed WhatsApp send time")
  return value instanceof Date ? value : new Date(value)
}
