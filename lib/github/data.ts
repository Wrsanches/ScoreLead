import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { githubConnection } from "@/lib/db/schema"
import { decryptGitHubToken } from "@/lib/github/security"
import type { PublicGitHubConnection } from "@/lib/github/contracts"
import { githubInstallationToken } from "@/lib/github/app"

export async function getGitHubConnection(businessId: string) {
  const [connection] = await db.select().from(githubConnection).where(eq(githubConnection.businessId, businessId)).limit(1)
  return connection ?? null
}

export async function githubToken(connection: typeof githubConnection.$inferSelect): Promise<string> {
  if (connection.authType === "github_app") {
    if (!connection.installationId || !connection.repositoryId) throw new Error("GITHUB_REPOSITORY_UNAVAILABLE")
    return githubInstallationToken(connection.installationId, connection.repositoryId)
  }
  return decryptGitHubToken(connection.encryptedToken, connection.businessId)
}

export function publicGitHubConnection(connection: typeof githubConnection.$inferSelect | null): PublicGitHubConnection | null {
  if (!connection) return null
  return {
    id: connection.id, repository: `${connection.owner}/${connection.repository}`,
    authType: connection.authType, githubLogin: connection.githubLogin,
    repositoryUrl: `https://github.com/${connection.owner}/${connection.repository}`,
    defaultBranch: connection.defaultBranch, contextPaths: connection.contextPaths,
    projectNotes: connection.projectNotes, codexWorkflow: connection.codexWorkflow,
    contextSyncedAt: connection.contextSyncedAt.toISOString(),
    contextFiles: connection.contextFiles.map((file) => ({ path: file.path, sha: file.sha, characters: file.text.length })),
  }
}
