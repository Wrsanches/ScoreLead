"use client"

import { useState, useEffect, use } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { MapPin, Radar, Globe, Mail, Phone, Clock, ExternalLink, Users, Star, Plus, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import {
  PageHeader,
  ContentWrapper,
  SectionCard,
  StatCard,
  StatusBadge,
  LoadingState,
} from "@/components/admin"
import { usePlan } from "@/components/admin/plan-context"
import { formatRelativeDate, parseKeywords } from "@/lib/admin-utils"
import { DiscoveryRunningPanel } from "@/components/admin/discovery-running-panel"

interface Job {
  id: string
  name: string
  location: string
  keywords: string
  maxResults: number
  serviceArea: string
  status: string
  insertedLeads: number
  totalFound: number
  duplicateLeads: number
  completedQueries: number
  currentQuery: string | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
  leadCount: number
  runs: number
  exhausted: boolean
}

interface JobStats {
  totalLeads: number
  avgScore: number
  withWebsite: number
  withEmail: number
  withPhone: number
  avgGoogleRating: number | null
  enrichedCount: number
  sourceBreakdown: Record<string, number>
  scoreDistribution: { high: number; medium: number; low: number }
}

export default function DiscoveryJobDetailPage({
  params,
}: {
  params: Promise<{ businessId: string; jobId: string; locale: string }>
}) {
  const { businessId, jobId: id } = use(params)
  const t = useTranslations("dashboard")
  const router = useRouter()
  const { openUpgrade } = usePlan()
  const [job, setJob] = useState<Job | null>(null)
  const [stats, setStats] = useState<JobStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [continuing, setContinuing] = useState(false)
  // Bumped after a Continue to restart polling (the poll stops at terminal states).
  const [pollKey, setPollKey] = useState(0)

  async function handleContinue() {
    if (continuing) return
    setContinuing(true)
    try {
      const res = await fetch(`/api/discovery/jobs/${id}/continue`, { method: "POST" })
      if (res.ok) {
        toast.success("Finding more leads...")
        // Optimistically flip to queued so the poll re-activates.
        setJob((j) => (j ? { ...j, status: "queued" } : j))
        setPollKey((k) => k + 1)
      } else if (res.status === 402) {
        openUpgrade()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Could not continue this job")
      }
    } catch {
      toast.error("Could not continue this job")
    } finally {
      setContinuing(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null

    const stop = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    async function load() {
      const [j, s] = await Promise.all([
        fetch(`/api/discovery/jobs/${id}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/discovery/jobs/${id}/stats`).then((r) => (r.ok ? r.json() : null)),
      ]).catch(() => [null, null])
      if (cancelled) return
      if (j) setJob(j)
      if (s) setStats(s)
      setLoading(false)
      // Keep polling only while the job is still working.
      if (!j || (j.status !== "running" && j.status !== "queued" && j.status !== "pending")) {
        stop()
      }
    }

    load()
    interval = setInterval(load, 2500)
    return () => {
      cancelled = true
      stop()
    }
  }, [id, pollKey])

  const keywords = job ? parseKeywords(job.keywords) : []

  return (
    <>
      <PageHeader
        title={job?.name || "..."}
        backHref={`/admin/business/${businessId}/discovery-jobs`}
        breadcrumbs={[{ label: t("discoveryJobsTitle") }]}
      />

      <div className="flex-1 overflow-auto">
        <ContentWrapper>
          {!job ? (
            <LoadingState />
          ) : (
            <>
              {/* Job header */}
              <div className="mb-8">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={job.status} />
                    {job.runs > 0 && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-600">
                        Run {job.runs + 1}
                      </span>
                    )}
                  </div>
                  {(job.status === "partial" ||
                    (job.status === "completed" && !job.exhausted)) && (
                    <button
                      onClick={handleContinue}
                      disabled={continuing}
                      className="flex items-center gap-2 h-9 px-4 text-sm font-medium bg-emerald-500 text-zinc-950 rounded-lg hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                    >
                      {continuing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Find more leads
                    </button>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl text-zinc-900 dark:text-white font-medium tracking-tight mb-4">
                  {job.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Radar className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600" />
                    {job.insertedLeads} leads found
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-600">
                    {formatRelativeDate(job.createdAt)}
                  </div>
                </div>

                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {keywords.map((kw: string) => (
                      <span key={kw} className="text-xs text-zinc-500 bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-1 rounded-lg">{kw}</span>
                    ))}
                  </div>
                )}

                {job.errorMessage && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                    {job.errorMessage}
                  </div>
                )}

                {job.exhausted && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-zinc-500" />
                    No more new leads to find in this area.
                  </div>
                )}
              </div>

              {/* Live progress while the job is working */}
              {(job.status === "running" ||
                job.status === "queued" ||
                job.status === "pending") && <DiscoveryRunningPanel job={job} />}

              {/* Stats */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Statistics</p>
                  {stats && stats.totalLeads > 0 && (
                    <button
                      onClick={() => router.push(`/admin/business/${businessId}/leads?jobId=${id}`)}
                      className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      View all leads
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {loading ? (
                  <LoadingState />
                ) : !stats || stats.totalLeads === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <p className="text-sm">No leads found yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Key metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard label="Total Leads" value={stats.totalLeads} icon={Users} />
                      <StatCard label="Avg Score" value={stats.avgScore.toFixed(1)} icon={Star} />
                      <StatCard label="Enriched" value={stats.enrichedCount} icon={Radar} />
                      {stats.avgGoogleRating != null && (
                        <StatCard label="Avg Google Rating" value={stats.avgGoogleRating.toFixed(1)} icon={Star} />
                      )}
                    </div>

                    {/* Score distribution */}
                    <SectionCard title="Score Distribution">
                      <div className="flex items-end gap-4">
                        {[
                          { label: "High (4+)", count: stats.scoreDistribution.high, color: "bg-emerald-500" },
                          { label: "Medium (3-4)", count: stats.scoreDistribution.medium, color: "bg-amber-500" },
                          { label: "Low (<3)", count: stats.scoreDistribution.low, color: "bg-red-500" },
                        ].map(({ label, count, color }) => {
                          const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                          return (
                            <div key={label} className="flex-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
                                <span className="text-xs text-zinc-500 tabular-nums">{count}</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </SectionCard>

                    {/* Contact & Sources */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SectionCard title="Contact Availability">
                        <div className="space-y-3">
                          {[
                            { label: "Website", count: stats.withWebsite, icon: Globe },
                            { label: "Email", count: stats.withEmail, icon: Mail },
                            { label: "Phone", count: stats.withPhone, icon: Phone },
                          ].map(({ label, count, icon: Icon }) => {
                            const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                            return (
                              <div key={label} className="flex items-center gap-3">
                                <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-600 shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
                                    <span className="text-xs text-zinc-500 tabular-nums">{count} ({pct.toFixed(0)}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </SectionCard>

                      <SectionCard title="Sources">
                        <div className="space-y-3">
                          {Object.entries(stats.sourceBreakdown).map(([source, count]) => {
                            const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                            const label = source === "google_places" ? "Google Places" : source === "brave_search" ? "Brave Search" : source
                            return (
                              <div key={source}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
                                  <span className="text-xs text-zinc-500 tabular-nums">{count} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </SectionCard>
                    </div>

                    {/* Duration */}
                    {job.completedAt && (
                      <SectionCard title="Duration">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-600" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {(() => {
                              const ms = new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()
                              const seconds = Math.floor(ms / 1000)
                              const minutes = Math.floor(seconds / 60)
                              if (minutes > 0) return `${minutes}m ${seconds % 60}s`
                              return `${seconds}s`
                            })()}
                          </span>
                        </div>
                      </SectionCard>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </ContentWrapper>
      </div>
    </>
  )
}
