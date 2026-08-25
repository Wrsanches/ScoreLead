import type { MarketingLocale } from "./types"
import { normalizeLocale } from "@/lib/seo"

/**
 * Localized strings for the dedicated pricing page plan cards.
 * Quota values mirror PLAN_LIMITS in lib/plan.ts (not imported to keep the
 * marketing bundle free of db modules) - update both together.
 */

/** Keys must match the entitlement tiers in lib/plan.ts. */
export type PricingPlanId = "free" | "starter" | "growth" | "pro"

export const PRICING_PLAN_IDS: PricingPlanId[] = [
  "free",
  "starter",
  "growth",
  "pro",
]

export type PricingCell = {
  value: string
  note?: string
  /** De-emphasize the value (feature absent on this tier). */
  muted?: boolean
}

export type PricingRow = {
  label: string
  values: Record<PricingPlanId, PricingCell>
}

export type PricingPlanCopy = {
  id: PricingPlanId
  name: string
  price: string
  cadence: string
  /** Small print under the price - e.g. what the paid trial converts to. */
  priceNote?: string
  tagline: string
  cta: string
  badge?: string
}

export type PricingUi = {
  plansHeading: string
  plans: PricingPlanCopy[]
  rows: PricingRow[]
  freeMeterNote: string
  paidMeterNote: string
  noCreditCard: string
}

/** Shorthand for building the per-tier cells of a comparison row. */
function cells(
  free: string | PricingCell,
  starter: string | PricingCell,
  growth: string | PricingCell,
  pro: string | PricingCell,
): Record<PricingPlanId, PricingCell> {
  const norm = (v: string | PricingCell): PricingCell =>
    typeof v === "string" ? { value: v } : v
  return {
    free: norm(free),
    starter: norm(starter),
    growth: norm(growth),
    pro: norm(pro),
  }
}

