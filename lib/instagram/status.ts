export function publicationLocksPost(status?: string | null) {
  return Boolean(status && !["cancelled", "failed"].includes(status))
}
