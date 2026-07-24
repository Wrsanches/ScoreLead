import type { BlogLocale, BlogPost, BlogTranslation, BlogUi } from "./types"
import { englishPosts } from "./posts-en"
import { portuguesePosts } from "./posts-pt"
import { spanishPosts } from "./posts-es"

const postDetails = [
  {
    slug: "ai-lead-generation-guide",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 8,
    accent: "emerald",
    quickAnswers: {
      en: "AI lead generation works best as a controlled workflow: define a narrow market, collect verifiable company evidence, score fit transparently, review the result, and feed real sales outcomes back into the next search.",
      pt: "A geração de leads com IA funciona melhor como um fluxo controlado: defina um mercado restrito, colete evidências verificáveis, pontue o fit com transparência, revise o resultado e use os resultados comerciais na próxima busca.",
      es: "La generación de leads con IA funciona mejor como un flujo controlado: define un mercado estrecho, recopila evidencia verificable, puntúa el ajuste de forma transparente, revisa el resultado y usa los resultados comerciales en la siguiente búsqueda.",
    },
    fieldNotes: {
      en: "In ScoreLead, discovery, enrichment, scoring, and outreach are separate, reviewable stages. The account workspace keeps company context beside the score so a team can inspect why a record was included before using it.",
      pt: "No ScoreLead, descoberta, enriquecimento, pontuação e outreach são etapas separadas e revisáveis. O workspace mantém o contexto da empresa junto ao score para que o time entenda por que uma conta foi incluída antes de usá-la.",
      es: "En ScoreLead, descubrimiento, enriquecimiento, puntuación y outreach son etapas separadas y revisables. El workspace mantiene el contexto de la empresa junto al score para que el equipo entienda por qué se incluyó una cuenta antes de usarla.",
    },
    relatedMarketingPath: "features/ai-lead-discovery",
  },
  {
    slug: "b2b-lead-scoring-model",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 9,
    accent: "cyan",
    quickAnswers: {
      en: "A trusted B2B lead score separates profile fit from readiness, uses signals the sales team can explain, treats hard requirements as gates, and is recalibrated against accepted, rejected, and won accounts.",
      pt: "Um lead score B2B confiável separa fit de prontidão, usa sinais explicáveis, trata requisitos obrigatórios como filtros e é recalibrado com contas aceitas, rejeitadas e ganhas.",
      es: "Un lead score B2B confiable separa ajuste y preparación, usa señales explicables, trata los requisitos como filtros y se recalibra con cuentas aceptadas, rechazadas y ganadas.",
    },
    fieldNotes: {
      en: "ScoreLead exposes reach, trust, fit, engagement, and readiness separately instead of presenting only an unexplained total. The score supports prioritization; changing an account’s pipeline status remains a reviewable team decision.",
      pt: "O ScoreLead mostra alcance, confiança, fit, engajamento e prontidão separadamente, em vez de exibir apenas um total sem explicação. O score ajuda a priorizar; mudar o status da conta continua sendo uma decisão revisável do time.",
      es: "ScoreLead muestra alcance, confianza, ajuste, engagement y preparación por separado, en lugar de presentar solo un total sin explicación. El score ayuda a priorizar; cambiar el estado de la cuenta sigue siendo una decisión revisable del equipo.",
    },
    relatedMarketingPath: "features/lead-scoring",
  },
  {
    slug: "ideal-customer-profile-guide",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 8,
    accent: "violet",
    quickAnswers: {
      en: "An actionable ICP describes company-level conditions tied to customer value, separates required criteria from preferences and disqualifiers, and changes only when pipeline evidence challenges the current assumptions.",
      pt: "Um ICP acionável descreve condições da empresa ligadas ao valor, separa requisitos de preferências e desqualificadores e muda quando evidências do pipeline desafiam as premissas.",
      es: "Un ICP accionable describe condiciones de la empresa ligadas al valor, separa requisitos, preferencias y descalificadores y cambia cuando la evidencia del pipeline cuestiona los supuestos.",
    },
    fieldNotes: {
      en: "A ScoreLead discovery run starts from observable market, region, and business criteria. Teams can compare the accounts they accept, reject, or convert with those original assumptions before changing the next search.",
      pt: "Uma busca no ScoreLead começa com critérios observáveis de mercado, região e negócio. O time pode comparar as contas aceitas, rejeitadas ou convertidas com essas premissas antes de alterar a próxima busca.",
      es: "Una búsqueda en ScoreLead comienza con criterios observables de mercado, región y negocio. El equipo puede comparar las cuentas aceptadas, rechazadas o convertidas con esas premisas antes de cambiar la siguiente búsqueda.",
    },
    relatedMarketingPath: "tools/icp-worksheet",
  },
  {
    slug: "lead-enrichment-guide",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 7,
    accent: "amber",
    quickAnswers: {
      en: "Useful enrichment adds only the identity, fit, problem, reachability, and personalization context needed for a decision, while preserving the source, observation date, confidence, and unknown values.",
      pt: "Enriquecimento útil adiciona apenas o contexto de identidade, fit, problema, contato e personalização necessário para decidir, preservando fonte, data, confiança e valores desconhecidos.",
      es: "El enriquecimiento útil añade solo el contexto de identidad, ajuste, problema, contacto y personalización necesario para decidir, conservando fuente, fecha, confianza y valores desconocidos.",
    },
    fieldNotes: {
      en: "ScoreLead keeps the discovered website, public business context, and scoring evidence together on the company record. That makes gaps visible and lets a representative verify important details before using them in outreach.",
      pt: "O ScoreLead mantém o site descoberto, o contexto público da empresa e as evidências de pontuação no mesmo registro. Assim, lacunas ficam visíveis e o representante pode verificar detalhes importantes antes do outreach.",
      es: "ScoreLead mantiene el sitio descubierto, el contexto público de la empresa y la evidencia de puntuación en el mismo registro. Así, las carencias quedan visibles y el representante puede verificar detalles antes del outreach.",
    },
    relatedMarketingPath: "features/lead-enrichment",
  },
  {
    slug: "sales-prospecting-automation",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 9,
    accent: "rose",
    quickAnswers: {
      en: "Automate repetitive discovery, normalization, deduplication, and first-pass prioritization; keep people responsible for target definition, evidence review, strategic-account research, message approval, and compliance.",
      pt: "Automatize descoberta repetitiva, normalização, deduplicação e primeira priorização; mantenha pessoas responsáveis pelo alvo, revisão, contas estratégicas, aprovação de mensagens e conformidade.",
      es: "Automatiza descubrimiento repetitivo, normalización, duplicados y primera priorización; mantén a las personas responsables del objetivo, revisión, cuentas estratégicas, aprobación y cumplimiento.",
    },
    fieldNotes: {
      en: "ScoreLead runs discovery as a trackable job and prepares enriched, scored accounts before outreach is drafted. Generated messages remain visible for human review rather than becoming an invisible automatic decision.",
      pt: "O ScoreLead executa a descoberta como um job acompanhável e prepara contas enriquecidas e pontuadas antes de criar o outreach. As mensagens geradas permanecem visíveis para revisão humana.",
      es: "ScoreLead ejecuta el descubrimiento como un job rastreable y prepara cuentas enriquecidas y puntuadas antes de redactar el outreach. Los mensajes generados permanecen visibles para revisión humana.",
    },
    relatedMarketingPath: "compare/manual-lead-research",
  },
  {
    slug: "personalized-b2b-outreach",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 8,
    accent: "emerald",
    quickAnswers: {
      en: "Good B2B personalization connects a verified company observation to a relevant problem and credible value hypothesis. It avoids invented familiarity, empty compliments, and unsupported claims.",
      pt: "Boa personalização B2B conecta uma observação verificada a um problema relevante e uma hipótese de valor crível. Evita familiaridade inventada, elogios vazios e afirmações sem suporte.",
      es: "La buena personalización B2B conecta una observación verificada con un problema relevante y una hipótesis de valor creíble. Evita familiaridad inventada y afirmaciones sin soporte.",
    },
    fieldNotes: {
      en: "ScoreLead generates outreach from the company details already gathered in the account workspace and exposes each message before use. The team remains responsible for verifying the evidence, recipient, channel, and final wording.",
      pt: "O ScoreLead gera outreach a partir dos detalhes já reunidos no workspace da conta e mostra cada mensagem antes do uso. O time continua responsável por verificar evidências, destinatário, canal e texto final.",
      es: "ScoreLead genera outreach a partir de los datos reunidos en el workspace de la cuenta y muestra cada mensaje antes de usarlo. El equipo sigue siendo responsable de verificar evidencia, destinatario, canal y texto final.",
    },
    relatedMarketingPath: "features/outreach-automation",
  },
  {
    slug: "manual-lead-research-vs-automation",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 7,
    accent: "cyan",
    quickAnswers: {
      en: "Manual research provides depth and flexibility; automation provides repeatability and throughput. Most B2B teams need a hybrid model that automates collection and triage while preserving human exception handling.",
      pt: "Pesquisa manual oferece profundidade e flexibilidade; automação oferece repetibilidade e volume. A maioria dos times precisa de um modelo híbrido com coleta automatizada e exceções humanas.",
      es: "La investigación manual ofrece profundidad y flexibilidad; la automatización ofrece repetibilidad y volumen. La mayoría de los equipos necesita un modelo híbrido.",
    },
    fieldNotes: {
      en: "ScoreLead still supports CSV export, but company discovery, identity matching, enrichment, scoring, and pipeline status happen before the data leaves the workspace. Teams can automate the repetitive layer without giving up review or portability.",
      pt: "O ScoreLead continua permitindo exportação CSV, mas descoberta, verificação de identidade, enriquecimento, pontuação e status acontecem antes de os dados saírem do workspace. O time automatiza a parte repetitiva sem abrir mão de revisão ou portabilidade.",
      es: "ScoreLead mantiene la exportación CSV, pero el descubrimiento, la identidad, el enriquecimiento, la puntuación y el estado ocurren antes de que los datos salgan del workspace. El equipo automatiza lo repetitivo sin perder revisión ni portabilidad.",
    },
    relatedMarketingPath: "compare/manual-lead-research",
  },
  {
    slug: "b2b-sales-pipeline-guide",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 10,
    accent: "violet",
    quickAnswers: {
      en: "A useful B2B pipeline gives each stage a completed-work definition, a clear next action, visible account evidence, and outcome feedback that improves targeting rather than merely reporting activity.",
      pt: "Um pipeline B2B útil define o trabalho concluído e a próxima ação de cada etapa, mantém evidências visíveis e usa resultados para melhorar o targeting.",
      es: "Un pipeline B2B útil define el trabajo terminado y la siguiente acción de cada etapa, mantiene evidencia visible y usa resultados para mejorar el targeting.",
    },
    fieldNotes: {
      en: "ScoreLead keeps new, contacted, interested, and customer stages next to the account record. That lets a team review pipeline movement with the discovery and scoring context still available.",
      pt: "O ScoreLead mantém as etapas novo, contatado, interessado e cliente junto ao registro da conta. Assim, o time revisa o avanço no pipeline com o contexto de descoberta e pontuação ainda disponível.",
      es: "ScoreLead mantiene las etapas nuevo, contactado, interesado y cliente junto al registro de la cuenta. Así, el equipo revisa el avance con el contexto de descubrimiento y puntuación todavía disponible.",
    },
    relatedMarketingPath: "features/sales-pipeline",
  },
  {
    slug: "crm-data-quality-guide",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 8,
    accent: "amber",
    quickAnswers: {
      en: "CRM data quality starts before import: confirm identity, normalize without losing source text, retain provenance and freshness, label uncertainty, detect duplicates, and define ownership for future updates.",
      pt: "Qualidade de dados no CRM começa antes da importação: confirme identidade, normalize sem perder a fonte, preserve procedência e atualidade, marque incerteza, detecte duplicidades e defina responsabilidade.",
      es: "La calidad de datos del CRM empieza antes de importar: confirma identidad, normaliza sin perder la fuente, conserva procedencia y fecha, marca incertidumbre y detecta duplicados.",
    },
    fieldNotes: {
      en: "ScoreLead compares company identity signals such as names, websites, and locations before records move through the workflow. The cleaned account context can then be exported instead of asking a CRM to repair an unreviewed raw list.",
      pt: "O ScoreLead compara sinais de identidade como nome, site e localização antes de os registros avançarem. O contexto revisado pode então ser exportado, sem depender do CRM para corrigir uma lista bruta.",
      es: "ScoreLead compara señales de identidad como nombre, sitio y ubicación antes de que los registros avancen. El contexto revisado puede exportarse sin depender del CRM para reparar una lista sin revisar.",
    },
    relatedMarketingPath: "tools/enrichment-checklist",
  },
  {
    slug: "multilingual-b2b-prospecting",
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-24",
    readingMinutes: 9,
    accent: "rose",
    quickAnswers: {
      en: "Multilingual prospecting requires more than translation: preserve the account evidence, adapt value and call-to-action conventions to the market, review locally sensitive wording, and measure outcomes separately by language.",
      pt: "Prospecção multilíngue exige mais que tradução: preserve evidências, adapte valor e chamada para ação ao mercado, revise linguagem sensível e meça resultados por idioma.",
      es: "La prospección multilingüe exige más que traducir: conserva evidencia, adapta valor y llamada a la acción al mercado, revisa lenguaje sensible y mide resultados por idioma.",
    },
    fieldNotes: {
      en: "ScoreLead publishes its product guidance in English, Portuguese, and Spanish and can prepare outreach in those working languages. Account evidence stays separate from the translated draft so a reviewer can check meaning against the source context.",
      pt: "O ScoreLead publica orientações em inglês, português e espanhol e pode preparar outreach nesses idiomas. As evidências da conta ficam separadas do texto traduzido para que o revisor confira o sentido com o contexto original.",
      es: "ScoreLead publica sus guías en inglés, portugués y español y puede preparar outreach en esos idiomas. La evidencia de la cuenta queda separada del texto traducido para que el revisor compruebe el sentido con el contexto original.",
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
      title: "Lead Scoring: How to Find the Best Prospects in 4 Steps",
      publisher: "Salesforce",
      url: "https://www.salesforce.com/blog/sales/lead-scoring/",
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
    reviewerName: "ScoreLead product team",
    backToBlog: "Back to the blog",
    quickAnswer: "The short answer",
    fieldNote: "First-party product note",
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
    reviewerName: "Equipe de produto do ScoreLead",
    backToBlog: "Voltar ao blog",
    quickAnswer: "Resposta curta",
    fieldNote: "Nota de produto em primeira mão",
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
    reviewerName: "Equipo de producto de ScoreLead",
    backToBlog: "Volver al blog",
    quickAnswer: "Respuesta corta",
    fieldNote: "Nota de producto de primera mano",
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
