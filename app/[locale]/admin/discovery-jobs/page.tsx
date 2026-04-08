"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import {
  MapPin,
  Tag,
  Radar,
  CheckCircle2,
  ChevronRight,
  Loader2,
  XCircle,
} from "lucide-react"
import { MobileMenuButton } from "@/components/admin-shell"
import { Link } from "@/i18n/routing"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

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
    fetchJobs().then(() => setLoading(false))
  }, [])

  // Poll every 3s when there are running/queued jobs
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "running" || j.status === "queued")

    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(() => {
        fetchJobs()
      }, 3000)
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

  function parseKeywords(json: string): string[] {
    try {
      return JSON.parse(json)
    } catch {
      return []
    }
  }

  function formatDate(dateStr: string): string {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Page header */}
      <div className="relative">
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-20%",
            left: "30%",
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative px-8 pt-10 pb-8 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <MobileMenuButton />
          </div>

              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-zinc-400 text-sm">{t("discovery")}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                  <h1
                    className="text-3xl md:text-4xl text-white mb-3"
                    style={{
                      letterSpacing: "-0.0325em",
                      fontWeight: 500,
                      lineHeight: 1.1,
                    }}
                  >
                    {t("discoveryJobsTitle")}
                  </h1>
                  <p className="text-zinc-400 max-w-lg leading-relaxed">
                    {t("discoveryJobsDesc")}
                  </p>
                </div>

                <Link
                  href="/admin/discovery-jobs/new"
                  className="shrink-0 px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm flex items-center gap-2"
                >
                  {t("createJob")}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="px-8 pb-10 max-w-[1400px] mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-3 mb-10">
              <div className="border-t border-b border-r border-zinc-800/60 py-6 pr-6">
                <div className="flex items-center gap-2 mb-3">
                  <Radar className="w-4 h-4 text-blue-400" />
                  <p className="text-zinc-500 text-sm">{t("activeJobs")}</p>
                </div>
                <p className="text-4xl text-white tabular-nums" style={{ fontWeight: 500 }}>
                  {activeCount}
                </p>
                <p className="text-zinc-600 text-sm mt-1">
                  {activeCount} running
                </p>
              </div>
              <div className="border-t border-b border-r border-zinc-800/60 py-6 px-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-zinc-500 text-sm">{t("completedJobs")}</p>
                </div>
                <p className="text-4xl text-white tabular-nums" style={{ fontWeight: 500 }}>
                  {completedCount}
                </p>
                <p className="text-zinc-600 text-sm mt-1">
                  <span className="text-emerald-400">+{completedCount}</span> total
                </p>
              </div>
              <div className="border-t border-b border-zinc-800/60 py-6 pl-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-zinc-500" />
                  <p className="text-zinc-500 text-sm">{t("leadsFound")}</p>
                </div>
                <p className="text-4xl text-white tabular-nums" style={{ fontWeight: 500 }}>
                  {totalLeads}
                </p>
                <p className="text-zinc-600 text-sm mt-1">
                  Avg {Math.round(totalLeads / Math.max(jobs.length, 1))} per job
                </p>
              </div>
            </div>

            {/* Jobs list */}
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Radar className="w-8 h-8 text-zinc-700 mb-4" />
                  <p className="text-zinc-400 text-sm mb-2">{t("noJobsYet")}</p>
                  <p className="text-zinc-600 text-sm">{t("noJobsDesc")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const keywords = parseKeywords(job.keywords)
                    const isActive = job.status === "running" || job.status === "queued"

                    return (
                      <Link
                        key={job.id}
                        href={`/admin/discovery-jobs/${job.id}`}
                        className={`block rounded-xl border transition-all duration-200 group ${
                          isActive
                            ? "border-blue-500/20 bg-blue-500/[0.03] hover:border-blue-500/30"
                            : "border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-700/60 hover:bg-zinc-900/40"
                        }`}
                      >
                        {/* Running shimmer bar */}
                        {job.status === "running" && (
                          <div className="h-0.5 bg-zinc-800 rounded-t-xl overflow-hidden">
                            <div className="h-full w-1/3 bg-blue-500/60 rounded-full" style={{ animation: "shimmer 1.5s ease-in-out infinite" }} />
                          </div>
                        )}

                        <div className="px-5 py-4">
                          {/* Top row: name + status badge + actions */}
                          <div className="flex items-start justify-between gap-4 mb-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <h3 className="text-zinc-200 text-sm font-medium truncate group-hover:text-white transition-colors">
                                {job.name}
                              </h3>
                              {/* Status badge */}
                              {isActive ? (
                                <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                                  </span>
                                  {job.status === "queued" ? "Queued" : "Running"}
                                </span>
                              ) : (
                                <span
                                  className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                    job.status === "completed"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : job.status === "failed"
                                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                                        : "bg-zinc-800/50 text-zinc-500 border-zinc-700/30"
                                  }`}
                                >
                                  {job.status === "completed"
                                    ? t("jobCompleted")
                                    : job.status === "failed"
                                      ? t("jobFailed")
                                      : job.status === "cancelled"
                                        ? "Cancelled"
                                        : job.status}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-zinc-600 text-xs tabular-nums">{formatDate(job.createdAt)}</span>
                              {isActive ? (
                                <button
                                  onClick={(e) => handleCancel(job.id, e)}
                                  className="p-1 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Cancel job"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-500 transition-colors" />
                              )}
                            </div>
                          </div>

                          {/* Bottom row: location + keywords + leads count */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex items-center gap-1.5 text-zinc-500 text-xs shrink-0">
                                <MapPin className="w-3 h-3 text-zinc-600" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                {keywords.slice(0, 3).map((kw) => (
                                  <span key={kw} className="text-[11px] text-zinc-600 bg-zinc-800/40 px-1.5 py-0.5 rounded shrink-0">
                                    {kw}
                                  </span>
                                ))}
                                {keywords.length > 3 && (
                                  <span className="text-[11px] text-zinc-700 shrink-0">+{keywords.length - 3}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Tag className="w-3 h-3 text-zinc-600" />
                              <span className="text-zinc-400 text-xs tabular-nums font-medium">{job.insertedLeads}</span>
                              <span className="text-zinc-600 text-xs">leads</span>
                            </div>
                          </div>

                          {/* Running info */}
                          {job.status === "running" && job.currentQuery && (
                            <div className="mt-2.5 pt-2.5 border-t border-zinc-800/30">
                              <span className="text-zinc-600 text-[11px]">Searching: </span>
                              <span className="text-blue-400/70 text-[11px]">{job.currentQuery}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
      </div>
    </div>
  )
}
