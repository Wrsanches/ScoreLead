"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { MobileMenuButton } from "@/components/admin-shell"
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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
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

interface DashboardStats {
  jobs: {
    total: number
    completed: number
    running: number
    failed: number
  }
  leads: {
    total: number
    avgScore: number
    avgRating: number | null
    highScore: number
    withWebsite: number
    withEmail: number
    withPhone: number
    enriched: number
  }
  charts: {
    scoreDistribution: { bucket: string; count: number }[]
    sourceBreakdown: { source: string; count: number }[]
    leadsOverTime: { date: string; count: number }[]
  }
  recentLeads: {
    id: string
    name: string | null
    score: number
    city: string | null
    country: string | null
    photoUrl: string | null
    createdAt: string
  }[]
  recentJobs: {
    id: string
    name: string
    status: string
    insertedLeads: number
    createdAt: string
  }[]
}

const scoreChartConfig = {
  count: { label: "Leads", color: "var(--color-emerald-500)" },
} satisfies ChartConfig

const areaChartConfig = {
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
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function getInitials(name: string | null) {
    if (!name) return "?"
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 h-14 flex items-center border-b border-zinc-800/70 shrink-0">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <h1 className="text-white text-sm font-medium">{t("dashboard")}</h1>
        </div>
      </div>

      <div className="px-6 md:px-8 py-8 max-w-[1400px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : !stats ? (
          <div className="flex items-center justify-center py-32 text-zinc-500 text-sm">
            Failed to load dashboard data.
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label={t("leads")}
                value={stats.leads.total}
                icon={Users}
                sub={`${stats.leads.highScore} high score`}
                href="/admin/leads"
              />
              <KpiCard
                label={t("score")}
                value={stats.leads.avgScore.toFixed(1)}
                icon={Star}
                sub="avg across all leads"
              />
              <KpiCard
                label={t("discoveryJobs")}
                value={stats.jobs.total}
                icon={Radar}
                sub={`${stats.jobs.completed} completed`}
                href="/admin/discovery-jobs"
              />
              <KpiCard
                label="Enriched"
                value={stats.leads.enriched}
                icon={TrendingUp}
                sub={stats.leads.total > 0 ? `${Math.round((stats.leads.enriched / stats.leads.total) * 100)}% of leads` : "0%"}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Leads over time */}
              <div className="border border-zinc-800/60 rounded-xl p-5">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Leads - Last 7 days</p>
                {stats.charts.leadsOverTime.length > 0 ? (
                  <ChartContainer config={areaChartConfig} className="h-[200px] w-full">
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
                      <YAxis
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#areaGrad)"
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">
                    No data yet
                  </div>
                )}
              </div>

              {/* Score distribution */}
              <div className="border border-zinc-800/60 rounded-xl p-5">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Score Distribution</p>
                {stats.charts.scoreDistribution.length > 0 ? (
                  <ChartContainer config={scoreChartConfig} className="h-[200px] w-full">
                    <BarChart data={stats.charts.scoreDistribution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
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
                  <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">
                    No data yet
                  </div>
                )}
              </div>
            </div>

            {/* Source + Contact row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sources */}
              <div className="border border-zinc-800/60 rounded-xl p-5">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Sources</p>
                {stats.charts.sourceBreakdown.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ChartContainer config={{ count: { label: "Leads" } }} className="h-[140px] w-[140px] shrink-0">
                      <PieChart>
                        <Pie
                          data={stats.charts.sourceBreakdown}
                          dataKey="count"
                          nameKey="source"
                          innerRadius={40}
                          outerRadius={65}
                          strokeWidth={0}
                        >
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
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-sm text-zinc-400">{s.source}</span>
                          <span className="text-sm text-zinc-500 tabular-nums ml-auto">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[140px] flex items-center justify-center text-zinc-600 text-sm">
                    No data yet
                  </div>
                )}
              </div>

              {/* Contact availability */}
              <div className="border border-zinc-800/60 rounded-xl p-5">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Contact Availability</p>
                <div className="space-y-4">
                  {[
                    { label: "Website", count: stats.leads.withWebsite, icon: Globe },
                    { label: "Email", count: stats.leads.withEmail, icon: Mail },
                    { label: "Phone", count: stats.leads.withPhone, icon: Phone },
                  ].map(({ label, count, icon: Icon }) => {
                    const pct = stats.leads.total > 0 ? (count / stats.leads.total) * 100 : 0
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-zinc-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-400">{label}</span>
                            <span className="text-xs text-zinc-500 tabular-nums">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent jobs */}
              <div className="border border-zinc-800/60 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Recent Jobs</p>
                  <Link href="/admin/discovery-jobs" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {stats.recentJobs.length > 0 ? (
                  <div className="space-y-2">
                    {stats.recentJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/admin/discovery-jobs/${job.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors"
                      >
                        {job.status === "completed" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : job.status === "failed" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 truncate">{job.name}</p>
                        </div>
                        <span className="text-xs text-zinc-600 shrink-0 tabular-nums">
                          {job.insertedLeads} leads
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-600 text-sm">No jobs yet</div>
                )}
              </div>
            </div>

            {/* Recent leads */}
            <div className="border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Recent Leads</p>
                <Link href="/admin/leads" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {stats.recentLeads.length > 0 ? (
                <div className="space-y-1">
                  {stats.recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/30 transition-colors"
                    >
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
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                        lead.score >= 4 ? "text-emerald-400 bg-emerald-500/10" :
                        lead.score >= 3 ? "text-amber-400 bg-amber-500/10" :
                        "text-red-400 bg-red-500/10"
                      }`}>
                        {lead.score.toFixed(1)}
                      </span>
                      <span className="text-xs text-zinc-600 shrink-0">
                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-600 text-sm">
                  No leads yet. Run a discovery job to get started.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
  href,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  sub: string
  href?: string
}) {
  const content = (
    <div className="border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700/60 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-zinc-600" />
      </div>
      <p className="text-2xl text-white font-medium tabular-nums">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{sub}</p>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
