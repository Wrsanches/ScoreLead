import { z } from "zod"

export const repositoryName = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,99}$/)
export const supportSettingsInput = z
  .object({
    version: z.number().int().nonnegative(),
    enabled: z.boolean(),
    instructions: z.string().trim().max(6000),
    handoffMessage: z.string().trim().min(1).max(1000),
    includePaths: z.array(z.string().trim().min(1).max(250)).min(1).max(20),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.includePaths.some(
        (path) =>
          path.startsWith("/") ||
          path.includes("..") ||
          /[\\*?]/.test(path) ||
          Array.from(path).some((character) => character.charCodeAt(0) < 32),
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["includePaths"],
        message:
          "Use repository-relative file or folder paths without wildcards.",
      })
    }
  })

const DENIED_PARTS =
  /^(?:\..*|node_modules|vendor|dist|build|coverage|fixtures?|__tests__|tests?|secrets?|credentials?|private|backups?)$/i
const DENIED_FILES =
  /(?:^|[._-])(?:secrets?|credentials?|tokens?|passwords?|private[._-]?key)(?:[._-]|$)|(?:lock|\.min\.js|\.map)$/i
const EXTENSIONS =
  /\.(?:md|mdx|txt|rst|ts|tsx|js|jsx|py|go|rs|java|rb|php|swift|kt|vue|svelte|html|css)$/i

export function allowedKnowledgePath(
  path: string,
  includePaths: string[],
): boolean {
  const parts = path.split("/")
  if (parts.some((part) => !part || part === ".." || DENIED_PARTS.test(part)))
    return false
  if (!EXTENSIONS.test(path) || DENIED_FILES.test(parts.at(-1)!)) return false
  if (/^(AGENTS|CLAUDE|SKILL)\.md$/i.test(parts.at(-1)!)) return false
  return includePaths.some((prefix) =>
    prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix,
  )
}

// Reject a source file rather than send obvious embedded credentials for indexing.
export function hasSensitiveContent(text: string): boolean {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16})\b|(?:api[_-]?key|password|secret|access[_-]?token)\s*[:=]\s*["'][^"'\s]{12,}["']/i.test(
    text,
  )
}

export function withinServiceWindow(
  receivedAt: Date,
  now = new Date(),
): boolean {
  const age = now.getTime() - receivedAt.getTime()
  return age >= 0 && age < 24 * 60 * 60 * 1000 - 60_000
}

export const answerInput = z
  .object({ question: z.string().trim().min(1).max(4000) })
  .strict()
export const answerResult = z
  .object({ reply: z.string().trim().min(1).max(3500), handoff: z.boolean() })
  .strict()
