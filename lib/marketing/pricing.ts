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
  /** Four short bullets shown on the plan card. */
  perks: string[]
  cta: string
  badge?: string
}

export type PricingFaq = {
  question: string
  answer: string
}

export type PricingUi = {
  plansHeading: string
  plans: PricingPlanCopy[]
  rows: PricingRow[]
  freeMeterNote: string
  paidMeterNote: string
  noCreditCard: string
  compareHeading: string
  compareIntro: string
  includedLabel: string
  notIncludedLabel: string
  faqHeading: string
  faqIntro: string
  faq: PricingFaq[]
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
        perks: [
          "1 business",
          "1 discovery run, up to 10 leads",
          "Lead scoring and web enrichment",
          "3 AI outreach messages",
        ],
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
        perks: [
          "10 discovery runs per month",
          "Up to 25 leads per run",
          "50 AI outreach messages",
          "CSV export",
        ],
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
        perks: [
          "3 businesses, 30 runs per month",
          "WhatsApp automation",
          "Email outreach from your Resend account",
          "AI content calendar and images",
          "150 contact enrichments per month",
        ],
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
        perks: [
          "Unlimited businesses and runs",
          "Unlimited outreach and content",
          "500 contact enrichments per month",
          "Decision-maker contacts",
        ],
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
        label: "Email outreach (Resend)",
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
    compareHeading: "Compare plans",
    compareIntro: "Every plan includes lead scoring and web enrichment. The differences are volume and how far you take each lead.",
    includedLabel: "Included",
    notIncludedLabel: "Not included",
    faqHeading: "Questions about billing",
    faqIntro: "The short answers. Anything else, write to hello@scorelead.io.",
    faq: [
      {
        question: "How does the $2.95 Starter offer work?",
        answer:
          "You pay $2.95 for your first 7 days on Starter. After that it renews at $19.95 per month unless you cancel before the 7 days end. The offer applies once, on your first Starter purchase.",
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes. Cancel from Billing in your settings and you keep access until the end of the period you already paid for. There are no contracts or cancellation fees.",
      },
      {
        question: "What resets every month?",
        answer:
          "On paid plans, discovery runs, AI outreach messages, content plans, AI images, and contact enrichments reset on your billing date. Your businesses and every lead you already found stay where they are.",
      },
      {
        question: "What happens when I hit a limit?",
        answer:
          "ScoreLead tells you which limit you reached and which plan clears it. Nothing is deleted. You can upgrade on the spot or wait for the monthly reset.",
      },
      {
        question: "Is the Free plan really free?",
        answer:
          "Yes, and it needs no credit card. Its limits are one-time totals for evaluating the workflow: one business, one discovery run of up to 10 leads, and 3 AI outreach messages.",
      },
      {
        question: "Can I switch plans later?",
        answer:
          "Yes. Upgrades apply immediately. Downgrades take effect at the end of the current billing period, so you never lose time you already paid for.",
      },
      {
        question: "How are payments handled?",
        answer:
          "Checkout, invoices, and plan changes run through Stripe. ScoreLead never stores your card details.",
      },
    ],
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
        perks: [
          "1 negócio",
          "1 descoberta com até 10 leads",
          "Pontuação e enriquecimento web",
          "3 mensagens de outreach com IA",
        ],
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
        perks: [
          "10 descobertas por mês",
          "Até 25 leads por descoberta",
          "50 mensagens de outreach com IA",
          "Exportação CSV",
        ],
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
        perks: [
          "3 negócios, 30 descobertas por mês",
          "Automação de WhatsApp",
          "Envio de emails pela sua conta Resend",
          "Calendário de conteúdo e imagens com IA",
          "150 enriquecimentos de contato por mês",
        ],
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
        perks: [
          "Negócios e descobertas sem limite",
          "Outreach e conteúdo sem limite",
          "500 enriquecimentos de contato por mês",
          "Contatos de decisores",
        ],
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
        label: "Envio de emails (Resend)",
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
    compareHeading: "Compare os planos",
    compareIntro: "Todos os planos incluem pontuação de leads e enriquecimento web. A diferença está no volume e em até onde você leva cada lead.",
    includedLabel: "Incluído",
    notIncludedLabel: "Não incluído",
    faqHeading: "Dúvidas sobre cobrança",
    faqIntro: "As respostas curtas. Qualquer outra coisa, escreva para hello@scorelead.io.",
    faq: [
      {
        question: "Como funciona a oferta de US$ 2,95 do Starter?",
        answer:
          "Você paga US$ 2,95 pelos primeiros 7 dias no Starter. Depois disso, renova por US$ 19,95 por mês, a menos que você cancele antes do fim dos 7 dias. A oferta vale uma vez, na sua primeira compra do Starter.",
      },
      {
        question: "Posso cancelar quando quiser?",
        answer:
          "Sim. Cancele em Cobrança, nas configurações, e você mantém o acesso até o fim do período já pago. Não há contratos nem taxas de cancelamento.",
      },
      {
        question: "O que renova todo mês?",
        answer:
          "Nos planos pagos, descobertas, mensagens de outreach com IA, planos de conteúdo, imagens com IA e enriquecimentos de contato renovam na data da cobrança. Seus negócios e todos os leads já encontrados continuam onde estão.",
      },
      {
        question: "O que acontece quando atinjo um limite?",
        answer:
          "O ScoreLead mostra qual limite você atingiu e qual plano o libera. Nada é apagado. Você pode fazer upgrade na hora ou esperar a renovação mensal.",
      },
      {
        question: "O plano Free é realmente grátis?",
        answer:
          "Sim, e não pede cartão de crédito. Os limites são totais únicos para avaliar o fluxo: um negócio, uma descoberta com até 10 leads e 3 mensagens de outreach com IA.",
      },
      {
        question: "Posso trocar de plano depois?",
        answer:
          "Sim. Upgrades valem imediatamente. Downgrades entram em vigor no fim do período de cobrança atual, então você nunca perde o tempo que já pagou.",
      },
      {
        question: "Como os pagamentos são processados?",
        answer:
          "Checkout, faturas e mudanças de plano passam pelo Stripe. O ScoreLead nunca armazena os dados do seu cartão.",
      },
    ],
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
        perks: [
          "1 negocio",
          "1 descubrimiento con hasta 10 leads",
          "Puntuación y enriquecimiento web",
          "3 mensajes de outreach con IA",
        ],
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
        perks: [
          "10 descubrimientos al mes",
          "Hasta 25 leads por descubrimiento",
          "50 mensajes de outreach con IA",
          "Exportación CSV",
        ],
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
        perks: [
          "3 negocios, 30 descubrimientos al mes",
          "Automatización de WhatsApp",
          "Envío de emails desde tu cuenta de Resend",
          "Calendario de contenido e imágenes con IA",
          "150 enriquecimientos de contacto al mes",
        ],
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
        perks: [
          "Negocios y descubrimientos sin límite",
          "Outreach y contenido sin límite",
          "500 enriquecimientos de contacto al mes",
          "Contactos de decisores",
        ],
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
        label: "Envío de emails (Resend)",
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
    compareHeading: "Compara los planes",
    compareIntro: "Todos los planes incluyen puntuación de leads y enriquecimiento web. La diferencia está en el volumen y en hasta dónde llevas cada lead.",
    includedLabel: "Incluido",
    notIncludedLabel: "No incluido",
    faqHeading: "Preguntas sobre la facturación",
    faqIntro: "Las respuestas cortas. Para cualquier otra cosa, escribe a hello@scorelead.io.",
    faq: [
      {
        question: "¿Cómo funciona la oferta de US$ 2,95 de Starter?",
        answer:
          "Pagas US$ 2,95 por tus primeros 7 días en Starter. Después se renueva a US$ 19,95 al mes, salvo que canceles antes de que terminen los 7 días. La oferta aplica una vez, en tu primera compra de Starter.",
      },
      {
        question: "¿Puedo cancelar cuando quiera?",
        answer:
          "Sí. Cancela desde Facturación en tu configuración y conservas el acceso hasta el final del periodo ya pagado. No hay contratos ni cargos por cancelación.",
      },
      {
        question: "¿Qué se renueva cada mes?",
        answer:
          "En los planes pagos, los descubrimientos, los mensajes de outreach con IA, los planes de contenido, las imágenes con IA y los enriquecimientos de contacto se renuevan en tu fecha de facturación. Tus negocios y todos los leads que ya encontraste se quedan donde están.",
      },
      {
        question: "¿Qué pasa cuando llego a un límite?",
        answer:
          "ScoreLead te indica qué límite alcanzaste y qué plan lo libera. No se borra nada. Puedes mejorar el plan en el momento o esperar la renovación mensual.",
      },
      {
        question: "¿El plan Free es gratis de verdad?",
        answer:
          "Sí, y no pide tarjeta de crédito. Sus límites son totales únicos para evaluar el flujo: un negocio, un descubrimiento de hasta 10 leads y 3 mensajes de outreach con IA.",
      },
      {
        question: "¿Puedo cambiar de plan más adelante?",
        answer:
          "Sí. Las mejoras aplican de inmediato. Las bajas de plan entran en vigor al final del periodo de facturación actual, así que nunca pierdes el tiempo que ya pagaste.",
      },
      {
        question: "¿Cómo se procesan los pagos?",
        answer:
          "El pago, las facturas y los cambios de plan pasan por Stripe. ScoreLead nunca guarda los datos de tu tarjeta.",
      },
    ],
  },
}

export function getPricingUi(locale: string): PricingUi {
  return pricingUi[normalizeLocale(locale)]
}
