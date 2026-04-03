import type { Metadata } from "next"

const siteConfig = {
  name: "ScoreLead",
  url: "https://scorelead.io",
  email: "hello@scorelead.io",
  creator: "ScoreLead",
  authors: [{ name: "ScoreLead", url: "https://scorelead.io" }],
}

type LocaleMetadata = {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
}

const localeMetadata: Record<string, LocaleMetadata> = {
  en: {
    title: "ScoreLead - AI-Powered Lead Discovery & Scoring",
    description:
      "Discover, score, and convert B2B leads with AI. Automated business discovery, intelligent scoring across multiple dimensions, and personalized outreach at scale.",
    keywords: [
      "lead discovery",
      "lead scoring",
      "AI lead generation",
      "B2B lead generation",
      "sales pipeline",
      "lead enrichment",
      "automated outreach",
      "business discovery",
      "lead qualification",
      "sales automation",
      "AI sales tools",
      "prospect scoring",
      "lead management",
      "sales intelligence",
      "outreach automation",
    ],
    ogTitle: "ScoreLead - Discover, Score, and Convert Leads with AI",
    ogDescription:
      "AI-powered lead discovery and scoring platform. Find businesses, enrich with data, score their potential, and generate personalized outreach automatically.",
  },
  pt: {
    title: "ScoreLead - Descoberta e Pontuacao de Leads com IA",
    description:
      "Descubra, pontue e converta leads B2B com IA. Descoberta automatizada de negocios, pontuacao inteligente em multiplas dimensoes e outreach personalizado em escala.",
    keywords: [
      "descoberta de leads",
      "pontuacao de leads",
      "geracao de leads com IA",
      "geracao de leads B2B",
      "pipeline de vendas",
      "enriquecimento de leads",
      "outreach automatizado",
      "descoberta de negocios",
      "qualificacao de leads",
      "automacao de vendas",
      "ferramentas de vendas com IA",
      "pontuacao de prospects",
      "gestao de leads",
      "inteligencia de vendas",
      "automacao de outreach",
    ],
    ogTitle: "ScoreLead - Descubra, Pontue e Converta Leads com IA",
    ogDescription:
      "Plataforma de descoberta e pontuacao de leads com IA. Encontre negocios, enriqueca com dados, pontue seu potencial e gere outreach personalizado automaticamente.",
  },
  es: {
    title: "ScoreLead - Descubrimiento y Puntuacion de Leads con IA",
    description:
      "Descubre, puntua y convierte leads B2B con IA. Descubrimiento automatizado de negocios, puntuacion inteligente en multiples dimensiones y outreach personalizado a escala.",
    keywords: [
      "descubrimiento de leads",
      "puntuacion de leads",
      "generacion de leads con IA",
      "generacion de leads B2B",
      "pipeline de ventas",
      "enriquecimiento de leads",
      "outreach automatizado",
      "descubrimiento de negocios",
      "calificacion de leads",
      "automatizacion de ventas",
      "herramientas de ventas con IA",
      "puntuacion de prospectos",
      "gestion de leads",
      "inteligencia de ventas",
      "automatizacion de outreach",
    ],
    ogTitle: "ScoreLead - Descubre, Puntua y Convierte Leads con IA",
    ogDescription:
      "Plataforma de descubrimiento y puntuacion de leads con IA. Encuentra negocios, enriquece con datos, puntua su potencial y genera outreach personalizado automaticamente.",
  },
}

export function generateSiteMetadata(locale: string): Metadata {
  const meta = localeMetadata[locale] || localeMetadata.en
  const canonicalUrl = locale === "en" ? siteConfig.url : `${siteConfig.url}/${locale}`

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: meta.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: meta.description,
    keywords: meta.keywords,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: siteConfig.url,
        pt: `${siteConfig.url}/pt`,
        es: `${siteConfig.url}/es`,
        "x-default": siteConfig.url,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "pt" ? "pt_BR" : locale === "es" ? "es_ES" : "en_US",
      alternateLocale: ["en_US", "pt_BR", "es_ES"].filter(
        (l) => l !== (locale === "pt" ? "pt_BR" : locale === "es" ? "es_ES" : "en_US")
      ),
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: meta.ogTitle,
      description: meta.ogDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.ogTitle,
      description: meta.ogDescription,
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
    category: "technology",
    classification: "Business Software, Sales Software",
  }
}

export const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ScoreLead",
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/scorelead-logo-512.png`,
  email: siteConfig.email,
  contactPoint: {
    "@type": "ContactPoint",
    email: siteConfig.email,
    contactType: "customer support",
    availableLanguage: ["English", "Portuguese", "Spanish"],
  },
}

export const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ScoreLead",
  url: siteConfig.url,
}

export const jsonLdSoftwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ScoreLead",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "AI-powered lead discovery and scoring platform for B2B sales teams",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Waitlist - launching soon",
  },
  featureList: [
    "AI-powered business discovery",
    "Intelligent lead scoring",
    "Automated data enrichment",
    "Multi-language outreach generation",
    "Pipeline management",
    "CSV export",
    "Deduplication",
  ],
}
