import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { supportTask } from "@/lib/db/schema"
import { buildTaskIssue, findTaskIssue, GitHubError, githubRequest, repositoryPath } from "@/lib/github/client"
import { getGitHubConnection, githubToken } from "@/lib/github/data"

export class SupportTaskError extends Error {
  constructor(public code: string, public status = 409) { super(code) }
}

export async function publishSupportTask(task: typeof supportTask.$inferSelect, businessId: string, reconcile = false) {
  const connection = await getGitHubConnection(businessId)
  if (!connection) throw new SupportTaskError("GITHUB_NOT_CONNECTED")
  const repository = `${connection.owner}/${connection.repository}`
  if (task.githubRepository && task.githubRepository !== repository) throw new SupportTaskError("TASK_REPOSITORY_CHANGED")
  if (task.githubIssueUrl) return task
  // Resolve installation credentials before claiming an external mutation;
  // a failed token request must not be reported as an uncertain issue creation.
  const token = await githubToken(connection)
  if (reconcile) {
    if (task.status !== "publish_uncertain" && task.status !== "publishing") throw new SupportTaskError("TASK_STATE_CHANGED")
    const found = await findTaskIssue(token, connection.owner, connection.repository, task.id)
    if (!found) throw new SupportTaskError("GITHUB_ISSUE_NOT_FOUND_YET")
    const [updated] = await db.update(supportTask).set({ status: "published", githubIssueNumber: found.number,
      githubIssueUrl: found.html_url, errorCode: null, updatedAt: new Date() }).where(and(eq(supportTask.id, task.id), inArray(supportTask.status, ["publish_uncertain", "publishing"]))).returning()
    if (!updated) throw new SupportTaskError("TASK_STATE_CHANGED")
    return updated
  }
  const [claimed] = await db.update(supportTask).set({ status: "publishing", githubRepository: repository, errorCode: null, updatedAt: new Date() })
    .where(and(eq(supportTask.id, task.id), eq(supportTask.status, "approved"))).returning()
  if (!claimed) throw new SupportTaskError("TASK_STATE_CHANGED")
  try {
    const issue = await githubRequest<{ number: number; html_url: string }>(token, `${repositoryPath(connection.owner, connection.repository)}/issues`, {
      method: "POST", body: JSON.stringify({ title: claimed.proposal.title, body: buildTaskIssue(claimed.id, claimed.proposal) }),
    })
    if (!Number.isInteger(issue.number) || !issue.html_url?.startsWith(`https://github.com/${repository}/issues/`)) throw new GitHubError("GITHUB_INVALID_RESPONSE", 502, true)
    const [updated] = await db.update(supportTask).set({ status: "published", githubIssueNumber: issue.number, githubIssueUrl: issue.html_url, updatedAt: new Date() })
      .where(and(eq(supportTask.id, task.id), eq(supportTask.status, "publishing"))).returning()
    if (!updated) throw new GitHubError("GITHUB_PUBLISH_UNCERTAIN", 502, true)
    return updated
  } catch (error) {
    const uncertain = !(error instanceof GitHubError) || error.uncertain
    const code = error instanceof GitHubError ? error.code : "GITHUB_PUBLISH_UNCERTAIN"
    await db.update(supportTask).set({ status: uncertain ? "publish_uncertain" : "approved", errorCode: code, updatedAt: new Date() })
      .where(and(eq(supportTask.id, task.id), eq(supportTask.status, "publishing")))
    throw new SupportTaskError(uncertain ? "GITHUB_PUBLISH_UNCERTAIN" : code, 502)
  }
}

export async function dispatchSupportTask(task: typeof supportTask.$inferSelect, businessId: string) {
  const connection = await getGitHubConnection(businessId)
  if (!connection?.codexWorkflow) throw new SupportTaskError("CODEX_NOT_CONFIGURED")
  if (task.status !== "published" || !task.githubIssueNumber) throw new SupportTaskError("TASK_NOT_PUBLISHED")
  if (task.githubRepository !== `${connection.owner}/${connection.repository}`) throw new SupportTaskError("TASK_REPOSITORY_CHANGED")
  const token = await githubToken(connection)
  const [claimed] = await db.update(supportTask).set({ codexStatus: "dispatching", codexDispatchedAt: new Date(), errorCode: null, updatedAt: new Date() })
    .where(and(eq(supportTask.id, task.id), eq(supportTask.status, "published"),
      // A lost worker or uncertain provider response must not dispatch twice.
      inArray(supportTask.codexStatus, ["not_requested", "failed"]))).returning()
  if (!claimed) throw new SupportTaskError("CODEX_ALREADY_REQUESTED")
  try {
    await githubRequest(token, `${repositoryPath(connection.owner, connection.repository)}/actions/workflows/${encodeURIComponent(connection.codexWorkflow)}/dispatches`, {
      method: "POST", body: JSON.stringify({ ref: connection.defaultBranch, inputs: { issue_number: String(task.githubIssueNumber) } }),
    })
    const [updated] = await db.update(supportTask).set({ codexStatus: "dispatched", updatedAt: new Date() }).where(eq(supportTask.id, task.id)).returning()
    return updated
  } catch (error) {
    const uncertain = !(error instanceof GitHubError) || error.uncertain
    await db.update(supportTask).set({ codexStatus: uncertain ? "dispatch_uncertain" : "failed",
      errorCode: uncertain ? "CODEX_DISPATCH_UNCERTAIN" : "CODEX_DISPATCH_FAILED", updatedAt: new Date(),
    }).where(eq(supportTask.id, task.id))
    throw new SupportTaskError(uncertain ? "CODEX_DISPATCH_UNCERTAIN" : "CODEX_DISPATCH_FAILED", 502)
  }
}
