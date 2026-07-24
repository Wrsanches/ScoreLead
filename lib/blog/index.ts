import type { BlogLocale, BlogPost, BlogTranslation, BlogUi } from "./types"
import { englishPosts } from "./posts-en"
import { portuguesePosts } from "./posts-pt"
import { spanishPosts } from "./posts-es"

const postDetails = [
  {
    slug: "ai-lead-generation-guide",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-23",
    readingMinutes: 8,
    accent: "emerald",
    quickAnswers: {
      en: "AI lead generation works best as a controlled workflow: define a narrow market, collect verifiable company evidence, score fit transparently, review the result, and feed real sales outcomes back into the next search.",
      pt: "A geração de leads com IA funciona melhor como um fluxo controlado: defina um mercado restrito, colete evidências verificáveis, pontue o fit com transparência, revise o resultado e use os resultados comerciais na próxima busca.",
      es: "La generación de leads con IA funciona mejor como un flujo controlado: define un mercado estrecho, recopila evidencia verificable, puntúa el ajuste de forma transparente, revisa el resultado y usa los resultados comerciales en la siguiente búsqueda.",
    },
    relatedMarketingPath: "features/ai-lead-discovery",
  },
  {
    slug: "b2b-lead-scoring-model",
    publishedAt: "2026-07-22",
    updatedAt: "2026-07-22",
    readingMinutes: 9,
    accent: "cyan",
    quickAnswers: {
      en: "A trusted B2B lead score separates profile fit from readiness, uses signals the sales team can explain, treats hard requirements as gates, and is recalibrated against accepted, rejected, and won accounts.",
      pt: "Um lead score B2B confiável separa fit de prontidão, usa sinais explicáveis, trata requisitos obrigatórios como filtros e é recalibrado com contas aceitas, rejeitadas e ganhas.",
      es: "Un lead score B2B confiable separa ajuste y preparación, usa señales explicables, trata los requisitos como filtros y se recalibra con cuentas aceptadas, rechazadas y ganadas.",
    },
    relatedMarketingPath: "features/lead-scoring",
  },
  {
    slug: "ideal-customer-profile-guide",
    publishedAt: "2026-07-21",
    updatedAt: "2026-07-21",
    readingMinutes: 8,
    accent: "violet",
    quickAnswers: {
      en: "An actionable ICP describes company-level conditions tied to customer value, separates required criteria from preferences and disqualifiers, and changes only when pipeline evidence challenges the current assumptions.",
      pt: "Um ICP acionável descreve condições da empresa ligadas ao valor, separa requisitos de preferências e desqualificadores e muda quando evidências do pipeline desafiam as premissas.",
      es: "Un ICP accionable describe condiciones de la empresa ligadas al valor, separa requisitos, preferencias y descalificadores y cambia cuando la evidencia del pipeline cuestiona los supuestos.",
    },
    relatedMarketingPath: "tools/icp-worksheet",
  },
  {
    slug: "lead-enrichment-guide",
    publishedAt: "2026-07-20",
    updatedAt: "2026-07-20",
    readingMinutes: 7,
    accent: "amber",
    quickAnswers: {
      en: "Useful enrichment adds only the identity, fit, problem, reachability, and personalization context needed for a decision, while preserving the source, observation date, confidence, and unknown values.",
      pt: "Enriquecimento útil adiciona apenas o contexto de identidade, fit, problema, contato e personalização necessário para decidir, preservando fonte, data, confiança e valores desconhecidos.",
      es: "El enriquecimiento útil añade solo el contexto de identidad, ajuste, problema, contacto y personalización necesario para decidir, conservando fuente, fecha, confianza y valores desconocidos.",
    },
    relatedMarketingPath: "features/lead-enrichment",
  },
  {
    slug: "sales-prospecting-automation",
    publishedAt: "2026-07-19",
    updatedAt: "2026-07-19",
    readingMinutes: 9,
    accent: "rose",
    quickAnswers: {
      en: "Automate repetitive discovery, normalization, deduplication, and first-pass prioritization; keep people responsible for target definition, evidence review, strategic-account research, message approval, and compliance.",
      pt: "Automatize descoberta repetitiva, normalização, deduplicação e primeira priorização; mantenha pessoas responsáveis pelo alvo, revisão, contas estratégicas, aprovação de mensagens e conformidade.",
      es: "Automatiza descubrimiento repetitivo, normalización, duplicados y primera priorización; mantén a las personas responsables del objetivo, revisión, cuentas estratégicas, aprobación y cumplimiento.",
    },
    relatedMarketingPath: "compare/manual-lead-research",
  },
  {
    slug: "personalized-b2b-outreach",
    publishedAt: "2026-07-18",
    updatedAt: "2026-07-18",
    readingMinutes: 8,
    accent: "emerald",
    quickAnswers: {
      en: "Good B2B personalization connects a verified company observation to a relevant problem and credible value hypothesis. It avoids invented familiarity, empty compliments, and unsupported claims.",
      pt: "Boa personalização B2B conecta uma observação verificada a um problema relevante e uma hipótese de valor crível. Evita familiaridade inventada, elogios vazios e afirmações sem suporte.",
      es: "La buena personalización B2B conecta una observación verificada con un problema relevante y una hipótesis de valor creíble. Evita familiaridad inventada y afirmaciones sin soporte.",
    },
    relatedMarketingPath: "features/outreach-automation",
  },
  {
    slug: "manual-lead-research-vs-automation",
    publishedAt: "2026-07-17",
    updatedAt: "2026-07-17",
    readingMinutes: 7,
    accent: "cyan",
    quickAnswers: {
      en: "Manual research provides depth and flexibility; automation provides repeatability and throughput. Most B2B teams need a hybrid model that automates collection and triage while preserving human exception handling.",
      pt: "Pesquisa manual oferece profundidade e flexibilidade; automação oferece repetibilidade e volume. A maioria dos times precisa de um modelo híbrido com coleta automatizada e exceções humanas.",
      es: "La investigación manual ofrece profundidad y flexibilidad; la automatización ofrece repetibilidad y volumen. La mayoría de los equipos necesita un modelo híbrido.",
    },
    relatedMarketingPath: "compare/manual-lead-research",
  },
  {
    slug: "b2b-sales-pipeline-guide",
    publishedAt: "2026-07-16",
    updatedAt: "2026-07-16",
    readingMinutes: 10,
    accent: "violet",
    quickAnswers: {
      en: "A useful B2B pipeline gives each stage a completed-work definition, a clear next action, visible account evidence, and outcome feedback that improves targeting rather than merely reporting activity.",
      pt: "Um pipeline B2B útil define o trabalho concluído e a próxima ação de cada etapa, mantém evidências visíveis e usa resultados para melhorar o targeting.",
      es: "Un pipeline B2B útil define el trabajo terminado y la siguiente acción de cada etapa, mantiene evidencia visible y usa resultados para mejorar el targeting.",
    },
    relatedMarketingPath: "features/sales-pipeline",
  },
  {
    slug: "crm-data-quality-guide",
    publishedAt: "2026-07-15",
    updatedAt: "2026-07-15",
    readingMinutes: 8,
    accent: "amber",
    quickAnswers: {
      en: "CRM data quality starts before import: confirm identity, normalize without losing source text, retain provenance and freshness, label uncertainty, detect duplicates, and define ownership for future updates.",
      pt: "Qualidade de dados no CRM começa antes da importação: confirme identidade, normalize sem perder a fonte, preserve procedência e atualidade, marque incerteza, detecte duplicidades e defina responsabilidade.",
      es: "La calidad de datos del CRM empieza antes de importar: confirma identidad, normaliza sin perder la fuente, conserva procedencia y fecha, marca incertidumbre y detecta duplicados.",
    },
    relatedMarketingPath: "tools/enrichment-checklist",
  },
  {
    slug: "multilingual-b2b-prospecting",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
    readingMinutes: 9,
    accent: "rose",
    quickAnswers: {
      en: "Multilingual prospecting requires more than translation: preserve the account evidence, adapt value and call-to-action conventions to the market, review locally sensitive wording, and measure outcomes separately by language.",
      pt: "Prospecção multilíngue exige mais que tradução: preserve evidências, adapte valor e chamada para ação ao mercado, revise linguagem sensível e meça resultados por idioma.",
      es: "La prospección multilingüe exige más que traducir: conserva evidencia, adapta valor y llamada a la acción al mercado, revisa lenguaje sensible y mide resultados por idioma.",
    },
    relatedMarketingPath: "features/outreach-automation",
  },
] as const

