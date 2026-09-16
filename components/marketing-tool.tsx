"use client"

import { useMemo, useRef, useState } from "react"
import {
  Calculator,
  Check,
  ClipboardList,
  Clock,
  Gauge,
  ListChecks,
  Printer,
  RotateCcw,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { trackMarketingEvent } from "@/lib/analytics-events"
import type { MarketingLocale } from "@/lib/marketing"

const toolLabels = {
  en: {
    shell: {
      eyebrow: "Interactive tool",
    },
    worksheet: {
      title: "ICP worksheet",
      market: "Target market and geography",
      required: "Required account criteria",
      preferred: "Preferred signals",
      disqualifiers: "Disqualifiers",
      evidence: "Observable problem evidence",
      learning: "What will make us revise this ICP?",
      placeholder: "Write concise, observable criteria…",
    },
    scoring: {
      title: "Lead scoring calculator",
      dimensions: ["Market fit", "Online reach", "Trust", "Engagement potential", "Readiness"],
      result: "Weighted score",
      tierHigh: "Priority review",
      tierMedium: "Enrich or research",
      tierLow: "Hold or reject",
      formula: "Equal-weight average of the five visible inputs.",
    },
    checklist: {
      title: "Enrichment checklist",
      items: [
        "Company name and canonical domain confirmed",
        "Location and operating market verified",
        "Services or product category captured",
        "ICP fit signals recorded",
        "Disqualifiers checked",
        "Relevant problem evidence identified",
        "Public contact channels verified",
        "Source URLs retained",
        "Observation date recorded",
        "Inferred and unknown fields labeled",
        "Duplicate account check completed",
        "Privacy and channel rules reviewed",
      ],
      progress: "Account readiness",
      checked: "checked",
    },
    roi: {
      title: "Research ROI calculator",
      team: "People doing research",
      hours: "Research hours per person / week",
      cost: "Loaded hourly cost (USD)",
      reduction: "Estimated time reduction",
      monthlyCost: "Current monthly research cost",
      recoveredHours: "Potential hours recovered / month",
      recoverableValue: "Potential monthly time value",
    },
    actions: {
      print: "Print or save as PDF",
      reset: "Reset",
    },
  },
  pt: {
    shell: {
      eyebrow: "Ferramenta interativa",
    },
    worksheet: {
      title: "Planilha de ICP",
      market: "Mercado-alvo e geografia",
      required: "Critérios obrigatórios da conta",
      preferred: "Sinais preferenciais",
      disqualifiers: "Desqualificadores",
      evidence: "Evidência observável do problema",
      learning: "O que nos fará revisar este ICP?",
      placeholder: "Escreva critérios concisos e observáveis…",
    },
    scoring: {
      title: "Calculadora de pontuação",
      dimensions: ["Fit de mercado", "Alcance online", "Confiança", "Potencial de engajamento", "Prontidão"],
      result: "Pontuação ponderada",
      tierHigh: "Revisão prioritária",
      tierMedium: "Enriquecer ou pesquisar",
      tierLow: "Aguardar ou rejeitar",
      formula: "Média com pesos iguais dos cinco inputs visíveis.",
    },
    checklist: {
      title: "Checklist de enriquecimento",
      items: [
        "Nome e domínio canônico confirmados",
        "Localização e mercado verificados",
        "Serviços ou categoria registrados",
        "Sinais de fit com o ICP registrados",
        "Desqualificadores verificados",
        "Evidência relevante do problema identificada",
        "Canais públicos de contato verificados",
        "URLs de origem preservadas",
        "Data de observação registrada",
        "Campos inferidos e desconhecidos identificados",
        "Duplicidade verificada",
        "Regras de privacidade e canal revisadas",
      ],
      progress: "Prontidão da conta",
      checked: "marcados",
    },
    roi: {
      title: "Calculadora de ROI",
      team: "Pessoas fazendo pesquisa",
      hours: "Horas de pesquisa por pessoa / semana",
      cost: "Custo completo por hora (USD)",
      reduction: "Redução estimada de tempo",
      monthlyCost: "Custo mensal atual de pesquisa",
      recoveredHours: "Horas potencialmente recuperadas / mês",
      recoverableValue: "Valor mensal potencial do tempo",
    },
    actions: {
      print: "Imprimir ou salvar em PDF",
      reset: "Limpar",
    },
  },
  es: {
    shell: {
      eyebrow: "Herramienta interactiva",
    },
    worksheet: {
      title: "Hoja de trabajo de ICP",
      market: "Mercado objetivo y geografía",
      required: "Criterios obligatorios de la cuenta",
      preferred: "Señales preferidas",
      disqualifiers: "Descalificadores",
      evidence: "Evidencia observable del problema",
      learning: "¿Qué nos hará revisar este ICP?",
      placeholder: "Escribe criterios concisos y observables…",
    },
    scoring: {
      title: "Calculadora de puntuación",
      dimensions: ["Ajuste de mercado", "Alcance online", "Confianza", "Potencial de interacción", "Preparación"],
      result: "Puntuación ponderada",
      tierHigh: "Revisión prioritaria",
      tierMedium: "Enriquecer o investigar",
      tierLow: "Esperar o rechazar",
      formula: "Promedio con pesos iguales de las cinco entradas visibles.",
    },
    checklist: {
      title: "Checklist de enriquecimiento",
      items: [
        "Nombre y dominio canónico confirmados",
        "Ubicación y mercado verificados",
        "Servicios o categoría registrados",
        "Señales de ajuste con el ICP registradas",
        "Descalificadores comprobados",
        "Evidencia relevante del problema identificada",
        "Canales públicos de contacto verificados",
        "URLs de origen conservadas",
        "Fecha de observación registrada",
        "Campos inferidos y desconocidos etiquetados",
        "Duplicados comprobados",
        "Reglas de privacidad y canal revisadas",
      ],
      progress: "Preparación de la cuenta",
      checked: "marcados",
    },
    roi: {
      title: "Calculadora de ROI",
      team: "Personas investigando",
      hours: "Horas de investigación por persona / semana",
      cost: "Coste completo por hora (USD)",
      reduction: "Reducción estimada de tiempo",
      monthlyCost: "Coste mensual actual",
      recoveredHours: "Horas potencialmente recuperadas / mes",
      recoverableValue: "Valor mensual potencial del tiempo",
    },
    actions: {
      print: "Imprimir o guardar como PDF",
      reset: "Restablecer",
    },
  },
} as const

/* ── Shared dashboard primitives ─────────────────────────────────────
   These mirror components/admin (StatCard, SectionCard, glass-pill) so
   the tools read as a slice of the product dashboard dropped into the
   marketing page. Marketing surfaces are dark-only, so colors are
   hardcoded rather than paired with dark: variants. */

type Accent = "emerald" | "sky" | "violet" | "amber" | "zinc"

const ACCENT: Record<Accent, { ring: string; gradient: string; icon: string; iconBg: string }> = {
  emerald: {
    ring: "ring-1 ring-emerald-500/15",
    gradient: "bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent",
    icon: "text-emerald-300",
    iconBg: "bg-emerald-500/10 ring-emerald-500/25",
  },
  sky: {
    ring: "ring-1 ring-sky-500/15",
    gradient: "bg-gradient-to-br from-sky-500/[0.06] via-sky-500/[0.02] to-transparent",
    icon: "text-sky-300",
    iconBg: "bg-sky-500/10 ring-sky-500/25",
  },
  violet: {
    ring: "ring-1 ring-violet-500/15",
    gradient: "bg-gradient-to-br from-violet-500/[0.06] via-violet-500/[0.02] to-transparent",
    icon: "text-violet-300",
    iconBg: "bg-violet-500/10 ring-violet-500/25",
  },
  amber: {
    ring: "ring-1 ring-amber-500/15",
    gradient: "bg-gradient-to-br from-amber-500/[0.06] via-amber-500/[0.02] to-transparent",
    icon: "text-amber-300",
    iconBg: "bg-amber-500/10 ring-amber-500/25",
  },
  zinc: {
    ring: "",
    gradient: "",
    icon: "text-zinc-400",
    iconBg: "bg-white/[0.06] ring-white/[0.1]",
  },
}

const STAT_LABEL = "text-[11px] font-semibold uppercase tracking-wider text-zinc-500 print:text-zinc-600"

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  accent = "zinc",
  children,
  className = "",
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: LucideIcon
  accent?: Accent
  children?: React.ReactNode
  className?: string
}) {
  const a = ACCENT[accent]
  return (
    <div
      className={`glass-card relative overflow-hidden rounded-2xl p-5 ${a.gradient} ${a.ring} print:bg-white print:shadow-none print:ring-zinc-300 ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={STAT_LABEL}>{label}</span>
        {Icon ? (
          <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ${a.iconBg}`}>
            <Icon className={`size-3.5 ${a.icon}`} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <output className="block text-3xl font-semibold tabular-nums tracking-tight text-white print:text-zinc-950">
        {value}
      </output>
      {sub ? <div className="mt-1.5 text-xs tabular-nums text-zinc-500">{sub}</div> : null}
      {children}
    </div>
  )
}

