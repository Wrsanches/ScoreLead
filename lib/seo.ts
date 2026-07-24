import type { Metadata, Viewport } from "next"

const verifiedSocialProfiles = [
  process.env.NEXT_PUBLIC_SCORELEAD_X_URL,
].filter((value): value is string => Boolean(value?.startsWith("https://")))

export const siteConfig = {
  name: "ScoreLead",
  url: "https://scorelead.io",
  email: "hello@scorelead.io",
  creator: "ScoreLead",
  authors: [
    {
      name: "ScoreLead Editorial",
      url: "https://scorelead.io/authors/scorelead-editorial",
    },
  ],
  sameAs: verifiedSocialProfiles,
}

export const localeConfig = {
  en: {
    path: "",
    hrefLang: "en",
    htmlLang: "en",
    ogLocale: "en_US",
    languageName: "English",
    ogImage: "og-image-en.png",
  },
  pt: {
    path: "/pt",
    hrefLang: "pt-BR",
    htmlLang: "pt-BR",
    ogLocale: "pt_BR",
    languageName: "Portuguese",
    ogImage: "og-image-pt.png",
  },
  es: {
    path: "/es",
    hrefLang: "es",
    htmlLang: "es",
    ogLocale: "es_ES",
    languageName: "Spanish",
    ogImage: "og-image-es.png",
  },
} as const

export type SupportedLocale = keyof typeof localeConfig

export const supportedLocales = Object.keys(localeConfig) as SupportedLocale[]

type LocaleMetadata = {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  ogImageAlt: string
  jsonLdDescription: string
  audience: string
  signupAction: string
  featureList: string[]
}

