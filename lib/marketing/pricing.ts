import type { MarketingLocale } from "./types"
import { normalizeLocale } from "@/lib/seo"

/**
 * Localized strings for the dedicated pricing page plan cards.
 * Quota values mirror PLAN_LIMITS in lib/plan.ts (not imported to keep the
 * marketing bundle free of db modules) - update both together.
 */

export type PricingRow = {
  label: string
  free: string
  pro: string
  proNote?: string
  /** De-emphasize the free value (feature absent on Free). */
  mutedFree?: boolean
}

export type PricingPlanCopy = {
  name: string
  price: string
  cadence: string
  tagline: string
  cta: string
  badge?: string
}

export type PricingUi = {
  plansHeading: string
  free: PricingPlanCopy
  pro: PricingPlanCopy
  rows: PricingRow[]
  freeMeterNote: string
  noCreditCard: string
}

export const pricingUi: Record<MarketingLocale, PricingUi> = {
  en: {
    plansHeading: "Plans",
    free: {
      name: "Free",
      price: "$0",
      cadence: "per month",
      tagline:
        "Run the core workflow once with a real market: one discovery run, one content plan, one AI image.",
      cta: "Start free",
    },
    pro: {
      name: "Pro",
      price: "$49",
      cadence: "per month",
      tagline:
        "Unlimited prospecting across every business you manage, with fair-use caps on the most expensive AI operations.",
      cta: "Upgrade to Pro",
      badge: "Full capacity",
    },
    rows: [
      { label: "Businesses", free: "1", pro: "Unlimited" },
      { label: "Discovery runs", free: "1", pro: "Unlimited" },
      { label: "Leads per run", free: "Up to 10", pro: "No cap" },
      { label: "AI outreach messages", free: "3", pro: "Unlimited" },
      { label: "Content plans", free: "1", pro: "Unlimited" },
      {
        label: "AI images",
        free: "1",
        pro: "30 / month",
        proNote: "Up to 10 per day",
      },
      {
        label: "Contact enrichment",
        free: "Not included",
        pro: "500 / month",
        proNote: "Top 10 leads per run",
        mutedFree: true,
      },
    ],
    freeMeterNote:
      "Free limits are one-time totals for evaluation, not monthly allowances.",
    noCreditCard: "No credit card required.",
  },
  pt: {
    plansHeading: "Planos",
    free: {
      name: "Free",
      price: "US$ 0",
      cadence: "por mês",
      tagline:
        "Rode o fluxo principal uma vez com um mercado real: uma descoberta, um plano de conteúdo, uma imagem com IA.",
      cta: "Começar grátis",
    },
    pro: {
      name: "Pro",
      price: "US$ 49",
      cadence: "por mês",
      tagline:
        "Prospecção sem limites em todos os negócios que você gerencia, com uso justo nas operações de IA mais caras.",
      cta: "Fazer upgrade para o Pro",
      badge: "Capacidade total",
    },
    rows: [
      { label: "Negócios", free: "1", pro: "Sem limite" },
      { label: "Descobertas", free: "1", pro: "Sem limite" },
      { label: "Leads por descoberta", free: "Até 10", pro: "Sem teto" },
      { label: "Mensagens de outreach", free: "3", pro: "Sem limite" },
      { label: "Planos de conteúdo", free: "1", pro: "Sem limite" },
      {
        label: "Imagens com IA",
        free: "1",
        pro: "30 / mês",
        proNote: "Até 10 por dia",
      },
      {
        label: "Enriquecimento de contatos",
        free: "Não incluído",
        pro: "500 / mês",
        proNote: "Top 10 leads por descoberta",
        mutedFree: true,
      },
    ],
    freeMeterNote:
      "Os limites do Free são totais únicos para avaliação, não cotas mensais.",
    noCreditCard: "Sem cartão de crédito.",
  },
  es: {
    plansHeading: "Planes",
    free: {
      name: "Free",
      price: "US$ 0",
      cadence: "al mes",
      tagline:
        "Ejecuta el flujo principal una vez con un mercado real: un descubrimiento, un plan de contenido, una imagen con IA.",
      cta: "Empezar gratis",
    },
    pro: {
      name: "Pro",
      price: "US$ 49",
      cadence: "al mes",
      tagline:
        "Prospección sin límites en todos los negocios que gestionas, con uso justo en las operaciones de IA más costosas.",
      cta: "Pasar a Pro",
      badge: "Capacidad total",
    },
    rows: [
      { label: "Negocios", free: "1", pro: "Sin límite" },
      { label: "Descubrimientos", free: "1", pro: "Sin límite" },
      { label: "Leads por descubrimiento", free: "Hasta 10", pro: "Sin tope" },
      { label: "Mensajes de outreach", free: "3", pro: "Sin límite" },
      { label: "Planes de contenido", free: "1", pro: "Sin límite" },
      {
        label: "Imágenes con IA",
        free: "1",
        pro: "30 / mes",
        proNote: "Hasta 10 por día",
      },
      {
        label: "Enriquecimiento de contactos",
        free: "No incluido",
        pro: "500 / mes",
        proNote: "Top 10 leads por descubrimiento",
        mutedFree: true,
      },
    ],
    freeMeterNote:
      "Los límites de Free son totales únicos para evaluar, no cupos mensuales.",
    noCreditCard: "Sin tarjeta de crédito.",
  },
}

export function getPricingUi(locale: string): PricingUi {
  return pricingUi[normalizeLocale(locale)]
}