export const pricingUi: Record<MarketingLocale, PricingUi> = {
  en: {
    plansHeading: "Plans",
    plans: [
      {
        id: "free",
        name: "Free",
        price: "$0",
        cadence: "per month",
        tagline:
          "Run the core workflow once against a real market: one discovery run with scored, enriched leads.",
        cta: "Start free",
      },
      {
        id: "starter",
        name: "Starter",
        price: "$2.95",
        cadence: "for 7 days",
        priceNote: "Then $19.95/month. Cancel anytime.",
        tagline:
          "For the solo operator working one business: find leads, score them, write the outreach, export the list.",
        cta: "Start for $2.95",
        badge: "Best way in",
      },
      {
        id: "growth",
        name: "Growth",
        price: "$29.95",
        cadence: "per month",
        tagline:
          "For actually reaching those leads: WhatsApp sequences, contact enrichment, the AI content calendar, and three businesses.",
        cta: "Choose Growth",
        badge: "Most popular",
      },
      {
        id: "pro",
        name: "Pro",
        price: "$59.95",
        cadence: "per month",
        tagline:
          "Agency scale: unlimited prospecting across every business you manage, plus named decision-maker contacts.",
        cta: "Choose Pro",
      },
    ],
    rows: [
      { label: "Businesses", values: cells("1", "1", "3", "Unlimited") },
      {
        label: "Discovery runs",
        values: cells("1", "10 / month", "30 / month", "Unlimited"),
      },
      {
        label: "Leads per run",
        values: cells("Up to 10", "Up to 25", "Up to 50", "No cap"),
      },
      {
        label: "Lead scoring & web enrichment",
        values: cells("Included", "Included", "Included", "Included"),
      },
      {
        label: "AI outreach copy",
        values: cells("3", "50 / month", "200 / month", "Unlimited"),
      },
      {
        label: "CSV export",
        values: cells(
          { value: "Not included", muted: true },
          "Included",
          "Included",
          "Included",
        ),
      },
      {
        label: "Continue a run (deeper paging)",
        values: cells(
          { value: "Not included", muted: true },
          { value: "Not included", muted: true },
          "Included",
          "Included",
        ),
      },
      {
        label: "AI content calendar",
        values: cells(
          { value: "Not included", muted: true },
          { value: "Not included", muted: true },
          { value: "6 plans / month", note: "Instagram posts + captions" },
          "Unlimited",
        ),
      },
      {
        label: "AI images",
        values: cells(
          { value: "Not included", muted: true },
          { value: "Not included", muted: true },
          { value: "15 / month", note: "Up to 5 per day" },
          { value: "30 / month", note: "Up to 10 per day" },
        ),
      },
      {
        label: "WhatsApp automation",
        values: cells(
          { value: "Not included", muted: true },
          { value: "Not included", muted: true },
          "Included",
          "Included",
        ),
      },
      {
        label: "Contact enrichment",
        values: cells(
          { value: "Not included", muted: true },
          { value: "Not included", muted: true },
          { value: "150 / month", note: "Top 10 leads per run" },
          { value: "500 / month", note: "Top 10 leads per run" },
        ),
      },
      {
        label: "Decision-maker contacts",
        values: cells(
          { value: "Not included", muted: true },
          { value: "Not included", muted: true },
          { value: "Not included", muted: true },
          "Included",
        ),
      },
    ],
    freeMeterNote:
      "Free limits are one-time totals for evaluation, not monthly allowances.",
    paidMeterNote: "Paid allowances reset every month.",
    noCreditCard: "No credit card required.",
  },
  pt: {
    plansHeading: "Planos",
    plans: [
      {
        id: "free",
        name: "Free",
        price: "US$ 0",
        cadence: "por mês",
        tagline:
          "Rode o fluxo principal uma vez com um mercado real: uma descoberta com leads pontuados e enriquecidos.",
        cta: "Começar grátis",
      },
      {
        id: "starter",
        name: "Starter",
        price: "US$ 2,95",
        cadence: "por 7 dias",
        priceNote: "Depois US$ 19,95/mês. Cancele quando quiser.",
        tagline:
          "Para quem cuida de um negócio sozinho: encontre leads, pontue, escreva a abordagem e exporte a lista.",
        cta: "Começar por US$ 2,95",
        badge: "Melhor entrada",
      },
      {
        id: "growth",
        name: "Growth",
        price: "US$ 29,95",
        cadence: "por mês",
        tagline:
          "Para realmente alcançar esses leads: sequências de WhatsApp, enriquecimento de contatos, calendário de conteúdo com IA e três negócios.",
        cta: "Escolher Growth",
        badge: "Mais popular",
      },
      {
        id: "pro",
        name: "Pro",
        price: "US$ 59,95",
        cadence: "por mês",
        tagline:
          "Escala de agência: prospecção sem limites em todos os negócios que você gerencia, com contatos de decisores.",
        cta: "Escolher Pro",
      },
    ],
    rows: [
      { label: "Negócios", values: cells("1", "1", "3", "Sem limite") },
      {
        label: "Descobertas",
        values: cells("1", "10 / mês", "30 / mês", "Sem limite"),
      },
      {
        label: "Leads por descoberta",
        values: cells("Até 10", "Até 25", "Até 50", "Sem teto"),
      },
      {
        label: "Pontuação e enriquecimento web",
        values: cells("Incluído", "Incluído", "Incluído", "Incluído"),
      },
      {
        label: "Textos de outreach com IA",
        values: cells("3", "50 / mês", "200 / mês", "Sem limite"),
      },
      {
        label: "Exportação CSV",
        values: cells(
          { value: "Não incluído", muted: true },
          "Incluído",
          "Incluído",
          "Incluído",
        ),
      },
      {
        label: "Continuar uma descoberta",
        values: cells(
          { value: "Não incluído", muted: true },
          { value: "Não incluído", muted: true },
          "Incluído",
          "Incluído",
        ),
      },
      {
        label: "Calendário de conteúdo com IA",
        values: cells(
          { value: "Não incluído", muted: true },
          { value: "Não incluído", muted: true },
          { value: "6 planos / mês", note: "Posts do Instagram + legendas" },
          "Sem limite",
        ),
      },
      {
        label: "Imagens com IA",
        values: cells(
          { value: "Não incluído", muted: true },
          { value: "Não incluído", muted: true },
          { value: "15 / mês", note: "Até 5 por dia" },
          { value: "30 / mês", note: "Até 10 por dia" },
        ),
      },
      {
        label: "Automação de WhatsApp",
        values: cells(
          { value: "Não incluído", muted: true },
          { value: "Não incluído", muted: true },
          "Incluído",
          "Incluído",
        ),
      },
      {
        label: "Enriquecimento de contatos",
        values: cells(
          { value: "Não incluído", muted: true },
          { value: "Não incluído", muted: true },
          { value: "150 / mês", note: "Top 10 leads por descoberta" },
          { value: "500 / mês", note: "Top 10 leads por descoberta" },
        ),
      },
      {
        label: "Contatos de decisores",
        values: cells(
          { value: "Não incluído", muted: true },
          { value: "Não incluído", muted: true },
          { value: "Não incluído", muted: true },
          "Incluído",
        ),
      },
    ],
    freeMeterNote:
      "Os limites do Free são totais únicos para avaliação, não cotas mensais.",
    paidMeterNote: "As cotas dos planos pagos renovam todo mês.",
    noCreditCard: "Sem cartão de crédito.",
  },
  es: {
    plansHeading: "Planes",
    plans: [
      {
        id: "free",
        name: "Free",
        price: "US$ 0",
        cadence: "al mes",
        tagline:
          "Ejecuta el flujo principal una vez con un mercado real: un descubrimiento con leads puntuados y enriquecidos.",
        cta: "Empezar gratis",
      },
      {
        id: "starter",
        name: "Starter",
        price: "US$ 2,95",
        cadence: "por 7 días",
        priceNote: "Después US$ 19,95/mes. Cancela cuando quieras.",
        tagline:
          "Para quien gestiona un solo negocio: encuentra leads, puntúalos, escribe el mensaje y exporta la lista.",
        cta: "Empezar por US$ 2,95",
        badge: "La mejor entrada",
      },
      {
        id: "growth",
        name: "Growth",
        price: "US$ 29,95",
        cadence: "al mes",
        tagline:
          "Para alcanzar de verdad esos leads: secuencias de WhatsApp, enriquecimiento de contactos, calendario de contenido con IA y tres negocios.",
        cta: "Elegir Growth",
        badge: "Más popular",
      },
      {
        id: "pro",
        name: "Pro",
        price: "US$ 59,95",
        cadence: "al mes",
        tagline:
          "Escala de agencia: prospección sin límites en todos los negocios que gestionas, con contactos de decisores.",
        cta: "Elegir Pro",
      },
    ],
    rows: [
      { label: "Negocios", values: cells("1", "1", "3", "Sin límite") },
      {
        label: "Descubrimientos",
        values: cells("1", "10 / mes", "30 / mes", "Sin límite"),
      },
      {
        label: "Leads por descubrimiento",
        values: cells("Hasta 10", "Hasta 25", "Hasta 50", "Sin tope"),
      },
      {
        label: "Puntuación y enriquecimiento web",
        values: cells("Incluido", "Incluido", "Incluido", "Incluido"),
      },
      {
        label: "Textos de outreach con IA",
        values: cells("3", "50 / mes", "200 / mes", "Sin límite"),
      },
      {
        label: "Exportación CSV",
        values: cells(
          { value: "No incluido", muted: true },
          "Incluido",
          "Incluido",
          "Incluido",
        ),
      },
      {
        label: "Continuar un descubrimiento",
        values: cells(
          { value: "No incluido", muted: true },
          { value: "No incluido", muted: true },
          "Incluido",
          "Incluido",
        ),
      },
      {
        label: "Calendario de contenido con IA",
        values: cells(
          { value: "No incluido", muted: true },
          { value: "No incluido", muted: true },
          { value: "6 planes / mes", note: "Posts de Instagram + textos" },
          "Sin límite",
        ),
      },
      {
        label: "Imágenes con IA",
        values: cells(
          { value: "No incluido", muted: true },
          { value: "No incluido", muted: true },
          { value: "15 / mes", note: "Hasta 5 por día" },
          { value: "30 / mes", note: "Hasta 10 por día" },
        ),
      },
      {
        label: "Automatización de WhatsApp",
        values: cells(
          { value: "No incluido", muted: true },
          { value: "No incluido", muted: true },
          "Incluido",
          "Incluido",
        ),
      },
      {
        label: "Enriquecimiento de contactos",
        values: cells(
          { value: "No incluido", muted: true },
          { value: "No incluido", muted: true },
          { value: "150 / mes", note: "Top 10 leads por descubrimiento" },
          { value: "500 / mes", note: "Top 10 leads por descubrimiento" },
        ),
      },
      {
        label: "Contactos de decisores",
        values: cells(
          { value: "No incluido", muted: true },
          { value: "No incluido", muted: true },
          { value: "No incluido", muted: true },
          "Incluido",
        ),
      },
    ],
    freeMeterNote:
      "Los límites de Free son totales únicos para evaluar, no cupos mensuales.",
    paidMeterNote: "Los cupos de los planes pagos se renuevan cada mes.",
    noCreditCard: "Sin tarjeta de crédito.",
  },
}

export function getPricingUi(locale: string): PricingUi {
  return pricingUi[normalizeLocale(locale)]
}
