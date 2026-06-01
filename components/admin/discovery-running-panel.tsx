"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search } from "lucide-react"
import { AiOrb } from "@/components/ai-orb"

interface RunningJob {
  status: string
  maxResults: number
  insertedLeads: number
  totalFound: number
  duplicateLeads: number
  completedQueries: number
  currentQuery: string | null
}

/** A single live-updating counter that rolls when its value changes. */
function LiveStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="h-7 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="block text-xl font-semibold text-zinc-900 dark:text-white tabular-nums"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
    </div>
  )
}

export function DiscoveryRunningPanel({ job }: { job: RunningJob }) {
  const queued = job.status === "queued" || job.status === "pending"
  const target = job.maxResults || 0
  const pct = target > 0 ? Math.min(100, Math.round((job.insertedLeads / target) * 100)) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mb-8 overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.07] via-emerald-500/[0.02] to-transparent p-6 shadow-[0_0_60px_-24px_rgba(16,185,129,0.5)]"
    >
      {/* sweeping sheen across the panel while running */}
      {!queued && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-emerald-400/[0.07] to-transparent"
          animate={{ left: ["-50%", "150%"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative flex items-center gap-5">
        <AiOrb state={queued ? "active" : "processing"} size="md" className="shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
              {queued ? "Queued, starting soon" : "Discovering leads"}
            </h2>
          </div>

          {/* live current-query ticker */}
          <div className="mt-1.5 flex h-5 items-center gap-1.5 text-sm">
            <Search className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={job.currentQuery || "idle"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="truncate text-emerald-600/90 dark:text-emerald-400/90"
              >
                {job.currentQuery || "Preparing search..."}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* progress toward the target lead count */}
      <div className="relative mt-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
          <span>Leads added</span>
          <span className="tabular-nums">
            {job.insertedLeads}
            {target ? ` / ${target}` : ""}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* live counters */}
      <div className="relative mt-6 grid grid-cols-4 gap-4">
        <LiveStat label="Found" value={job.totalFound} />
        <LiveStat label="Added" value={job.insertedLeads} />
        <LiveStat label="Duplicates" value={job.duplicateLeads} />
        <LiveStat label="Queries" value={job.completedQueries} />
      </div>
    </motion.div>
  )
}
