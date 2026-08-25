import { test, expect, describe } from "bun:test"
import { csvField, csvList, csvRow } from "./csv"

describe("csvField", () => {
  test("passes plain values through unquoted", () => {
    expect(csvField("Bright Smile")).toBe("Bright Smile")
    expect(csvField(4.5)).toBe("4.5")
    expect(csvField(true)).toBe("true")
  })

  test("renders empty for null and undefined", () => {
    expect(csvField(null)).toBe("")
    expect(csvField(undefined)).toBe("")
    expect(csvField("")).toBe("")
  })

  test("quotes fields containing the delimiter", () => {
    expect(csvField("Smith, Jones & Co")).toBe('"Smith, Jones & Co"')
  })

  test("escapes embedded quotes by doubling them", () => {
    expect(csvField('The "Best" Dentist')).toBe('"The ""Best"" Dentist"')
    expect(csvField('"')).toBe('""""')
  })

  test("quotes fields containing newlines", () => {
    expect(csvField("line one\nline two")).toBe('"line one\nline two"')
    expect(csvField("line one\r\nline two")).toBe('"line one\r\nline two"')
  })

  test("quotes values with meaningful surrounding whitespace", () => {
    expect(csvField(" leading")).toBe('" leading"')
    expect(csvField("trailing ")).toBe('"trailing "')
  })

  test("handles a value that needs both quoting and escaping", () => {
    expect(csvField('a, "b", c')).toBe('"a, ""b"", c"')
  })
})

describe("csvRow", () => {
  test("joins fields and terminates with CRLF", () => {
    expect(csvRow(["a", "b", "c"])).toBe("a,b,c\r\n")
  })

  test("preserves empty cells as consecutive delimiters", () => {
    expect(csvRow(["a", null, "c"])).toBe("a,,c\r\n")
    expect(csvRow([null, null])).toBe(",\r\n")
  })

  test("quotes only the fields that need it", () => {
    expect(csvRow(["plain", "with, comma", 3])).toBe('plain,"with, comma",3\r\n')
  })
})

describe("csvList", () => {
  test("joins with semicolons", () => {
    expect(csvList(["a@x.com", "b@x.com"])).toBe("a@x.com; b@x.com")
  })

  test("drops empty entries and trims", () => {
    expect(csvList([" a ", "", null, "b"])).toBe("a; b")
  })

  test("renders empty for missing lists", () => {
    expect(csvList(null)).toBe("")
    expect(csvList(undefined)).toBe("")
    expect(csvList([])).toBe("")
  })

  test("leaves quoting to csvField", () => {
    expect(csvField(csvList(["Smith, Co", "Other"]))).toBe('"Smith, Co; Other"')
  })
})
