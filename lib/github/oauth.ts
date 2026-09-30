import { randomUUID } from "node:crypto"
import { and, eq, gt, lt } from "drizzle-orm"
import { db } from "@/lib/db"
import { githubAuthorization, githubOAuthState } from "@/lib/db/schema"
import { decryptGitHubToken, encryptGitHubToken } from "@/lib/github/security"
import { GitHubError, githubRequest, repositoryPath } from "@/lib/github/client"
import { githubAuthorizationUrl, githubOpaqueToken, githubStateHash, githubAppJwt } from "@/lib/github/app"
import type { GitHubInstallationView, GitHubRepositoryView } from "@/lib/github/contracts"

const authorizationContext = (businessId: string, userId: string) => `oauth:${businessId}:${userId}`
export async function beginGitHubConnection(userId: string, businessId: string, locale: string) {
  const state = githubOpaqueToken(), verifier = githubOpaqueToken()
  const url = githubAuthorizationUrl(state, verifier)
  await db.delete(githubOAuthState).where(lt(githubOAuthState.expiresAt, new Date()))
  await db.delete(githubAuthorization).where(lt(githubAuthorization.expiresAt, new Date()))
  await db.insert(githubOAuthState).values({ hash: githubStateHash(state), businessId, userId, locale,
    verifierEncrypted: encryptGitHubToken(verifier, state), expiresAt: new Date(Date.now() + 600_000) })
  return url
}

export async function consumeGitHubState(state: string, userId: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(state)) throw new GitHubError("GITHUB_AUTH_EXPIRED", 400)
  const [pending] = await db.delete(githubOAuthState).where(and(eq(githubOAuthState.hash, githubStateHash(state)), eq(githubOAuthState.userId, userId), gt(githubOAuthState.expiresAt, new Date()))).returning()
  if (!pending) throw new GitHubError("GITHUB_AUTH_EXPIRED", 400)
  return { ...pending, verifier: decryptGitHubToken(pending.verifierEncrypted, state) }
}

export async function saveGitHubAuthorization(userId: string, businessId: string, token: string, expiresAt: Date) {
  const identity = await githubRequest<{ login: string }>(token, "/user")
  if (!identity.login) throw new GitHubError("GITHUB_AUTH_FAILED", 400)
  const values = { githubLogin: identity.login, encryptedToken: encryptGitHubToken(token, authorizationContext(businessId, userId)), expiresAt }
  await db.insert(githubAuthorization).values({ id: randomUUID(), userId, businessId, ...values }).onConflictDoUpdate({ target: [githubAuthorization.userId, githubAuthorization.businessId], set: values })
}

export async function getGitHubAuthorization(userId: string, businessId: string) {
  const [row] = await db.select().from(githubAuthorization).where(and(eq(githubAuthorization.userId, userId), eq(githubAuthorization.businessId, businessId), gt(githubAuthorization.expiresAt, new Date()))).limit(1)
  return row ?? null
}
function authorizationToken(row: typeof githubAuthorization.$inferSelect) { return decryptGitHubToken(row.encryptedToken, authorizationContext(row.businessId, row.userId)) }

export async function listGitHubInstallations(row: typeof githubAuthorization.$inferSelect): Promise<GitHubInstallationView[]> {
  const installations: GitHubInstallationView[] = []
  for (let page = 1; page <= 10; page++) {
    const result = await githubRequest<{ total_count: number; installations: { id: number; account: { login: string }; suspended_at: string | null }[] }>(authorizationToken(row), `/user/installations?per_page=100&page=${page}`)
    installations.push(...result.installations.filter((installation) => !installation.suspended_at && installation.account.login).map((installation) => ({ id: String(installation.id), login: installation.account.login })))
    if (page * 100 >= result.total_count) return installations
  }
  throw new GitHubError("GITHUB_INSTALLATIONS_LIMIT", 400)
}

export async function listGitHubRepositories(row: typeof githubAuthorization.$inferSelect, installationId: string, page: number) {
  const result = await githubRequest<{ total_count: number; repositories: { id: number; full_name: string; private: boolean; description: string | null; archived: boolean; permissions?: { push?: boolean; admin?: boolean } }[] }>(authorizationToken(row), `/user/installations/${installationId}/repositories?per_page=25&page=${page + 1}`)
  const repositories: GitHubRepositoryView[] = result.repositories.map((repository) => ({ id: String(repository.id), fullName: repository.full_name, private: repository.private, description: repository.description, archived: repository.archived, writable: !!(repository.permissions?.push || repository.permissions?.admin) }))
  return { repositories, total: result.total_count, page, pageSize: 25 }
}

export async function verifyGitHubSelection(row: typeof githubAuthorization.$inferSelect, installationId: string, repositoryId: string) {
  const token = authorizationToken(row)
  // Both requests use the user's token. Never trust an installation ID supplied by the browser.
  const installations = await listGitHubInstallations(row)
  if (!installations.some((installation) => installation.id === installationId)) throw new GitHubError("GITHUB_REPOSITORY_UNAVAILABLE", 409)
  const repository = await githubRequest<{ id: number; full_name: string; archived: boolean; permissions?: { push?: boolean; admin?: boolean } }>(token, `/repositories/${repositoryId}`)
  if (String(repository.id) !== repositoryId || repository.archived || !(repository.permissions?.push || repository.permissions?.admin)) throw new GitHubError("GITHUB_REPOSITORY_READ_ONLY", 403)
  const [owner, name] = repository.full_name.split("/")
  const installation = await githubRequest<{ id: number }>(githubAppJwt(), `${repositoryPath(owner, name)}/installation`)
  if (String(installation.id) !== installationId) throw new GitHubError("GITHUB_REPOSITORY_UNAVAILABLE", 409)
  return { owner, repository: name, fullName: repository.full_name }
}
