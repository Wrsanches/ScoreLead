import type { MarketingLocale } from "./types"

// Capability facts come from the linked vendor pages. Fit and evaluation
// questions are ScoreLead's editorial assessment, not a hands-on benchmark.
export const comparisonSources = [
  { title: "Apollo enrichment", url: "https://www.apollo.io/product/enrich" },
  { title: "Apollo lead scoring", url: "https://www.apollo.io/product/lead-scoring-software" },
  { title: "Apollo pricing", url: "https://www.apollo.io/pricing" },
  { title: "Clay pricing and capabilities", url: "https://www.clay.com/pricing" },
  { title: "HubSpot lead scoring", url: "https://www.hubspot.com/products/marketing/lead-scoring" },
] as const

const copy = {
  en: {
    title: "Compare the workflows",
    description: "ScoreLead editorial comparison, reviewed September 21, 2026. Capabilities are based on vendor documentation; suitability is our assessment. This is not a hands-on performance benchmark. Check current plans and test the same sample of accounts before buying.",
    columns: ["Product", "Workflow and capabilities", "Pricing basis", "What to evaluate"],
    sources: "Sources", scroll: "Scroll to compare all columns",
    apollo: ["Database-led prospecting, CRM/CSV enrichment and customizable lead scores.", "Subscriptions with seats, credits and plan limits.", "Test contact coverage, credit consumption and score explainability for your market."],
    clay: ["Multi-provider enrichment waterfalls and research workflows with Claygent.", "Actions for platform work; Data Credits for enrichment. Bringing your own key still uses Actions.", "Test provider coverage, workflow setup effort and total usage cost. Check CRM sync availability."],
    hubspot: ["CRM-based fit and engagement scoring with negative points and score decay.", "Lead scoring is included in eligible paid HubSpot products; limits vary by subscription.", "Check your Hub, scoring limits and the quality of the CRM and engagement data you can supply."],
    scorelead: ["Discover companies from an ICP, enrich public business signals and review account scores in one pipeline.", "Free and paid plans with discovery and usage limits; see current pricing.", "Test local-business coverage and the evidence behind each score. Validate contact availability before outreach."],
  },
  pt: {
    title: "Compare os fluxos de trabalho",
    description: "Comparação editorial da ScoreLead, revisada em 21 de setembro de 2026. Recursos baseados na documentação dos fornecedores; adequação é nossa avaliação. Não é um teste prático de desempenho. Confira os planos atuais e teste a mesma amostra de contas antes de comprar.",
    columns: ["Produto", "Fluxo e recursos", "Base de cobrança", "O que avaliar"],
    sources: "Fontes", scroll: "Role para comparar todas as colunas",
    apollo: ["Prospecção por base de contatos, enriquecimento de CRM/CSV e pontuações personalizáveis.", "Assinaturas com assentos, créditos e limites por plano.", "Teste cobertura de contatos, consumo de créditos e explicação dos scores no seu mercado."],
    clay: ["Enriquecimento com múltiplos fornecedores em cascata e pesquisa com Claygent.", "Actions para operações; Data Credits para enriquecimento. Usar sua própria chave ainda consome Actions.", "Teste cobertura, esforço de configuração e custo total. Confira a disponibilidade da sincronização com CRM."],
    hubspot: ["Pontuação de fit e engajamento no CRM, com pontos negativos e redução por tempo.", "Lead scoring nos produtos pagos elegíveis da HubSpot; limites variam por assinatura.", "Confira seu Hub, limites de pontuação e qualidade dos dados de CRM e engajamento disponíveis."],
    scorelead: ["Descubra empresas por ICP, enriqueça sinais públicos e revise pontuações em um único pipeline.", "Planos grátis e pagos com limites de descoberta e uso; consulte os preços atuais.", "Teste cobertura de negócios locais e evidências dos scores. Valide os contatos antes da abordagem."],
  },
  es: {
    title: "Compara los flujos de trabajo",
    description: "Comparación editorial de ScoreLead, revisada el 21 de septiembre de 2026. Funciones basadas en documentación de los proveedores; la adecuación es nuestra valoración. No es una prueba práctica de rendimiento. Consulta los planes actuales y prueba la misma muestra de cuentas antes de comprar.",
    columns: ["Producto", "Flujo y funciones", "Base de facturación", "Qué evaluar"],
    sources: "Fuentes", scroll: "Desplázate para comparar todas las columnas",
    apollo: ["Prospección en bases de contactos, enriquecimiento de CRM/CSV y puntuaciones personalizables.", "Suscripciones con usuarios, créditos y límites por plan.", "Prueba la cobertura de contactos, consumo de créditos y explicación de los scores en tu mercado."],
    clay: ["Enriquecimiento en cascada con varios proveedores e investigación con Claygent.", "Actions para operaciones; Data Credits para enriquecimiento. Usar tu propia clave sigue consumiendo Actions.", "Prueba cobertura, esfuerzo de configuración y coste total. Comprueba la disponibilidad de sincronización con CRM."],
    hubspot: ["Puntuación de ajuste e interacción en el CRM, con puntos negativos y reducción por tiempo.", "Lead scoring en productos de pago elegibles de HubSpot; los límites dependen de la suscripción.", "Comprueba tu Hub, límites y calidad de los datos de CRM e interacción disponibles."],
    scorelead: ["Descubre empresas por ICP, enriquece señales públicas y revisa puntuaciones en un único pipeline.", "Planes gratuitos y de pago con límites de descubrimiento y uso; consulta los precios actuales.", "Prueba cobertura de negocios locales y evidencias de los scores. Valida los contactos antes de contactar."],
  },
} as const

export function getComparison(pageId: string, locale: MarketingLocale) {
  if (!pageId.startsWith("compare-")) return null
  const text = copy[locale]
  const apolloSources = [comparisonSources[0], comparisonSources[1], comparisonSources[2]]
  return {
    ...text,
    rows: [
      { name: "Apollo", cells: text.apollo, sources: apolloSources },
      ...(pageId === "compare-best-lead-scoring-software"
        ? [{ name: "HubSpot", cells: text.hubspot, sources: [comparisonSources[4]] }]
        : [{ name: "Clay", cells: text.clay, sources: [comparisonSources[3]] }]),
      { name: "ScoreLead", cells: text.scorelead, sources: [{ title: "ScoreLead", url: "/pricing" }] },
    ],
  }
}
