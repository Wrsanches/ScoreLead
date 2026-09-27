/** Empty allowlist permits all businesses only after the explicit global switch. */
export function allowedBusinesses(): string[] {
  return (process.env.AGENTS_ALLOWED_BUSINESS_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
export function agentsEnabled(businessId: string): boolean {
  const allowed = allowedBusinesses();
  return (
    process.env.AGENTS_EXECUTION_ENABLED === "true" &&
    (!allowed.length || allowed.includes(businessId))
  );
}
