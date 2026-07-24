"use client"

import { useMemo, useRef, useState } from "react"
import { Check, Printer, RotateCcw } from "lucide-react"
import { trackMarketingEvent } from "@/lib/analytics-events"
import type { MarketingLocale } from "@/lib/marketing"

const toolLabels = {
  en: {
    worksheet: {
      market: "Target market and geography",
      required: "Required account criteria",
      preferred: "Preferred signals",
      disqualifiers: "Disqualifiers",
      evidence: "Observable problem evidence",
      learning: "What will make us revise this ICP?",
      placeholder: "Write concise, observable criteria…",
    },
    scoring: {
      dimensions: ["Market fit", "Online reach", "Trust", "Engagement potential", "Readiness"],
      result: "Weighted score",
      tierHigh: "Priority review",
      tierMedium: "Enrich or research",
      tierLow: "Hold or reject",
      formula: "Equal-weight average of the five visible inputs.",
    },
    checklist: {
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
    },
    roi: {
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
    worksheet: {
      market: "Mercado-alvo e geografia",
      required: "Critérios obrigatórios da conta",
      preferred: "Sinais preferenciais",
      disqualifiers: "Desqualificadores",
      evidence: "Evidência observável do problema",
      learning: "O que nos fará revisar este ICP?",
      placeholder: "Escreva critérios concisos e observáveis…",
    },
    scoring: {
      dimensions: ["Fit de mercado", "Alcance online", "Confiança", "Potencial de engajamento", "Prontidão"],
      result: "Pontuação ponderada",
      tierHigh: "Revisão prioritária",
      tierMedium: "Enriquecer ou pesquisar",
      tierLow: "Aguardar ou rejeitar",
      formula: "Média com pesos iguais dos cinco inputs visíveis.",
    },
    checklist: {
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
    },
    roi: {
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
    worksheet: {
      market: "Mercado objetivo y geografía",
      required: "Criterios obligatorios de la cuenta",
      preferred: "Señales preferidas",
      disqualifiers: "Descalificadores",
      evidence: "Evidencia observable del problema",
      learning: "¿Qué nos hará revisar este ICP?",
      placeholder: "Escribe criterios concisos y observables…",
    },
    scoring: {
      dimensions: ["Ajuste de mercado", "Alcance online", "Confianza", "Potencial de interacción", "Preparación"],
      result: "Puntuación ponderada",
      tierHigh: "Revisión prioritaria",
      tierMedium: "Enriquecer o investigar",
      tierLow: "Esperar o rechazar",
      formula: "Promedio con pesos iguales de las cinco entradas visibles.",
    },
    checklist: {
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
    },
    roi: {
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

function ToolShell({
  children,
  slug,
  locale,
  onReset,
}: {
  children: React.ReactNode
  slug: string
  locale: MarketingLocale
  onReset: () => void
}) {
  const labels = toolLabels[locale]

  function printTool() {
    trackMarketingEvent("tool_completed", { tool: slug, action: "print" })
    window.print()
  }

  return (
    <section
      aria-label={slug}
      className="rounded-2xl border border-zinc-700/80 bg-zinc-900/60 p-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.9)] sm:p-8 print:border-zinc-300 print:bg-white print:text-zinc-950"
    >
      {children}
      <div className="mt-8 flex flex-wrap gap-3 border-t border-zinc-800 pt-5 print:hidden">
        <button
          type="button"
          onClick={printTool}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
        >
          <Printer className="size-4" aria-hidden="true" />
          {labels.actions.print}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {labels.actions.reset}
        </button>
      </div>
    </section>
  )
}

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
      onReset={() => setVersion((value) => value + 1)}
    >
      <div key={version} className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className="grid gap-2 text-sm font-medium text-zinc-200 print:text-zinc-900">
            {field}
            <textarea
              rows={4}
              onChange={onFirstInteraction}
              placeholder={labels.placeholder}
              className="resize-y rounded-xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-base font-normal leading-6 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 print:border-zinc-300 print:bg-white print:text-zinc-950"
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
    result >= 75 ? labels.tierHigh : result >= 50 ? labels.tierMedium : labels.tierLow

  return (
    <ToolShell
      slug="lead-scoring-calculator"
      locale={locale}
      onReset={() => setScores([50, 50, 50, 50, 50])}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_240px] lg:items-start">
        <div className="grid gap-5">
          {labels.dimensions.map((dimension, index) => (
            <label key={dimension} className="grid gap-2">
              <span className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-200 print:text-zinc-900">{dimension}</span>
                <output className="font-mono text-emerald-400 print:text-zinc-900">
                  {scores[index]}/100
                </output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={scores[index]}
                onChange={(event) => {
                  onFirstInteraction()
                  const next = [...scores]
                  next[index] = Number(event.target.value)
                  setScores(next)
                }}
                className="accent-emerald-400"
              />
            </label>
          ))}
        </div>
        <div className="border-y border-zinc-700 py-6 text-center lg:border-y-0 lg:border-l lg:py-2 lg:pl-8 print:border-zinc-300">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{labels.result}</p>
          <output className="mt-2 block text-6xl font-medium tracking-[-0.05em] text-white print:text-zinc-950">
            {result}
          </output>
          <p className="mt-3 text-sm font-medium text-emerald-400 print:text-zinc-900">{tier}</p>
          <p className="mt-5 text-xs leading-5 text-zinc-500">{labels.formula}</p>
        </div>
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

  return (
    <ToolShell
      slug="enrichment-checklist"
      locale={locale}
      onReset={() => setChecked(labels.items.map(() => false))}
    >
      <div className="mb-7 flex items-end justify-between gap-6 border-b border-zinc-800 pb-5 print:border-zinc-300">
        <div>
          <p className="text-sm font-medium text-zinc-200 print:text-zinc-900">{labels.progress}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {completed} / {checked.length}
          </p>
        </div>
        <output className="text-4xl font-medium tracking-tight text-white print:text-zinc-950">
          {percentage}%
        </output>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {labels.items.map((item, index) => (
          <label
            key={item}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm leading-6 text-zinc-300 transition-colors has-checked:border-emerald-500/30 has-checked:bg-emerald-500/[0.05] print:border-zinc-300 print:bg-white print:text-zinc-900"
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
              className="mt-1 size-4 accent-emerald-400"
            />
            {item}
          </label>
        ))}
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
      onReset={() => setInputs({ team: 3, hours: 8, cost: 40, reduction: 60 })}
    >
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-4">
          {fields.map((field) => (
            <label key={field.key} className="grid gap-2 text-sm font-medium text-zinc-200 print:text-zinc-900">
              {field.label}
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
                className="rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2.5 text-base font-normal text-white focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 print:border-zinc-300 print:bg-white print:text-zinc-950"
              />
            </label>
          ))}
        </div>
        <dl className="grid content-start gap-0 border-y border-zinc-700 print:border-zinc-300">
          {[
            [labels.monthlyCost, currency.format(results.monthlyCost)],
            [labels.recoveredHours, `${Math.round(results.recoveredHours)}h`],
            [labels.recoverableValue, currency.format(results.recoverableValue)],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-2 border-b border-zinc-800 py-5 last:border-b-0 print:border-zinc-300">
              <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
              <dd className="text-3xl font-medium tracking-tight text-white print:text-zinc-950">{value}</dd>
            </div>
          ))}
        </dl>
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
    <div className="rounded-xl border border-zinc-800 p-6 text-sm text-zinc-400">
      <Check className="mb-3 size-5 text-emerald-400" aria-hidden="true" />
      Tool unavailable.
    </div>
  )
}