const localeMetadata: Record<SupportedLocale, LocaleMetadata> = {
  en: {
    title: "AI Lead Generation Software for B2B Sales | ScoreLead",
    description:
      "Find, score, enrich, and contact B2B company leads with AI. ScoreLead turns target markets into qualified accounts, CRM-ready data, and personalized outreach.",
    keywords: [
      "AI lead generation software",
      "B2B lead generation software",
      "lead discovery software",
      "lead scoring software",
      "sales prospecting tool",
      "sales intelligence software",
      "AI sales automation",
      "business lead finder",
      "lead enrichment software",
      "automated outreach software",
      "qualified B2B leads",
      "B2B company leads",
      "prospect scoring",
      "pipeline generation",
      "CRM-ready leads",
      "B2B account discovery",
      "multi-language sales outreach",
    ],
    ogTitle: "Find and qualify B2B leads with AI",
    ogDescription:
      "ScoreLead discovers companies by market, enriches them with account data, scores sales fit, and drafts personalized outreach so B2B teams can build pipeline faster.",
    ogImageAlt: "ScoreLead AI lead discovery and scoring dashboard",
    jsonLdDescription:
      "ScoreLead is AI lead generation software for B2B companies, sales teams, and agencies. It discovers companies, enriches account records, scores prospects, and generates personalized outreach.",
    audience: "B2B companies, sales teams, agencies, and growth operators",
    signupAction: "Start free with ScoreLead",
    featureList: [
      "AI-powered company discovery by target market and region",
      "Lead enrichment from websites, maps, and public web sources",
      "Lead scoring across reach, trust, fit, engagement, and readiness",
      "Personalized multi-step outreach generation",
      "Pipeline tracking from discovery to conversion",
      "CSV export and duplicate lead detection",
      "Multi-language outreach in English, Portuguese, and Spanish",
    ],
  },
  pt: {
    title: "Software de Geracao de Leads com IA | ScoreLead",
    description:
      "Encontre, pontue, enriqueça e aborde leads de empresas B2B com IA. ScoreLead transforma mercados-alvo em contas qualificadas, dados prontos para CRM e mensagens personalizadas.",
    keywords: [
      "software de geracao de leads com IA",
      "geracao de leads B2B",
      "descoberta de leads",
      "pontuacao de leads",
      "prospeccao de vendas",
      "inteligencia de vendas",
      "automacao de vendas com IA",
      "enriquecimento de leads",
      "outreach automatizado",
      "leads B2B qualificados",
      "leads de empresas B2B",
      "pontuacao de prospects",
      "geracao de pipeline",
      "leads prontos para CRM",
      "descoberta de contas B2B",
      "outreach multi-idioma",
    ],
    ogTitle: "Encontre e qualifique leads B2B com IA",
    ogDescription:
      "ScoreLead descobre empresas por mercado, enriquece dados de conta, pontua fit comercial e cria outreach personalizado para acelerar pipeline B2B.",
    ogImageAlt: "Painel do ScoreLead para descoberta e pontuacao de leads com IA",
    jsonLdDescription:
      "ScoreLead e um software de geracao de leads com IA para empresas B2B, times de vendas e agencias. Descobre empresas, enriquece registros de conta, pontua prospects e gera outreach personalizado.",
    audience: "Empresas B2B, times de vendas, agencias e operadores de crescimento",
    signupAction: "Comecar gratis com ScoreLead",
    featureList: [
      "Descoberta de empresas com IA por mercado-alvo e regiao",
      "Enriquecimento de leads a partir de sites, mapas e fontes publicas da web",
      "Pontuacao por alcance, confianca, fit, engajamento e prontidao",
      "Geracao de sequencias de outreach personalizadas",
      "Pipeline da descoberta ate a conversao",
      "Exportacao CSV e deteccao de leads duplicados",
      "Outreach multi-idioma em ingles, portugues e espanhol",
    ],
  },
  es: {
    title: "Software de Generacion de Leads con IA | ScoreLead",
    description:
      "Encuentra, puntua, enriquece y contacta leads de empresas B2B con IA. ScoreLead convierte mercados objetivo en cuentas calificadas, datos listos para CRM y outreach personalizado.",
    keywords: [
      "software de generacion de leads con IA",
      "generacion de leads B2B",
      "descubrimiento de leads",
      "puntuacion de leads",
      "prospeccion de ventas",
      "inteligencia de ventas",
      "automatizacion de ventas con IA",
      "enriquecimiento de leads",
      "outreach automatizado",
      "leads B2B calificados",
      "leads de empresas B2B",
      "puntuacion de prospectos",
      "generacion de pipeline",
      "leads listos para CRM",
      "descubrimiento de cuentas B2B",
      "outreach multi-idioma",
    ],
    ogTitle: "Encuentra y califica leads B2B con IA",
    ogDescription:
      "ScoreLead descubre empresas por mercado, enriquece datos de cuenta, puntua el fit comercial y redacta outreach personalizado para acelerar tu pipeline B2B.",
    ogImageAlt: "Panel de ScoreLead para descubrimiento y puntuacion de leads con IA",
    jsonLdDescription:
      "ScoreLead es software de generacion de leads con IA para empresas B2B, equipos de ventas y agencias. Descubre empresas, enriquece registros de cuenta, puntua prospectos y genera outreach personalizado.",
    audience: "Empresas B2B, equipos de ventas, agencias y operadores de crecimiento",
    signupAction: "Empezar gratis con ScoreLead",
    featureList: [
      "Descubrimiento de empresas con IA por mercado objetivo y region",
      "Enriquecimiento de leads desde sitios web, mapas y fuentes publicas",
      "Puntuacion por alcance, confianza, fit, engagement y disposicion",
      "Generacion de secuencias de outreach personalizadas",
      "Pipeline desde descubrimiento hasta conversion",
      "Exportacion CSV y deteccion de leads duplicados",
      "Outreach multi-idioma en ingles, portugues y espanol",
    ],
  },
}

// ── Per-page metadata ──────────────────────────────────────
// Titles for the app's non-landing routes. These are all noindex pages, so
// the title is for browser tabs, bookmarks, history, and screen readers; it
// is suffixed with "| ScoreLead" by the title template in the locale layout.
// Descriptions are only worth setting on the public auth pages (login/signup/
// password flows), which an unauthenticated visitor or link preview may hit.

