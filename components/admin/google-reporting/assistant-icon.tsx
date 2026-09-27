import Image from "next/image"
import { Bot } from "lucide-react"

export function AssistantIcon({ name }: { name: string }) {
  const assistant = /\bcodex\b/i.test(name)
    ? "codex"
    : /\bclaude[\s_-]*code\b/i.test(name)
      ? "claude-code"
      : null

  if (!assistant) {
    return (
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-400"
      >
        <Bot className="size-5" />
      </span>
    )
  }

  return (
    <Image
      src={`/images/integrations/${assistant}.png`}
      alt=""
      width={32}
      height={32}
      unoptimized
      className={`size-8 shrink-0 rounded-lg object-contain ${assistant === "codex" ? "bg-black" : ""}`}
    />
  )
}
