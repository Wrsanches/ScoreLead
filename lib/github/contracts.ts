import { z } from "zod"

export function parseGitHubRepository(value: string): { owner: string; repository: string } | null {
  const cleaned = value.trim().replace(/\/$/, "").replace(/\.git$/, "")
  const match = cleaned.match(/^(?:https:\/\/github\.com\/)?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9_.-]{1,100})$/)
  if (!match || [".", ".."].includes(match[2])) return null
  return { owner: match[1], repository: match[2] }
}

export const contextPathSchema = z.string().trim().min(1).max(200).refine(
  (path) => /\.(md|mdx|txt)$/i.test(path) && !path.startsWith("/") && !path.split("/").some((part) => !part || part === "." || part === ".." || part.startsWith(".")) && !/[\\?#%]/.test(path) && !Array.from(path).some((character) => character.charCodeAt(0) < 32),
  "Choose a Markdown or text document inside the repository",
)

export const githubSettingsSchema = z.object({
  repository: z.string().trim().refine((value) => !!parseGitHubRepository(value), "Invalid GitHub repository"),
  token: z.string().trim().min(1).max(500).optional(),
  contextPaths: z.array(contextPathSchema).max(10).refine((paths) => new Set(paths).size === paths.length),
  projectNotes: z.string().trim().max(12000).default(""),
  codexWorkflow: z.string().trim().max(100).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*\.(yml|yaml)$/).nullable().default(null),
  appSelection: z.object({ installationId: z.string().regex(/^\d+$/).max(20), repositoryId: z.string().regex(/^\d+$/).max(20) }).optional(),
  autoContext: z.boolean().default(false),
})

export type PublicGitHubConnection = {
  id: string
  repository: string
  repositoryUrl: string
  defaultBranch: string
  contextPaths: string[]
  projectNotes: string
  codexWorkflow: string | null
  contextSyncedAt: string
  contextFiles: { path: string; sha: string; characters: number }[]
  authType: "token" | "github_app"
  githubLogin: string | null
}

export type GitHubInstallationView = { id: string; login: string }
export type GitHubRepositoryView = { id: string; fullName: string; private: boolean; description: string | null; writable: boolean; archived: boolean }