export type PageKey =
  | "contact"
  | "privacy"
  | "terms"
  | "dataDeletion"
  | "login"
  | "signup"
  | "forgotPassword"
  | "resetPassword"
  | "onboarding"
  | "dashboard"
  | "leads"
  | "leadsKanban"
  | "discovery"
  | "contentCalendar"
  | "businessProfile"
  | "savedSearches"
  | "settings"

type PageCopy = { title: string; description?: string }

const pageMetadata: Record<SupportedLocale, Record<PageKey, PageCopy>> = {
  en: {
    contact: {
      title: "Contact us",
      description:
        "Contact ScoreLead about sales, product support, partnerships, or questions about AI-powered B2B lead generation.",
    },
    privacy: {
      title: "Privacy Policy",
      description:
        "Learn how ScoreLead collects, uses, shares, secures, and deletes account, lead, AI, billing, and WhatsApp Business data.",
    },
    terms: {
      title: "Terms of Service",
      description:
        "Read the terms governing ScoreLead accounts, subscriptions, lead data, AI output, outreach, and WhatsApp Business features.",
    },
    dataDeletion: {
      title: "Data deletion instructions",
      description:
        "Learn how to request deletion of your ScoreLead account or data associated with a connected Meta or WhatsApp account.",
    },
    login: {
      title: "Log in",
      description:
        "Sign in to your ScoreLead account to discover, score, and reach B2B leads with AI.",
    },
    signup: {
      title: "Create your account",
      description:
        "Start finding and scoring B2B leads with ScoreLead. Free to get started, no credit card required.",
    },
    forgotPassword: {
      title: "Reset your password",
      description:
        "Request a secure link to reset the password for your ScoreLead account.",
    },
    resetPassword: {
      title: "Choose a new password",
      description: "Set a new password for your ScoreLead account.",
    },
    onboarding: { title: "Set up your business" },
    dashboard: { title: "Dashboard" },
    leads: { title: "Leads" },
    leadsKanban: { title: "Lead board" },
    discovery: { title: "Lead discovery" },
    contentCalendar: { title: "Content calendar" },
    businessProfile: { title: "Business profile" },
    savedSearches: { title: "Saved searches" },
    settings: { title: "Settings" },
  },
  pt: {
    contact: {
      title: "Fale conosco",
      description:
        "Fale com o ScoreLead sobre vendas, suporte ao produto, parcerias ou geracao de leads B2B com IA.",
    },
    privacy: {
      title: "Política de Privacidade",
      description:
        "Saiba como o ScoreLead coleta, usa, compartilha, protege e exclui dados de conta, leads, IA, cobrança e WhatsApp Business.",
    },
    terms: {
      title: "Termos de Serviço",
      description:
        "Leia os termos aplicáveis a contas, assinaturas, dados de leads, resultados de IA, abordagem e WhatsApp Business no ScoreLead.",
    },
    dataDeletion: {
      title: "Instruções para exclusão de dados",
      description:
        "Saiba como solicitar a exclusão da conta ScoreLead ou de dados associados a uma conta Meta ou WhatsApp conectada.",
    },
    login: {
      title: "Entrar",
      description:
        "Acesse sua conta ScoreLead para descobrir, pontuar e contatar leads B2B com IA.",
    },
    signup: {
      title: "Crie sua conta",
      description:
        "Comece a encontrar e pontuar leads B2B com o ScoreLead. Gratuito para comecar, sem cartao de credito.",
    },
    forgotPassword: {
      title: "Redefinir sua senha",
      description:
        "Solicite um link seguro para redefinir a senha da sua conta ScoreLead.",
    },
    resetPassword: {
      title: "Escolha uma nova senha",
      description: "Defina uma nova senha para sua conta ScoreLead.",
    },
    onboarding: { title: "Configure seu negocio" },
    dashboard: { title: "Painel" },
    leads: { title: "Leads" },
    leadsKanban: { title: "Quadro de leads" },
    discovery: { title: "Descoberta de leads" },
    contentCalendar: { title: "Calendario de conteudo" },
    businessProfile: { title: "Perfil do negocio" },
    savedSearches: { title: "Buscas salvas" },
    settings: { title: "Configuracoes" },
  },
  es: {
    contact: {
      title: "Contáctanos",
      description:
        "Contacta con ScoreLead sobre ventas, soporte del producto, alianzas o generacion de leads B2B con IA.",
    },
    privacy: {
      title: "Política de Privacidad",
      description:
        "Conoce cómo ScoreLead recopila, usa, comparte, protege y elimina datos de cuenta, leads, IA, facturación y WhatsApp Business.",
    },
    terms: {
      title: "Términos de Servicio",
      description:
        "Lee los términos de cuentas, suscripciones, datos de leads, resultados de IA, contacto y WhatsApp Business en ScoreLead.",
    },
    dataDeletion: {
      title: "Instrucciones para eliminar datos",
      description:
        "Descubre cómo solicitar la eliminación de tu cuenta ScoreLead o de datos asociados a una cuenta de Meta o WhatsApp conectada.",
    },
    login: {
      title: "Iniciar sesion",
      description:
        "Accede a tu cuenta de ScoreLead para descubrir, puntuar y contactar leads B2B con IA.",
    },
    signup: {
      title: "Crea tu cuenta",
      description:
        "Empieza a encontrar y puntuar leads B2B con ScoreLead. Gratis para empezar, sin tarjeta de credito.",
    },
    forgotPassword: {
      title: "Restablecer tu contrasena",
      description:
        "Solicita un enlace seguro para restablecer la contrasena de tu cuenta ScoreLead.",
    },
    resetPassword: {
      title: "Elige una nueva contrasena",
      description: "Configura una nueva contrasena para tu cuenta ScoreLead.",
    },
    onboarding: { title: "Configura tu negocio" },
    dashboard: { title: "Panel" },
    leads: { title: "Leads" },
    leadsKanban: { title: "Tablero de leads" },
    discovery: { title: "Descubrimiento de leads" },
    contentCalendar: { title: "Calendario de contenido" },
    businessProfile: { title: "Perfil del negocio" },
    savedSearches: { title: "Busquedas guardadas" },
    settings: { title: "Configuracion" },
  },
}

