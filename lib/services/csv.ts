/**
 * Minimal RFC 4180 CSV serialization for lead exports.
 *
 * Deliberately dependency-free: the only tricky part is quoting, and getting it
 * wrong silently corrupts a customer's spreadsheet, so it is covered by tests
 * rather than trusted to a transitive dependency.
 */

/** Values a cell can hold before serialization. */
export type CsvValue = string | number | boolean | null | undefined

/**
 * Quote a single field. A field needs quoting when it contains the delimiter, a
 * double quote, or any newline; embedded quotes are escaped by doubling them.
 * A leading/trailing space also forces quotes so round-tripping preserves it.
 */
export function csvField(value: CsvValue): string {
  if (value === null || value === undefined) return ""
  const s = typeof value === "string" ? value : String(value)
  if (s === "") return ""
  const needsQuotes =
    s.includes(",") ||
    s.includes('"') ||
    s.includes("\n") ||
    s.includes("\r") ||
    s !== s.trim()
  if (!needsQuotes) return s
  return `"${s.replaceAll('"', '""')}"`
}

/** Serialize one row, CRLF-terminated as the spec requires. */
export function csvRow(values: readonly CsvValue[]): string {
  return `${values.map(csvField).join(",")}\r\n`
}

/**
 * Flatten a list-valued cell (emails, phones, services, tech stack) into one
 * field. Semicolons keep it readable in a spreadsheet without needing quotes.
 */
export function csvList(values: readonly CsvValue[] | null | undefined): string {
  if (!values) return ""
  return values
    .map((v) => (v === null || v === undefined ? "" : String(v).trim()))
    .filter((v) => v !== "")
    .join("; ")
}

/** Byte-order mark, so Excel opens UTF-8 exports without mangling accents. */
export const CSV_BOM = "﻿"
