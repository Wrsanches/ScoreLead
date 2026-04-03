import type { Metadata, Viewport } from "next"

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
  jsonLdDescription: string
  faq: { question: string; answer: string }[]
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
    jsonLdDescription:
      "AI-powered lead discovery and scoring platform for B2B sales teams. Automated business discovery, intelligent scoring, data enrichment, and personalized outreach.",
    faq: [
      {
        question: "What is ScoreLead?",
        answer:
          "ScoreLead is an AI-powered platform that discovers, scores, and qualifies B2B leads automatically. It finds businesses across any city or industry, enriches them with detailed data, and generates personalized outreach sequences.",
      },
      {
        question: "How does AI lead scoring work?",
        answer:
          "ScoreLead AI analyzes leads across multiple dimensions including online presence, reputation, market fit, engagement potential, and readiness to buy, then assigns a clear score from 1 to 5.",
      },
      {
        question: "What languages does ScoreLead support?",
        answer:
          "ScoreLead supports multiple languages for both the platform interface and AI-generated outreach, including English, Portuguese, and Spanish.",
      },
      {
        question: "How do I get access to ScoreLead?",
        answer:
          "ScoreLead is currently in early access. You can join the waitlist on our website to be notified when we launch.",
      },
    ],
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
    jsonLdDescription:
      "Plataforma de descoberta e pontuacao de leads com IA para equipes de vendas B2B. Descoberta automatizada, pontuacao inteligente, enriquecimento de dados e outreach personalizado.",
    faq: [
      {
        question: "O que e o ScoreLead?",
        answer:
          "ScoreLead e uma plataforma com IA que descobre, pontua e qualifica leads B2B automaticamente. Encontra empresas em qualquer cidade ou industria, enriquece com dados detalhados e gera sequencias de outreach personalizadas.",
      },
      {
        question: "Como funciona a pontuacao de leads com IA?",
        answer:
          "A IA do ScoreLead analisa leads em multiplas dimensoes, incluindo presenca online, reputacao, adequacao ao mercado, potencial de engajamento e prontidao para compra, atribuindo uma pontuacao clara de 1 a 5.",
      },
      {
        question: "Quais idiomas o ScoreLead suporta?",
        answer:
          "O ScoreLead suporta multiplos idiomas tanto na interface da plataforma quanto no outreach gerado por IA, incluindo ingles, portugues e espanhol.",
      },
      {
        question: "Como posso acessar o ScoreLead?",
        answer:
          "O ScoreLead esta em acesso antecipado. Voce pode entrar na lista de espera em nosso site para ser notificado quando lancarmos.",
      },
    ],
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
    jsonLdDescription:
      "Plataforma de descubrimiento y puntuacion de leads con IA para equipos de ventas B2B. Descubrimiento automatizado, puntuacion inteligente, enriquecimiento de datos y outreach personalizado.",
    faq: [
      {
        question: "Que es ScoreLead?",
        answer:
          "ScoreLead es una plataforma con IA que descubre, puntua y califica leads B2B automaticamente. Encuentra negocios en cualquier ciudad o industria, los enriquece con datos detallados y genera secuencias de outreach personalizadas.",
      },
      {
        question: "Como funciona la puntuacion de leads con IA?",
        answer:
          "La IA de ScoreLead analiza leads en multiples dimensiones, incluyendo presencia online, reputacion, ajuste al mercado, potencial de engagement y disposicion a comprar, asignando una puntuacion clara de 1 a 5.",
      },
      {
        question: "Que idiomas soporta ScoreLead?",
        answer:
          "ScoreLead soporta multiples idiomas tanto en la interfaz de la plataforma como en el outreach generado por IA, incluyendo ingles, portugues y espanol.",
      },
      {
        question: "Como puedo acceder a ScoreLead?",
        answer:
          "ScoreLead esta en acceso anticipado. Puedes unirte a la lista de espera en nuestro sitio web para ser notificado cuando lancemos.",
      },
    ],
  },
}

export const siteViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090B",
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
    manifest: "/manifest.json",
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

export function generateJsonLd(locale: string) {
  const meta = localeMetadata[locale] || localeMetadata.en
  const canonicalUrl = locale === "en" ? siteConfig.url : `${siteConfig.url}/${locale}`

  const organization = {
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

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ScoreLead",
    url: siteConfig.url,
    inLanguage: locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en",
    description: meta.jsonLdDescription,
  }

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ScoreLead",
    url: canonicalUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: meta.jsonLdDescription,
    inLanguage: locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en",
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

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return { organization, webSite, softwareApplication, faqPage }
}