function IndexPill({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="glass-pill inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1.5 font-mono text-[10px] tabular-nums text-zinc-400 print:hidden"
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  )
}

function ToolShell({
  children,
  slug,
  locale,
  title,
  icon: Icon,
  onReset,
}: {
  children: React.ReactNode
  slug: string
  locale: MarketingLocale
  title: string
  icon: LucideIcon
  onReset: () => void
}) {
  const labels = toolLabels[locale]

  function printTool() {
    trackMarketingEvent("tool_completed", { tool: slug, action: "print" })
    window.print()
  }

  return (
    <section
      aria-label={title}
      className="glass-card relative overflow-hidden rounded-3xl p-5 sm:p-7 print:bg-white print:text-zinc-950 print:shadow-none print:ring-zinc-300"
    >
      {/* Header: mirrors the dashboard hero (eyebrow + title) with a pill icon */}
      <div className="mb-6 flex items-center gap-3.5 sm:mb-7">
        <span className="glass-pill inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-zinc-300 print:hidden">
          <Icon className="size-[1.125rem]" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={STAT_LABEL}>{labels.shell.eyebrow}</p>
          <p className="mt-0.5 truncate text-[0.9375rem] font-medium tracking-tight text-white print:text-zinc-950">
            {title}
          </p>
        </div>
      </div>

      {children}

      <div className="mt-7 flex flex-wrap gap-3 border-t border-white/[0.06] pt-5 print:hidden">
        <button
          type="button"
          onClick={printTool}
          className="press inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-medium text-zinc-950 transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
        >
          <Printer className="size-4" aria-hidden="true" />
          {labels.actions.print}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="glass-pill press inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-300 transition-[transform,filter] ease-[cubic-bezier(0.23,1,0.32,1)] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {labels.actions.reset}
        </button>
      </div>
    </section>
  )
}

