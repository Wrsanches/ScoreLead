"use client"

import { useState, useEffect, use } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { MapPin, Radar, Globe, Mail, Phone, Clock, ExternalLink, Users, Star } from "lucide-react"
import {
  PageHeader,
  ContentWrapper,
  SectionCard,
  StatCard,
  StatusBadge,
  LoadingState,
} from "@/components/admin"
import { formatRelativeDate, parseKeywords } from "@/lib/admin-utils"

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
    fetch(`/api/discovery/jobs/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setJob)
      .catch(() => {})
  }, [id])

  useEffect(() => {
    fetch(`/api/discovery/jobs/${id}/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const keywords = job ? parseKeywords(job.keywords) : []

  return (
    <>
      <PageHeader
        title={job?.name || "..."}
        backHref="/admin/discovery-jobs"
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
                <div className="flex items-center gap-3 mb-3">
                  <StatusBadge status={job.status} />
                </div>

                <h1 className="text-2xl md:text-3xl text-white font-medium tracking-tight mb-4">
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
                    {formatRelativeDate(job.createdAt)}
                  </div>
                </div>

                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {keywords.map((kw: string) => (
                      <span key={kw} className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-lg">{kw}</span>
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
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Statistics</p>
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
                                <span className="text-xs text-zinc-400">{label}</span>
                                <span className="text-xs text-zinc-500 tabular-nums">{count}</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
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
                      </SectionCard>

                      <SectionCard title="Sources">
                        <div className="space-y-3">
                          {Object.entries(stats.sourceBreakdown).map(([source, count]) => {
                            const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0
                            const label = source === "google_places" ? "Google Places" : source === "brave_search" ? "Brave Search" : source
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
                      </SectionCard>
                    </div>

                    {/* Duration */}
                    {job.completedAt && (
                      <SectionCard title="Duration">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-600" />
                          <span className="text-sm text-zinc-300">
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