/**
 * Metadata for a non-landing route. Defaults to noindex (these are app/auth
 * pages); pass { index: true } only for a page that should be crawlable.
 * The returned title is a bare segment - the locale layout's title template
 * appends "| ScoreLead".
 */
export function generatePageMetadata(
  locale: string,
  key: PageKey,
  opts?: { index?: boolean },
): Metadata {
  const copy = pageMetadata[normalizeLocale(locale)][key]

  return {
    title: copy.title,
    ...(copy.description ? { description: copy.description } : {}),
    robots: opts?.index ? undefined : { index: false, follow: false },
  }
}

export const siteViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090B",
}

export function getLanguageAlternates(pathname = "") {
  return {
    en: getLocalizedUrl("en", pathname),
    "pt-BR": getLocalizedUrl("pt", pathname),
    es: getLocalizedUrl("es", pathname),
    "x-default": getLocalizedUrl("en", pathname),
  }
}

export const languageAlternates = getLanguageAlternates()

export function normalizeLocale(locale: string): SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : "en"
}

export function getLocaleConfig(locale: string) {
  return localeConfig[normalizeLocale(locale)]
}

export function getLocalizedUrl(locale: string, pathname = "") {
  const config = getLocaleConfig(locale)
  const normalizedPath = pathname === "/" || pathname === "" ? "" : `/${pathname.replace(/^\/+/, "")}`

  return `${siteConfig.url}${config.path}${normalizedPath}`
}

export function getSiteMetadata(locale: string) {
  return localeMetadata[normalizeLocale(locale)]
}

function getOgImageUrl(locale: string) {
  return `${siteConfig.url}/images/${getLocaleConfig(locale).ogImage}`
}

function getAlternateOgLocales(locale: string) {
  const current = getLocaleConfig(locale).ogLocale

  return supportedLocales
    .map((supportedLocale) => localeConfig[supportedLocale].ogLocale)
    .filter((ogLocale) => ogLocale !== current)
}

