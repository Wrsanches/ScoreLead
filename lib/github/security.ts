import { decryptIntegrationValue, encryptIntegrationValue, integrationKeyring } from "@/lib/security/token-encryption"

export function isGitHubConfigured(): boolean {
  try { integrationKeyring("github"); return true } catch { return false }
}

export function encryptGitHubToken(token: string, businessId: string): string {
  return encryptIntegrationValue("github", token, businessId)
}

export function decryptGitHubToken(value: string, businessId: string): string {
  return decryptIntegrationValue("github", value, businessId)
}