/* Shared field surface: quiet content material with an emerald focus ring,
   matching how inputs sit inside admin section cards. */
const FIELD_TILE =
  "surface-card grid gap-3 rounded-2xl p-4 transition-shadow focus-within:ring-1 focus-within:ring-emerald-500/40 print:bg-white print:shadow-none print:ring-zinc-300"

function IcpWorksheet({
  locale,
  onFirstInteraction,
}: {
  locale: MarketingLocale
  onFirstInteraction: () => void
}) {
  const labels = toolLabels[locale].worksheet
  const fields = [
    labels.market,
    labels.required,
    labels.preferred,
    labels.disqualifiers,
    labels.evidence,
    labels.learning,
  ]
  const [version, setVersion] = useState(0)

  return (
    <ToolShell
      slug="icp-worksheet"
      locale={locale}
      title={labels.title}
      icon={ClipboardList}
      onReset={() => setVersion((value) => value + 1)}
    >
      <div key={version} className="grid gap-4 md:grid-cols-2">
        {fields.map((field, index) => (
          <label key={field} className={FIELD_TILE}>
            <span className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium leading-6 text-zinc-200 print:text-zinc-900">{field}</span>
              <IndexPill index={index} />
            </span>
            <textarea
              rows={4}
              onChange={onFirstInteraction}
              placeholder={labels.placeholder}
              className="resize-y rounded-lg bg-transparent text-[0.9375rem] font-normal leading-6 text-zinc-100 placeholder:text-zinc-600 focus:outline-none print:text-zinc-950"
            />
          </label>
        ))}
      </div>
    </ToolShell>
  )
}

