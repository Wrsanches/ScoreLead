"use client"

import { useMemo, useRef, useState } from "react"
import {
  Calculator,
  Check,
  ClipboardList,
  Clock,
  Gauge,
  Download,
  ListChecks,
  Printer,
  RotateCcw,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { trackMarketingEvent } from "@/lib/analytics-events"
import type { MarketingLocale } from "@/lib/marketing/types"
import { calculateLeadScore, toCsv } from "@/lib/marketing/tool-model"
import { toolCopy } from "@/lib/marketing/tool-copy"

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

const STAT_LABEL = "text-xs font-medium text-zinc-400 print:text-zinc-600"

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
  csvRows,
  exportDisabled = false,
}: {
  children: React.ReactNode
  slug: string
  locale: MarketingLocale
  title: string
  icon: LucideIcon
  onReset: () => void
  csvRows?: (string | number)[][]
  exportDisabled?: boolean
}) {
  const labels = toolLabels[locale]
  const copy = toolCopy[locale]
  const [notice, setNotice] = useState("")

  function downloadCsv() {
    if (!csvRows || exportDisabled) return
    try {
      const url = URL.createObjectURL(new Blob([toCsv(csvRows)], { type: "text/csv;charset=utf-8" }))
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `scorelead-${slug}-${locale}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice(copy.exported)
      trackMarketingEvent("tool_completed", { tool: slug, action: "csv_download", locale, page_group: "tools" })
    } catch {
      setNotice(copy.exportError)
    }
  }

  function printTool() {
    trackMarketingEvent("tool_completed", { tool: slug, action: "print", locale, page_group: "tools" })
    window.print()
  }

  return (
    <section
      aria-label={title}
      data-marketing-tool
      className="glass-card relative overflow-hidden rounded-3xl p-5 sm:p-7 print:bg-white print:text-zinc-950 print:shadow-none print:ring-zinc-300"
    >
      {/* Header: mirrors the dashboard hero (eyebrow + title) with a pill icon */}
      <div className="mb-6 flex items-center gap-3.5 sm:mb-7">
        <span className="glass-pill inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-zinc-300 print:hidden">
          <Icon className="size-[1.125rem]" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={STAT_LABEL}>{labels.shell.eyebrow}</p>
          <h2 className="mt-1 text-xl font-medium tracking-tight text-white sm:text-2xl print:text-zinc-950">
            {title}
          </h2>
        </div>
      </div>

      {children}

      <p className="mt-6 text-sm leading-6 text-zinc-400 print:hidden">{copy.privacy}</p>
      <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:flex-wrap print:hidden">
        {csvRows ? <button type="button" onClick={downloadCsv} disabled={exportDisabled} className="press inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-medium text-zinc-950 hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
          <Download className="size-4" aria-hidden="true" />{copy.download}
        </button> : null}
        <button
          type="button"
          onClick={printTool}
          className={`press inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 ${csvRows ? "glass-pill text-zinc-200 hover:brightness-125" : "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"}`}
        >
          <Printer className="size-4" aria-hidden="true" />
          {labels.actions.print}
        </button>
        <button
          type="button"
          onClick={() => { onReset(); setNotice(copy.reset) }}
          className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 sm:ml-auto"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {labels.actions.reset}
        </button>
      </div>
      <p role="status" className="mt-3 min-h-6 text-sm text-zinc-300 print:hidden">{notice}</p>
    </section>
  )
}

/* Shared field surface: quiet content material with an emerald focus ring,
   matching how inputs sit inside admin section cards. */
const FIELD_TILE =
  "surface-card flex min-w-0 flex-col gap-3 rounded-2xl p-5 transition-shadow focus-within:ring-1 focus-within:ring-emerald-400/60 print:bg-white print:shadow-none print:ring-zinc-300"

const TOOL_ACTION = "glass-pill press inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-200 transition-[filter,transform] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 print:hidden"

function IcpWorksheet({ locale, onFirstInteraction }: { locale: MarketingLocale; onFirstInteraction: () => void }) {
  const labels = toolLabels[locale].worksheet
  const copy = toolCopy[locale]
  const fields = [labels.market, labels.required, labels.preferred, labels.disqualifiers, labels.evidence, labels.learning]
  const [values, setValues] = useState<string[]>(() => fields.map(() => ""))
  const [notice, setNotice] = useState("")
  const rows = [[copy.field, copy.value, copy.help, copy.exampleColumn], ...fields.map((field, i) => [field, values[i], copy.hints[i], copy.examples[i]])]
  return (
    <ToolShell slug="icp-worksheet" locale={locale} title={labels.title} icon={ClipboardList} csvRows={rows}
      onReset={() => { setValues(fields.map(() => "")); setNotice("") }}>
      <div className="mb-6">
        <div className="flex flex-col items-start gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">{copy.exampleNote}</p>
          <button type="button" className={TOOL_ACTION} onClick={() => { setValues([...copy.examples]); setNotice(copy.replaced); onFirstInteraction() }}><ClipboardList className="size-4" aria-hidden="true" />{copy.example}</button>
        </div>
        <p role="status" className="mt-3 text-sm text-emerald-300 empty:hidden print:hidden">{notice}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field, index) => (
          <label key={field} className={FIELD_TILE}>
            <span className="flex items-start justify-between gap-3">
              <span id={`icp-label-${index}`} className="text-sm font-medium leading-6 text-zinc-200 print:text-zinc-900">{field}</span>
              <IndexPill index={index} />
            </span>
            <span id={`icp-help-${index}`} className="text-sm leading-6 text-zinc-400">{copy.hints[index]}</span>
            <textarea rows={4} value={values[index]} aria-labelledby={`icp-label-${index}`} aria-describedby={`icp-help-${index}`} placeholder={labels.placeholder}
              onChange={(event) => {
                onFirstInteraction()
                setValues(values.map((value, i) => i === index ? event.target.value : value))
              }}
              className="min-h-28 w-full max-w-full resize-none self-start rounded-xl border border-white/10 bg-zinc-950/30 p-3 text-base leading-6 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/50 focus:outline-none supports-[field-sizing:content]:h-auto supports-[field-sizing:content]:max-h-80 supports-[field-sizing:content]:field-sizing-content print:hidden" />
            <div className="hidden whitespace-pre-wrap text-zinc-950 print:block">{values[index] || "—"}</div>
          </label>
        ))}
      </div>
      <details className="mt-6 rounded-2xl border border-white/10 p-5 print:hidden">
        <summary className="cursor-pointer text-sm font-medium text-zinc-200 focus-visible:outline-2 focus-visible:outline-emerald-400">{copy.exampleHeading}</summary>
        <dl className="mt-4 space-y-4">{fields.map((field, i) => <div key={field}><dt className="text-sm font-medium text-zinc-200">{field}</dt><dd className="mt-1 text-sm leading-6 text-zinc-400">{copy.examples[i]}</dd></div>)}</dl>
      </details>
    </ToolShell>
  )
}

function ScoringCalculator({ locale, onFirstInteraction }: { locale: MarketingLocale; onFirstInteraction: () => void }) {
  const labels = toolLabels[locale].scoring
  const copy = toolCopy[locale]
  const [scores, setScores] = useState([50, 50, 50, 50, 50])
  const [weights, setWeights] = useState(["20", "20", "20", "20", "20"])
  const [excluded, setExcluded] = useState([false, false, false])
  const inputs = scores.map((score, i) => ({ score, weight: weights[i].trim() === "" ? NaN : Number(weights[i]) }))
  const result = calculateLeadScore(inputs, excluded.some(Boolean))
  const invalid = result.status === "invalid"
  const tier = result.status === "disqualified" ? copy.excluded : result.status === "priority" ? labels.tierHigh : result.status === "research" ? labels.tierMedium : labels.tierLow
  const rows: (string | number)[][] = [
    [copy.field, copy.score, copy.weight],
    ...labels.dimensions.map((dimension, i) => [dimension, scores[i], weights[i]]),
    [copy.weighted, result.score ?? "", ""], [copy.status, invalid ? copy.invalid : tier, ""],
    ...copy.rules.map((rule, i) => [rule, Number(excluded[i]), ""]),
    [copy.formula, "", ""], [copy.review, "", ""],
  ]
  return (
    <ToolShell slug="lead-scoring-calculator" locale={locale} title={labels.title} icon={Gauge} csvRows={rows} exportDisabled={invalid}
      onReset={() => { setScores([50, 50, 50, 50, 50]); setWeights(["20", "20", "20", "20", "20"]); setExcluded([false, false, false]) }}>
      <div className="mb-6 flex flex-col items-start gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-zinc-400">{copy.formula}</p>
        <button type="button" className={TOOL_ACTION} onClick={() => { setScores([90, 60, 80, 50, 40]); setWeights(["40", "10", "20", "10", "20"]); setExcluded([false, false, false]); onFirstInteraction() }}><ClipboardList className="size-4" aria-hidden="true" />{copy.example}</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="surface-card divide-y divide-white/[0.06] rounded-2xl px-5 print:bg-white">
          {labels.dimensions.map((dimension, index) => (
            <div key={dimension} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_5.5rem] sm:gap-6">
              <label className="grid min-w-0 gap-3">
                <span className="flex justify-between gap-3 text-sm text-zinc-200 print:text-zinc-900"><span>{dimension}</span><output className="font-mono tabular-nums">{scores[index]}</output></span>
                <input type="range" min="0" max="100" step="5" value={scores[index]} aria-label={`${dimension}: ${copy.score}`}
                  onChange={(event) => { onFirstInteraction(); setScores(scores.map((score, i) => i === index ? Number(event.target.value) : score)) }}
                  className="h-6 w-full cursor-pointer accent-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 print:hidden" />
              </label>
              <label className="grid gap-1 text-xs text-zinc-400"><span>{copy.weight}</span>
                <input type="number" min="0" max="100" step="any" value={weights[index]} aria-label={`${dimension}: ${copy.weight}`} aria-invalid={invalid} aria-describedby={invalid ? "scoring-error" : undefined}
                  onChange={(event) => { onFirstInteraction(); setWeights(weights.map((weight, i) => i === index ? event.target.value : weight)) }}
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950/30 px-3 font-mono text-base tabular-nums text-white focus-visible:outline-2 focus-visible:outline-emerald-400 print:text-zinc-900" />
              </label>
            </div>
          ))}
        </div>
        <div className="space-y-4 lg:sticky lg:top-24" aria-live="polite" aria-atomic="true">
          <StatTile label={labels.result} value={result.score === null ? "—" : <>{result.score}<span className="ml-1 text-lg font-normal text-zinc-500">/100</span></>} icon={Gauge} accent={result.status === "priority" ? "emerald" : result.status === "disqualified" ? "amber" : "zinc"}>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10 print:hidden" aria-hidden="true"><div className={`h-full rounded-full transition-[width] duration-200 ${result.status === "disqualified" ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${result.score ?? 0}%` }} /></div>
            <p className="mt-3 text-sm leading-6 text-zinc-200 print:text-zinc-900">{invalid ? copy.invalid : tier}</p>
            <div className="mt-4 flex justify-between gap-3 border-t border-white/10 pt-3 text-xs text-zinc-400"><span>{copy.totalWeight}</span><span className="font-mono tabular-nums">{invalid ? "—" : inputs.reduce((sum, input) => sum + input.weight, 0)}</span></div>
          </StatTile>
          <p className="text-sm leading-6 text-zinc-400">{copy.review}</p>
        </div>
      </div>
      {invalid ? <p id="scoring-error" role="alert" className="mt-4 text-sm text-amber-300">{copy.invalid}</p> : null}
      <fieldset className="mt-6 space-y-3 rounded-2xl border border-white/10 p-5">
        <legend className="px-2 font-medium text-zinc-200 print:text-zinc-900">{copy.disqualifiers}</legend>
        <p className="text-sm leading-6 text-zinc-400">{copy.disqualifierHelp}</p>
        {copy.rules.map((rule, i) => <label key={rule} className="surface-card flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm leading-6 text-zinc-300 transition-colors has-checked:bg-amber-500/[0.06] has-checked:text-amber-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-400 print:text-zinc-900">
          <input type="checkbox" checked={excluded[i]} onChange={(event) => { onFirstInteraction(); setExcluded(excluded.map((value, index) => index === i ? event.target.checked : value)) }} className="size-4 shrink-0 accent-emerald-400" />{rule}
        </label>)}
      </fieldset>
      <p className="mt-6 text-sm leading-6 text-zinc-400">{copy.exampleMath}</p>
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
    trackMarketingEvent("tool_started", { tool: slug, locale, page_group: "tools" })
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