const sourcesBySlug = {
  "ai-lead-generation-guide": [
    {
      title: "Artificial Intelligence Risk Management Framework",
      publisher: "NIST",
      url: "https://www.nist.gov/itl/ai-risk-management-framework",
    },
    {
      title: "CAN-SPAM Act: A Compliance Guide for Business",
      publisher: "U.S. Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business",
    },
  ],
  "b2b-lead-scoring-model": [
    {
      title: "Artificial Intelligence Risk Management Framework",
      publisher: "NIST",
      url: "https://www.nist.gov/itl/ai-risk-management-framework",
    },
    {
      title: "Lead Scoring",
      publisher: "Salesforce",
      url: "https://www.salesforce.com/sales/lead-generation/lead-scoring/",
    },
  ],
  "ideal-customer-profile-guide": [
    {
      title: "Market research and competitive analysis",
      publisher: "U.S. Small Business Administration",
      url: "https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis",
    },
    {
      title: "North American Industry Classification System",
      publisher: "U.S. Census Bureau",
      url: "https://www.census.gov/naics/",
    },
  ],
  "lead-enrichment-guide": [
    {
      title: "PROV-O: The PROV Ontology",
      publisher: "W3C",
      url: "https://www.w3.org/TR/prov-o/",
    },
    {
      title: "Principles relating to processing of personal data",
      publisher: "EUR-Lex",
      url: "https://eur-lex.europa.eu/eli/reg/2016/679/art_5/oj",
    },
  ],
  "sales-prospecting-automation": [
    {
      title: "Artificial Intelligence Risk Management Framework",
      publisher: "NIST",
      url: "https://www.nist.gov/itl/ai-risk-management-framework",
    },
    {
      title: "Direct marketing guidance",
      publisher: "UK Information Commissioner's Office",
      url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/",
    },
  ],
  "personalized-b2b-outreach": [
    {
      title: "CAN-SPAM Act: A Compliance Guide for Business",
      publisher: "U.S. Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business",
    },
    {
      title: "Direct marketing guidance",
      publisher: "UK Information Commissioner's Office",
      url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/",
    },
  ],
  "manual-lead-research-vs-automation": [
    {
      title: "Artificial Intelligence Risk Management Framework",
      publisher: "NIST",
      url: "https://www.nist.gov/itl/ai-risk-management-framework",
    },
    {
      title: "PROV-O: The PROV Ontology",
      publisher: "W3C",
      url: "https://www.w3.org/TR/prov-o/",
    },
  ],
  "b2b-sales-pipeline-guide": [
    {
      title: "What is a sales pipeline?",
      publisher: "Salesforce",
      url: "https://www.salesforce.com/sales/pipeline/",
    },
    {
      title: "Market research and competitive analysis",
      publisher: "U.S. Small Business Administration",
      url: "https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis",
    },
  ],
  "crm-data-quality-guide": [
    {
      title: "PROV-O: The PROV Ontology",
      publisher: "W3C",
      url: "https://www.w3.org/TR/prov-o/",
    },
    {
      title: "Principles relating to processing of personal data",
      publisher: "EUR-Lex",
      url: "https://eur-lex.europa.eu/eli/reg/2016/679/art_5/oj",
    },
  ],
  "multilingual-b2b-prospecting": [
    {
      title: "Direct marketing guidance",
      publisher: "UK Information Commissioner's Office",
      url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/",
    },
    {
      title: "Unicode Common Locale Data Repository",
      publisher: "Unicode Consortium",
      url: "https://cldr.unicode.org/",
    },
  ],
} as const

