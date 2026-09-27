import Image from "next/image"
import { Bot } from "lucide-react"
import type { ReportingIntegration } from "@/lib/google-reporting/paths"

export function ReportingIcon({
  integration,
  className = "size-12",
}: {
  integration: ReportingIntegration
  className?: string
}) {
  if (integration === "assistants") {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400 ${className}`}
      >
        <Bot className="size-6" />
      </span>
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl bg-zinc-100 ring-1 ring-inset ring-black/[0.06] dark:bg-white/[0.06] dark:ring-white/[0.08] ${className}`}
    >
      <Image
        src={`/images/integrations/${integration === "ga4" ? "google-analytics.svg" : "google-search-console.png"}`}
        alt=""
        width={28}
        height={28}
        unoptimized
        className="size-7 object-contain"
      />
    </span>
  )
}
