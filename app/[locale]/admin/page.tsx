"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
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
  AlertTriangle,
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
  StatusBadge,
  LoadingState,
  EmptyState,
  StatNumber,
} from "@/components/admin"
import { AiOrb } from "@/components/ai-orb"
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

// Unified ramp: emerald → teal → cyan → sky → indigo.
// All feel related to the brand without being monotone.
const PIE_COLORS = ["#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#6366f1"]

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

  const hasRunningJobs = (stats?.jobs.running ?? 0) > 0

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <ContentWrapper>
        {/* Hero row with cascaded entrance */}
        <div className="relative mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-[11px] text-emerald-400/80 font-semibold uppercase tracking-widest mb-2"
              >
                {t("dashboard")}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-2xl md:text-3xl text-white font-semibold tracking-tight leading-tight"
              >
                {hasRunningJobs ? "Your AI is working" : "Welcome back"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-zinc-400 mt-2 max-w-lg text-sm leading-relaxed"
              >
                {hasRunningJobs
                  ? `${stats?.jobs.running} discovery job${(stats?.jobs.running ?? 0) > 1 ? "s" : ""} running in the background.`
                  : "Overview of your leads, discovery jobs, and pipeline activity."}
              </motion.p>
            </div>
            {/* Hero AI orb — matches onboarding pattern. No fixed-size wrapper
                and no overflow-hidden so the orb's ambient glow (~80px beyond
                its core) stays visible on all sides. */}
            <motion.div
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden sm:block shrink-0 mr-4 mt-2"
            >
              <AiOrb
                size="sm"
                state={hasRunningJobs ? "processing" : "idle"}
              />
            </motion.div>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : !stats ? (
          <EmptyState icon={AlertTriangle} title="Failed to load dashboard data." />
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
                accent="emerald"
              />
              <StatCard
                label={t("score")}
                value={stats.leads.avgScore.toFixed(1)}
                icon={Star}
                sub="avg across all leads"
                accent="amber"
              />
              <StatCard
                label={t("discoveryJobs")}
                value={stats.jobs.total}
                icon={Radar}
                sub={`${stats.jobs.completed} completed`}
                href="/admin/discovery-jobs"
                accent="sky"
              />
              <StatCard
                label="Enriched"
                value={stats.leads.enriched}
                icon={TrendingUp}
                sub={stats.leads.total > 0 ? `${Math.round((stats.leads.enriched / stats.leads.total) * 100)}% of leads` : "0%"}
                accent="violet"
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
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/40 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                            {job.name}
                          </p>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            <StatNumber value={job.insertedLeads} /> leads
                          </p>
                        </div>
                        <StatusBadge status={job.status} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Radar} title="No jobs yet" />
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
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/40 transition-colors group"
                    >
                      {lead.photoUrl ? (
                        <img
                          src={lead.photoUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-800"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 ring-1 ring-zinc-700/50">
                          <span className="text-[10px] font-medium text-zinc-400">
                            {getInitials(lead.name)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                          {lead.name || "Unknown"}
                        </p>
                        <p className="text-xs text-zinc-600 truncate">
                          {[lead.city, lead.country].filter(Boolean).join(", ") || "No location"}
                        </p>
                      </div>
                      <ScoreBadge score={lead.score} />
                      <StatNumber
                        value={formatRelativeDate(lead.createdAt)}
                        className="text-xs text-zinc-600 shrink-0"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No leads yet"
                  description="Run a discovery job to get started."
                />
              )}
            </SectionCard>
          </div>
        )}
      </ContentWrapper>
    </div>
  )
}
