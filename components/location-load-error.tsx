"use client"

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react"

export function LocationLoadError({
  message,
  retryLabel,
  retrying,
  onRetry,
}: {
  message: string
  retryLabel: string
  retrying: boolean
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
        />
        <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-600/30 bg-white/70 px-4 text-sm font-medium text-amber-900 transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60 dark:border-amber-400/25 dark:bg-zinc-950/40 dark:text-amber-100 dark:hover:bg-zinc-950/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
      >
        {retrying ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
        )}
        {retryLabel}
      </button>
    </div>
  )
}
