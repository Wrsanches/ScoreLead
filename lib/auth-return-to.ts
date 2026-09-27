/** Only the MCP consent flow may resume through login; never accept external URLs. */
export function loginReturnTo(search: string, fallback: string) {
  const requested = new URLSearchParams(search).get("returnTo")
  return requested &&
    /^\/(?:pt\/|es\/)?mcp\/authorize\?request=[A-Za-z0-9_-]{43}$/.test(
      requested,
    )
    ? requested
    : fallback
}
