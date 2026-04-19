"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { MapPin, Tag, Radar, ChevronRight, XCircle } from "lucide-react"
import { Link } from "@/i18n/routing"
import { toast } from "sonner"
import {
  PageHeader,
  ContentWrapper,
  StatCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  StatNumber,
} from "@/components/admin"
import { formatRelativeDate, parseKeywords } from "@/lib/admin-utils"
import { useActiveBusiness } from "@/components/admin/active-business-context"

interface DiscoveryJob {
  id: string
  name: string
  location: string
  keywords: string
  maxResults: number
  status: string
  insertedLeads: number
  totalFound: number
  completedQueries: number
  currentQuery: string | null
  createdAt: string
}

export default function DiscoveryJobsPage() {
  const t = useTranslations("dashboard")
  const { activeBusinessId } = useActiveBusiness()
  const [jobs, setJobs] = useState<DiscoveryJob[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchJobs() {
    try {
      const res = await fetch("/api/discovery/jobs")
      if (res.ok) {
        const data = await res.json()
        setJobs(data)
        return data as DiscoveryJob[]
      }
    } catch {
      // Failed to fetch jobs
    }
    return null
  }

  useEffect(() => {
    setLoading(true)
    setJobs([])
    fetchJobs().then(() => setLoading(false))
    // Refetching whenever active business changes keeps this list scoped to
    // the currently selected business. fetchJobs is stable by definition.
  }, [activeBusinessId])

  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "running" || j.status === "queued")
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(() => fetchJobs(), 3000)
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [jobs])

  const activeCount = jobs.filter((j) => j.status === "running").length
  const completedCount = jobs.filter((j) => j.status === "completed").length
  const totalLeads = jobs.reduce((sum, j) => sum + j.insertedLeads, 0)

  async function handleCancel(jobId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/discovery/jobs/${jobId}/cancel`, { method: "POST" })
      if (res.ok) {
        toast.success("Job cancelled")
        fetchJobs()
      }
    } catch {
      toast.error("Failed to cancel job")
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <ContentWrapper>
        <PageHeader
          variant="hero"
          title={t("discoveryJobsTitle")}
          description={t("discoveryJobsDesc")}
          breadcrumbs={[{ label: t("discovery") }]}
          actions={
            <Link
              href="/admin/discovery-jobs/new"
              className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm flex items-center gap-2"
            >
              {t("createJob")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label={t("activeJobs")}
            value={activeCount}
            icon={Radar}
            sub={`${activeCount} running`}
            accent={activeCount > 0 ? "amber" : "zinc"}
          />
          <StatCard
            label={t("completedJobs")}
            value={completedCount}
            icon={Radar}
            sub={`${completedCount} total`}
            accent="sky"
          />
          <StatCard
            label={t("leadsFound")}
            value={totalLeads}
            icon={Tag}
            sub={`Avg ${Math.round(totalLeads / Math.max(jobs.length, 1))} per job`}
            accent="emerald"
          />
        </div>

        {/* Jobs list */}
        {loading ? (
          <LoadingState />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Radar}
            title={t("noJobsYet")}
            description={t("noJobsDesc")}
          />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const kws = parseKeywords(job.keywords)
              const isActive = job.status === "running" || job.status === "queued"
              const isRunning = job.status === "running"

              return (
                <Link
                  key={job.id}
                  href={`/admin/discovery-jobs/${job.id}`}
                  className={`block rounded-xl border transition-all duration-200 group ${
                    isActive
                      ? "border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.05] via-emerald-500/[0.02] to-transparent hover:border-emerald-500/40 shadow-[0_0_24px_-12px_rgba(16,185,129,0.4)]"
                      : "border-zinc-800/60 hover:border-zinc-700/60 hover:bg-zinc-900/40"
                  }`}
                >
                  {isRunning && (
                    <div className="h-0.5 bg-zinc-800/50 rounded-t-xl overflow-hidden">
                      <div
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"
                        style={{ animation: "shimmer 1.8s ease-in-out infinite" }}
                      />
                    </div>
                  )}

                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4 mb-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <h3 className={`text-sm font-medium truncate transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-zinc-200 group-hover:text-white"
                        }`}>
                          {job.name}
                        </h3>
                        <StatusBadge status={job.status} />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatNumber
                          value={formatRelativeDate(job.createdAt)}
                          className="text-zinc-600 text-xs"
                        />
                        {isActive ? (
                          <button
                            onClick={(e) => handleCancel(job.id, e)}
                            className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Cancel job"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs shrink-0">
                          <MapPin className="w-3 h-3 text-zinc-600" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {kws.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="text-[11px] text-zinc-500 bg-zinc-800/50 border border-zinc-800/80 px-1.5 py-0.5 rounded shrink-0"
                            >
                              {kw}
                            </span>
                          ))}
                          {kws.length > 3 && (
                            <StatNumber
                              value={`+${kws.length - 3}`}
                              className="text-[11px] text-zinc-600 shrink-0"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Tag className="w-3 h-3 text-zinc-600" />
                        <StatNumber
                          value={job.insertedLeads}
                          className="text-zinc-300 text-xs font-semibold"
                        />
                        <span className="text-zinc-600 text-xs">leads</span>
                      </div>
                    </div>

                    {isRunning && job.currentQuery && (
                      <div className="mt-2.5 pt-2.5 border-t border-emerald-500/10">
                        <span className="text-zinc-600 text-[11px]">Searching: </span>
                        <span className="text-emerald-400/80 text-[11px]">{job.currentQuery}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </ContentWrapper>
    </div>
  )
}