function ScoringCalculator({
  locale,
  onFirstInteraction,
}: {
  locale: MarketingLocale
  onFirstInteraction: () => void
}) {
  const labels = toolLabels[locale].scoring
  const [scores, setScores] = useState([50, 50, 50, 50, 50])
  const result = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  const tier =
    result >= 75
      ? { label: labels.tierHigh, badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", accent: "emerald" as Accent }
      : result >= 50
        ? { label: labels.tierMedium, badge: "bg-amber-500/10 border-amber-500/20 text-amber-300", accent: "amber" as Accent }
        : { label: labels.tierLow, badge: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400", accent: "zinc" as Accent }

  return (
    <ToolShell
      slug="lead-scoring-calculator"
      locale={locale}
      title={labels.title}
      icon={Gauge}
      onReset={() => setScores([50, 50, 50, 50, 50])}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <div className="surface-card grid gap-5 rounded-2xl p-5 print:bg-white print:shadow-none print:ring-zinc-300">
          {labels.dimensions.map((dimension, index) => (
            <label key={dimension} className="grid gap-2.5">
              <span className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-zinc-200 print:text-zinc-900">{dimension}</span>
                <output className="glass-pill rounded-md px-2 py-0.5 font-mono text-xs tabular-nums text-zinc-300 print:text-zinc-900">
                  {scores[index]}
                </output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={scores[index]}
                aria-label={dimension}
                style={{
                  background: `linear-gradient(to right, #34d399 ${scores[index]}%, rgba(255,255,255,0.08) ${scores[index]}%)`,
                }}
                onChange={(event) => {
                  onFirstInteraction()
                  const next = [...scores]
                  next[index] = Number(event.target.value)
                  setScores(next)
                }}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-emerald-400 print:bg-zinc-200 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.5)] [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
              />
            </label>
          ))}
        </div>
        <StatTile label={labels.result} value={result} icon={Gauge} accent={tier.accent}>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tier.badge} print:border-zinc-300 print:text-zinc-900`}
          >
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            {tier.label}
          </span>
          <p className="mt-4 text-xs leading-5 text-zinc-500">{labels.formula}</p>
        </StatTile>
      </div>
    </ToolShell>
  )
}

function EnrichmentChecklist({
  locale,
  onFirstInteraction,
}: {
  locale: MarketingLocale
  onFirstInteraction: () => void
}) {
  const labels = toolLabels[locale].checklist
  const [checked, setChecked] = useState<boolean[]>(() => labels.items.map(() => false))
  const completed = checked.filter(Boolean).length
  const percentage = Math.round((completed / checked.length) * 100)
  const done = completed === checked.length

  return (
    <ToolShell
      slug="enrichment-checklist"
      locale={locale}
      title={labels.title}
      icon={ListChecks}
      onReset={() => setChecked(labels.items.map(() => false))}
    >
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <StatTile
          label={labels.progress}
          value={`${percentage}%`}
          sub={`${completed} / ${checked.length} ${labels.checked}`}
          icon={ListChecks}
          accent={done ? "emerald" : "zinc"}
          className="lg:sticky lg:top-24"
        >
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06] print:bg-zinc-200"
          >
            <div
              className="h-full rounded-full bg-emerald-400 transition-[width] duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </StatTile>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {labels.items.map((item, index) => (
            <label
              key={item}
              className="surface-card flex cursor-pointer items-start gap-3 rounded-2xl p-4 text-sm leading-6 text-zinc-300 transition-[box-shadow,background-color] has-checked:bg-emerald-500/[0.05] has-checked:ring-1 has-checked:ring-emerald-500/30 has-checked:text-zinc-100 print:bg-white print:shadow-none print:ring-zinc-300 print:text-zinc-900"
            >
              <input
                type="checkbox"
                checked={checked[index]}
                onChange={(event) => {
                  onFirstInteraction()
                  const next = [...checked]
                  next[index] = event.target.checked
                  setChecked(next)
                }}
                className="mt-1 size-4 shrink-0 rounded accent-emerald-400"
              />
              {item}
            </label>
          ))}
        </div>
      </div>
    </ToolShell>
  )
}

function RoiCalculator({
  locale,
  onFirstInteraction,
}: {
  locale: MarketingLocale
  onFirstInteraction: () => void
}) {
  const labels = toolLabels[locale].roi
  const [inputs, setInputs] = useState({ team: 3, hours: 8, cost: 40, reduction: 60 })
  const results = useMemo(() => {
    const monthlyHours = inputs.team * inputs.hours * 4.33
    const monthlyCost = monthlyHours * inputs.cost
    const recoveredHours = monthlyHours * (inputs.reduction / 100)
    return {
      monthlyCost,
      recoveredHours,
      recoverableValue: recoveredHours * inputs.cost,
    }
  }, [inputs])

  const fields = [
    { key: "team", label: labels.team, min: 1, max: 100, step: 1 },
    { key: "hours", label: labels.hours, min: 1, max: 40, step: 1 },
    { key: "cost", label: labels.cost, min: 1, max: 500, step: 1 },
    { key: "reduction", label: `${labels.reduction} (%)`, min: 5, max: 95, step: 5 },
  ] as const

  const currency = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })

  return (
    <ToolShell
      slug="lead-research-roi-calculator"
      locale={locale}
      title={labels.title}
      icon={Calculator}
      onReset={() => setInputs({ team: 3, hours: 8, cost: 40, reduction: 60 })}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {fields.map((field) => (
            <label key={field.key} className={FIELD_TILE}>
              <span className={STAT_LABEL}>{field.label}</span>
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={inputs[field.key]}
                onChange={(event) => {
                  onFirstInteraction()
                  setInputs({ ...inputs, [field.key]: Number(event.target.value) })
                }}
                className="w-full bg-transparent text-2xl font-semibold tabular-nums tracking-tight text-white focus:outline-none print:text-zinc-950"
              />
            </label>
          ))}
        </div>
        <div className="grid gap-3">
          <StatTile
            label={labels.monthlyCost}
            value={currency.format(results.monthlyCost)}
            icon={Wallet}
            accent="zinc"
          />
          <StatTile
            label={labels.recoveredHours}
            value={`${Math.round(results.recoveredHours)}h`}
            icon={Clock}
            accent="sky"
          />
          <StatTile
            label={labels.recoverableValue}
            value={currency.format(results.recoverableValue)}
            icon={TrendingUp}
            accent="emerald"
          />
        </div>
      </div>
    </ToolShell>
  )
}

export function MarketingTool({
  slug,
  locale,
}: {
  slug: string
  locale: MarketingLocale
}) {
  const tracked = useRef(false)
  function onFirstInteraction() {
    if (tracked.current) return
    tracked.current = true
    trackMarketingEvent("tool_started", { tool: slug })
  }

  if (slug === "icp-worksheet") {
    return <IcpWorksheet locale={locale} onFirstInteraction={onFirstInteraction} />
  }
  if (slug === "lead-scoring-calculator") {
    return <ScoringCalculator locale={locale} onFirstInteraction={onFirstInteraction} />
  }
  if (slug === "enrichment-checklist") {
    return <EnrichmentChecklist locale={locale} onFirstInteraction={onFirstInteraction} />
  }
  if (slug === "lead-research-roi-calculator") {
    return <RoiCalculator locale={locale} onFirstInteraction={onFirstInteraction} />
  }

  return (
    <div className="surface-card rounded-2xl p-6 text-sm text-zinc-400">
      <Check className="mb-3 size-5 text-emerald-400" aria-hidden="true" />
      Tool unavailable.
    </div>
  )
}
