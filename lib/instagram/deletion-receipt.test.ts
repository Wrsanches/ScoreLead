import { expect, test } from "bun:test"
import { createDeletionReceipt, validDeletionReceipt } from "./deletion-receipt"

test("deletion receipts are unique, authenticated and reject tampering", () => {
  const code = createDeletionReceipt("test-secret")
  expect(validDeletionReceipt(code, "test-secret")).toBe(true)
  expect(createDeletionReceipt("test-secret")).not.toBe(code)
  expect(validDeletionReceipt(code, "other-secret")).toBe(false)
  expect(validDeletionReceipt(code.slice(0, 95), "test-secret")).toBe(false)
  expect(validDeletionReceipt("0".repeat(96), "test-secret")).toBe(false)
})
