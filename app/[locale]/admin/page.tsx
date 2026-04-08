"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import {
  Users,
  Radar,
  TrendingUp,
  Globe,
  Mail,
  Phone,
  Star,
  ArrowRight,
} from "lucide-react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  PageHeader,
  ContentWrapper,
  SectionCard,
  StatCard,
  ScoreBadge,
  StatusIcon,
  LoadingState,
  EmptyState,
} from "@/components/admin"
import { formatRelativeDate, getInitials } from "@/lib/admin-utils"

interface DashboardStats {
  jobs: { total: number; completed: number; running: number; failed: number }
  leads: {
    total: number; avgScore: number; avgRating: number | null
    highScore: number; withWebsite: number; withEmail: number; withPhone: number; enriched: number
  }
  charts: {
    scoreDistribution: { bucket: string; count: number }[]
    sourceBreakdown: { source: string; count: number }[]
    leadsOverTime: { date: string; count: number }[]
  }
  recentLeads: {
    id: string; name: string | null; score: number
    city: string | null; country: string | null
    photoUrl: string | null; createdAt: string
  }[]
  recentJobs: {
    id: string; name: string; status: string
    insertedLeads: number; createdAt: string
  }[]
}

const chartConfig = {
  count: { label: "Leads", color: "var(--color-emerald-500)" },
} satisfies ChartConfig

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function AdminPage() {
  const t = useTranslations("dashboard")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader title={t("dashboard")} />

      <ContentWrapper>
        {loading ? (
          <LoadingState />
        ) : !stats ? (
          <EmptyState title="Failed to load dashboard data." />
        ) : (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={t("leads")}
                value={stats.leads.total}
                icon={Users}
                sub={`${stats.leads.highScore} high score`}
                href="/admin/leads"
              />
              <StatCard
                label={t("score")}
                value={stats.leads.avgScore.toFixed(1)}
                icon={Star}
                sub="avg across all leads"
              />
              <StatCard
                label={t("discoveryJobs")}
                value={stats.jobs.total}
                icon={Radar}
                sub={`${stats.jobs.completed} completed`}
                href="/admin/discovery-jobs"
              />
              <StatCard
                label="Enriched"
                value={stats.leads.enriched}
                icon={TrendingUp}
                sub={stats.leads.total > 0 ? `${Math.round((stats.leads.enriched / stats.leads.total) * 100)}% of leads` : "0%"}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Leads - Last 7 days">
                {stats.charts.leadsOverTime.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <AreaChart data={stats.charts.leadsOverTime} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#areaGrad)" />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
                )}
              </SectionCard>

              <SectionCard title="Score Distribution">
                {stats.charts.scoreDistribution.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <BarChart data={stats.charts.scoreDistribution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stats.charts.scoreDistribution.map((entry, i) => {
                          const score = parseFloat(entry.bucket)
                          const color = score >= 4 ? "#10b981" : score >= 3 ? "#f59e0b" : "#ef4444"
                          return <Cell key={i} fill={color} fillOpacity={0.8} />
                        })}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
                )}
              </SectionCard>
            </div>

            {/* Source + Contact + Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SectionCard title="Sources">
                {stats.charts.sourceBreakdown.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ChartContainer config={{ count: { label: "Leads" } }} className="h-[140px] w-[140px] shrink-0">
                      <PieChart>
                        <Pie data={stats.charts.sourceBreakdown} dataKey="count" nameKey="source" innerRadius={40} outerRadius={65} strokeWidth={0}>
                          {stats.charts.sourceBreakdown.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.85} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-2.5">
                      {stats.charts.sourceBreakdown.map((s, i) => (
                        <div key={s.source} className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-sm text-zinc-400">{s.source}</span>
                          <span className="text-sm text-zinc-500 tabular-nums ml-auto">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[140px] flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
                )}
              </SectionCard>

              <SectionCard title="Contact Availability">
                <div className="space-y-4">
                  {([
                    { label: "Website", count: stats.leads.withWebsite, icon: Globe },
                    { label: "Email", count: stats.leads.withEmail, icon: Mail },
                    { label: "Phone", count: stats.leads.withPhone, icon: Phone },
                  ] as const).map(({ label, count, icon: Icon }) => {
                    const pct = stats.leads.total > 0 ? (count / stats.leads.total) * 100 : 0
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-zinc-600 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-400">{label}</span>
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

              <SectionCard
                title="Recent Jobs"
                actions={
                  <Link href="/admin/discovery-jobs" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              >
                {stats.recentJobs.length > 0 ? (
                  <div className="space-y-1">
                    {stats.recentJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/admin/discovery-jobs/${job.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors"
                      >
                        <StatusIcon status={job.status} />
                        <span className="flex-1 text-sm text-zinc-300 truncate">{job.name}</span>
                        <span className="text-xs text-zinc-600 shrink-0 tabular-nums">{job.insertedLeads} leads</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-600 text-sm">No jobs yet</div>
                )}
              </SectionCard>
            </div>

            {/* Recent leads */}
            <SectionCard
              title="Recent Leads"
              actions={
                <Link href="/admin/leads" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              {stats.recentLeads.length > 0 ? (
                <div className="space-y-1">
                  {stats.recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/30 transition-colors">
                      {lead.photoUrl ? (
                        <img src={lead.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-medium text-zinc-500">{getInitials(lead.name)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{lead.name || "Unknown"}</p>
                        <p className="text-xs text-zinc-600 truncate">
                          {[lead.city, lead.country].filter(Boolean).join(", ") || "No location"}
                        </p>
                      </div>
                      <ScoreBadge score={lead.score} />
                      <span className="text-xs text-zinc-600 shrink-0">{formatRelativeDate(lead.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-600 text-sm">
                  No leads yet. Run a discovery job to get started.
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </ContentWrapper>
    </div>
  )
}