export function generateSiteMetadata(locale: string): Metadata {
  const normalizedLocale = normalizeLocale(locale)
  const config = getLocaleConfig(normalizedLocale)
  const meta = getSiteMetadata(normalizedLocale)
  const canonicalUrl = getLocalizedUrl(normalizedLocale)
  const ogImageUrl = getOgImageUrl(normalizedLocale)

  return {
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    title: {
      default: meta.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: meta.description,
    keywords: meta.keywords,
    authors: [...siteConfig.authors],
    creator: siteConfig.creator,
    publisher: siteConfig.name,
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: "/manifest.json",
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    openGraph: {
      type: "website",
      locale: config.ogLocale,
      alternateLocale: getAlternateOgLocales(normalizedLocale),
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: meta.ogTitle,
      description: meta.ogDescription,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: meta.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.ogTitle,
      description: meta.ogDescription,
      images: [
        {
          url: ogImageUrl,
          alt: meta.ogImageAlt,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
        { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-icon.png",
    },
    appleWebApp: {
      capable: true,
      title: siteConfig.name,
      statusBarStyle: "black-translucent",
    },
    category: "technology",
    classification: "Business Software, Sales Software, Lead Generation Software",
  }
}

export function generateJsonLd(locale: string) {
  const normalizedLocale = normalizeLocale(locale)
  const config = getLocaleConfig(normalizedLocale)
  const meta = getSiteMetadata(normalizedLocale)
  const canonicalUrl = getLocalizedUrl(normalizedLocale)
  const signupUrl = getLocalizedUrl(normalizedLocale, "/signup")
  const ogImageUrl = getOgImageUrl(normalizedLocale)
  const organizationId = `${siteConfig.url}/#organization`
  const webSiteId = `${siteConfig.url}/#website`
  const softwareId = `${siteConfig.url}/#software`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        alternateName: "ScoreLead AI",
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.url}/images/scorelead-logo-512.png`,
          width: 512,
          height: 512,
        },
        image: `${siteConfig.url}/images/scorelead-logo-1024.png`,
        email: siteConfig.email,
        ...(siteConfig.sameAs.length ? { sameAs: siteConfig.sameAs } : {}),
        knowsAbout: [
          "B2B lead generation",
          "AI account discovery",
          "Lead scoring",
          "Lead enrichment",
          "Sales prospecting",
          "Sales outreach",
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: siteConfig.email,
            contactType: "sales",
            availableLanguage: supportedLocales.map((supportedLocale) => localeConfig[supportedLocale].languageName),
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": webSiteId,
        name: siteConfig.name,
        url: siteConfig.url,
        description: meta.jsonLdDescription,
        inLanguage: supportedLocales.map((supportedLocale) => localeConfig[supportedLocale].htmlLang),
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: config.htmlLang,
        isPartOf: {
          "@id": webSiteId,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
        about: {
          "@id": softwareId,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": softwareId,
        name: siteConfig.name,
        alternateName: "ScoreLead AI Lead Generation",
        url: canonicalUrl,
        image: ogImageUrl,
        screenshot: ogImageUrl,
        description: meta.jsonLdDescription,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Lead generation software",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript and a modern web browser",
        isAccessibleForFree: true,
        inLanguage: config.htmlLang,
        availableLanguage: supportedLocales.map((supportedLocale) => localeConfig[supportedLocale].languageName),
        creator: {
          "@id": organizationId,
        },
        publisher: {
          "@id": organizationId,
        },
        offers: {
          "@type": "Offer",
          name: "ScoreLead Free",
          url: signupUrl,
          price: 0,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description: "Free plan available; Pro plan starts at $49 per month.",
        },
        audience: {
          "@type": "BusinessAudience",
          audienceType: meta.audience,
        },
        featureList: meta.featureList,
        potentialAction: {
          "@type": "RegisterAction",
          name: meta.signupAction,
          target: signupUrl,
        },
      },
    ],
  }
}