const translations: Record<BlogLocale, Record<string, BlogTranslation>> = {
  en: englishPosts,
  pt: portuguesePosts,
  es: spanishPosts,
}

export const blogUi: Record<BlogLocale, BlogUi> = {
  en: {
    metadataTitle: "B2B Lead Generation Blog",
    metadataDescription:
      "Practical guides to AI lead generation, lead scoring, sales prospecting, enrichment, and personalized B2B outreach.",
    eyebrow: "ScoreLead field notes",
    title: "Build a sharper B2B pipeline",
    description:
      "Practical, product-minded guides for finding the right accounts, qualifying them with evidence, and starting better sales conversations.",
    featured: "Featured guide",
    latest: "Latest playbooks",
    readArticle: "Read article",
    minRead: "min read",
    published: "Published",
    updated: "Updated",
    authoredBy: "By",
    reviewedBy: "Reviewed by",
    backToBlog: "Back to the blog",
    quickAnswer: "The short answer",
    decisionTable: "Decision framework",
    decision: "Decision",
    whatToCheck: "What to check",
    practicalChecklist: "Practical checklist",
    sources: "Sources and further reading",
    sourcesDescription: "Primary and first-party references used to review this guide.",
    productGuide: "Explore the related ScoreLead workflow",
    editorialPolicy: "Editorial policy and methodology",
    takeaway: "ScoreLead takeaway",
    relatedTitle: "Keep building your pipeline",
    relatedDescription: "More practical guides from the ScoreLead team.",
    ctaEyebrow: "Put the playbook to work",
    ctaTitle: "Turn your target market into a qualified pipeline.",
    ctaDescription:
      "ScoreLead finds companies, enriches their account data, scores fit, and prepares personalized outreach in one workflow.",
    ctaLabel: "Start free",
  },
  pt: {
    metadataTitle: "Blog de Geração de Leads B2B",
    metadataDescription:
      "Guias práticos sobre geração de leads com IA, lead scoring, prospecção, enriquecimento e outreach B2B personalizado.",
    eyebrow: "Notas de campo do ScoreLead",
    title: "Construa um pipeline B2B mais preciso",
    description:
      "Guias práticos e orientados a produto para encontrar as contas certas, qualificá-las com evidências e iniciar conversas comerciais melhores.",
    featured: "Guia em destaque",
    latest: "Playbooks recentes",
    readArticle: "Ler artigo",
    minRead: "min de leitura",
    published: "Publicado em",
    updated: "Atualizado em",
    authoredBy: "Por",
    reviewedBy: "Revisado por",
    backToBlog: "Voltar ao blog",
    quickAnswer: "Resposta curta",
    decisionTable: "Estrutura de decisão",
    decision: "Decisão",
    whatToCheck: "O que verificar",
    practicalChecklist: "Checklist prático",
    sources: "Fontes e leituras adicionais",
    sourcesDescription: "Referências primárias e de primeira parte usadas na revisão deste guia.",
    productGuide: "Explorar o fluxo relacionado no ScoreLead",
    editorialPolicy: "Política editorial e metodologia",
    takeaway: "Resumo ScoreLead",
    relatedTitle: "Continue construindo seu pipeline",
    relatedDescription: "Mais guias práticos da equipe ScoreLead.",
    ctaEyebrow: "Coloque o playbook em prática",
    ctaTitle: "Transforme seu mercado-alvo em pipeline qualificado.",
    ctaDescription:
      "O ScoreLead encontra empresas, enriquece dados de conta, pontua o fit e prepara outreach personalizado em um único fluxo.",
    ctaLabel: "Começar grátis",
  },
  es: {
    metadataTitle: "Blog de Generación de Leads B2B",
    metadataDescription:
      "Guías prácticas sobre generación de leads con IA, lead scoring, prospección, enriquecimiento y outreach B2B personalizado.",
    eyebrow: "Notas de campo de ScoreLead",
    title: "Construye un pipeline B2B más preciso",
    description:
      "Guías prácticas y orientadas al producto para encontrar las cuentas correctas, calificarlas con evidencia e iniciar mejores conversaciones comerciales.",
    featured: "Guía destacada",
    latest: "Playbooks recientes",
    readArticle: "Leer artículo",
    minRead: "min de lectura",
    published: "Publicado",
    updated: "Actualizado",
    authoredBy: "Por",
    reviewedBy: "Revisado por",
    backToBlog: "Volver al blog",
    quickAnswer: "Respuesta corta",
    decisionTable: "Marco de decisión",
    decision: "Decisión",
    whatToCheck: "Qué comprobar",
    practicalChecklist: "Checklist práctico",
    sources: "Fuentes y lecturas adicionales",
    sourcesDescription: "Referencias primarias y de primera parte usadas para revisar esta guía.",
    productGuide: "Explorar el flujo relacionado en ScoreLead",
    editorialPolicy: "Política editorial y metodología",
    takeaway: "Conclusión de ScoreLead",
    relatedTitle: "Sigue construyendo tu pipeline",
    relatedDescription: "Más guías prácticas del equipo de ScoreLead.",
    ctaEyebrow: "Pon el playbook en práctica",
    ctaTitle: "Convierte tu mercado objetivo en un pipeline calificado.",
    ctaDescription:
      "ScoreLead encuentra empresas, enriquece sus datos de cuenta, puntúa el ajuste y prepara outreach personalizado en un solo flujo.",
    ctaLabel: "Empezar gratis",
  },
}

export const blogPosts: BlogPost[] = postDetails.map((post) => ({
  ...post,
  sources: [...sourcesBySlug[post.slug]],
  translations: {
    en: translations.en[post.slug],
    pt: translations.pt[post.slug],
    es: translations.es[post.slug],
  },
}))

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

export function getBlogTranslation(post: BlogPost, locale: string) {
  const normalizedLocale: BlogLocale =
    locale === "pt" || locale === "es" ? locale : "en"
  return post.translations[normalizedLocale]
}

export function getBlogUi(locale: string) {
  const normalizedLocale: BlogLocale =
    locale === "pt" || locale === "es" ? locale : "en"
  return blogUi[normalizedLocale]
}

export type { BlogLocale, BlogPost, BlogTranslation }
