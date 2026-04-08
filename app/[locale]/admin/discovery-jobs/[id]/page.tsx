"use client"

import { useState, useEffect, use } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Radar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Globe,
  Mail,
  Phone,
  Star,
  Clock,
  ExternalLink,
} from "lucide-react"
import { MobileMenuButton } from "@/components/admin-shell"
import { formatDistanceToNow } from "date-fns"

interface Job {
  id: string
  name: string
  location: string
  keywords: string
  maxResults: number
  serviceArea: string
  status: string
  insertedLeads: number
  totalProcessed: number
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
  leadCount: number
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
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = use(params)
  const t = useTranslations("dashboard")
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [stats, setStats] = useState<JobStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/discovery/jobs/${id}`)
        if (res.ok) {
          setJob(await res.json())
        }
      } catch {
        // Failed to fetch job
      }
    }
    fetchJob()
  }, [id])

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const res = await fetch(`/api/discovery/jobs/${id}/stats`)
        if (res.ok) {
          setStats(await res.json())
        }
      } catch {
        // Failed to fetch stats
      }
      setLoading(false)
    }
    fetchStats()
  }, [id])

  const keywords = job ? (() => { try { return JSON.parse(job.keywords) } catch { return [] } })() : []

  return (
    <>
      {/* Top bar */}
      <div className="px-6 h-14 flex items-center justify-between border-b border-zinc-800/70 shrink-0">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <button
              onClick={() => router.push("/admin/discovery-jobs")}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t("discoveryJobsTitle")}</span>
            </button>
            <span className="text-zinc-700">/</span>
            <span className="text-white text-sm font-medium truncate max-w-[200px]">{job?.name || "..."}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto px-8 py-10">
            {!job ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Job header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    {job.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : job.status === "failed" ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : job.status === "cancelled" ? (
                      <AlertCircle className="w-5 h-5 text-zinc-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    )}
                    <span
                      className={`text-xs font-medium uppercase tracking-wider ${
                        job.status === "completed"
                          ? "text-emerald-400"
                          : job.status === "failed"
                            ? "text-red-400"
                            : job.status === "cancelled"
                              ? "text-zinc-500"
                              : "text-blue-400"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <h1
                    className="text-2xl md:text-3xl text-white mb-4"
                    style={{ letterSpacing: "-0.0325em", fontWeight: 500 }}
                  >
                    {job.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Radar className="w-3.5 h-3.5 text-zinc-600" />
                      {job.insertedLeads} leads found
                    </div>
                    <div className="text-zinc-600">
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {keywords.map((kw: string) => (
                        <span key={kw} className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-lg">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {job.errorMessage && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                      {job.errorMessage}
                    </div>
                  )}
                </div>

                {/* Progress */}
                {(job.status === "running" || job.status === "pending") && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-400 text-sm">Progress</span>
                      <span className="text-zinc-400 text-sm tabular-nums">
                        {job.totalProcessed} / {job.maxResults} processed
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${job.maxResults > 0 ? (job.totalProcessed / job.maxResults) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-zinc-400 text-sm">Statistics</span>
                    </div>
                    {stats && stats.totalLeads > 0 && (
                      <button
                        onClick={() => router.push(`/admin/leads?jobId=${id}`)}
                        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        View all leads
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                    </div>
                  ) : !stats || stats.totalLeads === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                      <p className="text-sm">No leads found yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Key metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border border-zinc-800/60 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-zinc-600" />
                            <span className="text-xs text-zinc-500">Total Leads</span>
                          </div>
                          <p className="text-2xl text-white font-medium tabular-nums">{stats.totalLeads}</p>
                        </div>
                        <div className="border border-zinc-800/60 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-zinc-600" />
                            <span className="text-xs text-zinc-500">Avg Score</span>
                          </div>
                          <p className="text-2xl text-white font-medium tabular-nums">{stats.avgScore.toFixed(1)}</p>
                        </div>
                        <div className="border border-zinc-800/60 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Radar className="w-4 h-4 text-zinc-600" />
                            <span className="text-xs text-zinc-500">Enriched</span>
                          </div>
                          <p className="text-2xl text-white font-medium tabular-nums">{stats.enrichedCount}</p>
                        </div>
                        {stats.avgGoogleRating != null && (
                          <div className="border border-zinc-800/60 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="w-4 h-4 text-zinc-600" />
                              <span className="text-xs text-zinc-500">Avg Google Rating</span>
                            </div>
                            <p className="text-2xl text-white font-medium tabular-nums">{stats.avgGoogleRating.toFixed(1)}</p>
                          </div>
                        )}
                      </div>

                      {/* Score distribution */}
                      <div className="border border-zinc-800/60 rounded-xl p-5">
                        <span className="text-xs text-zinc-500">Score Distribution</span>
                        <div className="flex items-end gap-4 mt-4">
                          {[
                            { label: "High (4+)", count: stats.scoreDistribution.high, color: "bg-emerald-500" },
                            { label: "Medium (3-4)", count: stats.scoreDistribution.medium, color: "bg-amber-500" },
                            { label: "Low (<3)", count: stats.scoreDistribution.low, color: "bg-red-500" },
                          ].map(({ label, count, color }) => {
                            const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                            return (
                              <div key={label} className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs text-zinc-400">{label}</span>
                                  <span className="text-xs text-zinc-500 tabular-nums">{count}</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${color} rounded-full`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Contact & Sources */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contact availability */}
                        <div className="border border-zinc-800/60 rounded-xl p-5">
                          <span className="text-xs text-zinc-500">Contact Availability</span>
                          <div className="mt-4 space-y-3">
                            {[
                              { label: "Website", count: stats.withWebsite, icon: Globe },
                              { label: "Email", count: stats.withEmail, icon: Mail },
                              { label: "Phone", count: stats.withPhone, icon: Phone },
                            ].map(({ label, count, icon: Icon }) => {
                              const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                              return (
                                <div key={label} className="flex items-center gap-3">
                                  <Icon className="w-4 h-4 text-zinc-600 shrink-0" />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-zinc-400">{label}</span>
                                      <span className="text-xs text-zinc-500 tabular-nums">{count} ({pct.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Sources */}
                        <div className="border border-zinc-800/60 rounded-xl p-5">
                          <span className="text-xs text-zinc-500">Sources</span>
                          <div className="mt-4 space-y-3">
                            {Object.entries(stats.sourceBreakdown).map(([source, count]) => {
                              const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                              const label = source === "google_places"
                                ? "Google Places"
                                : source === "brave_search"
                                  ? "Brave Search"
                                  : source
                              return (
                                <div key={source}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-zinc-400">{label}</span>
                                    <span className="text-xs text-zinc-500 tabular-nums">{count} ({pct.toFixed(0)}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Duration */}
                      {job.completedAt && (
                        <div className="border border-zinc-800/60 rounded-xl p-5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-600" />
                            <span className="text-xs text-zinc-500">Duration</span>
                          </div>
                          <p className="text-sm text-zinc-300 mt-2">
                            {(() => {
                              const ms = new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()
                              const seconds = Math.floor(ms / 1000)
                              const minutes = Math.floor(seconds / 60)
                              if (minutes > 0) return `${minutes}m ${seconds % 60}s`
                              return `${seconds}s`
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
    </>
  )
}

