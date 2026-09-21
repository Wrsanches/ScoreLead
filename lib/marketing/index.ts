import type { Metadata } from "next";
import { marketingContentEn } from "./content-en";
import { marketingContentEs } from "./content-es";
import { marketingContentPt } from "./content-pt";
import {
  getMarketingPlatformImage,
  getMarketingPlatformImageCopy,
} from "./platform-images";
import type {
  MarketingLocale,
  MarketingPage,
  MarketingPageDefinition,
  MarketingPageGroup,
  MarketingPageTranslation,
  MarketingUi,
} from "./types";
import {
  getLanguageAlternates,
  getLocaleConfig,
  getLocalizedUrl,
  normalizeLocale,
  siteConfig,
} from "@/lib/seo";

const SEO_UPDATED_AT = "2026-09-01";

const definitions: MarketingPageDefinition[] = [
  {
    id: "feature-ai-lead-discovery",
    group: "features",
    slug: "ai-lead-discovery",
    pathname: "features/ai-lead-discovery",
    updatedAt: SEO_UPDATED_AT,
    keywords: [
      "AI lead discovery",
      "B2B account discovery",
      "lead generation software",
    ],
    relatedBlogSlugs: [
      "ai-lead-generation-guide",
      "ideal-customer-profile-guide",
    ],
    relatedMarketingPaths: ["compare/sales-prospecting-software", "tools/icp-worksheet"],
  },
  {
    id: "feature-lead-scoring",
    group: "features",
    slug: "lead-scoring",
    pathname: "features/lead-scoring",
    updatedAt: SEO_UPDATED_AT,
    keywords: [
      "lead scoring software",
      "B2B lead scoring software",
      "AI lead scoring software",
      "predictive lead scoring software",
    ],
    relatedBlogSlugs: ["b2b-lead-scoring-model", "b2b-sales-pipeline-guide"],
    relatedMarketingPaths: [
      "compare/best-lead-scoring-software",
      "tools/lead-scoring-calculator",
    ],
  },
  {
    id: "feature-lead-enrichment",
    group: "features",
    slug: "lead-enrichment",
    pathname: "features/lead-enrichment",
    updatedAt: SEO_UPDATED_AT,
    keywords: [
      "B2B lead enrichment",
      "lead enrichment software",
      "B2B data enrichment",
      "CRM-ready leads",
    ],
    relatedBlogSlugs: ["lead-enrichment-guide", "crm-data-quality-guide"],
    relatedMarketingPaths: [
      "compare/b2b-lead-enrichment-tools",
      "tools/enrichment-checklist",
    ],
  },
  {
    id: "feature-outreach-automation",
    group: "features",
    slug: "outreach-automation",
    pathname: "features/outreach-automation",
    updatedAt: SEO_UPDATED_AT,
    keywords: [
      "B2B outreach automation",
      "AI sales outreach",
      "personalized outreach",
    ],
    relatedBlogSlugs: [
      "personalized-b2b-outreach",
      "multilingual-b2b-prospecting",
    ],
  },
  {
    id: "feature-sales-pipeline",
    group: "features",
    slug: "sales-pipeline",
    pathname: "features/sales-pipeline",
    updatedAt: SEO_UPDATED_AT,
    keywords: [
      "B2B sales pipeline",
      "lead generation workflow",
      "pipeline management",
    ],
    relatedBlogSlugs: [
      "b2b-sales-pipeline-guide",
      "sales-prospecting-automation",
    ],
  },
  {
    id: "feature-ai-content-creation",
    group: "features",
    slug: "ai-content-creation",
    pathname: "features/ai-content-creation",
    updatedAt: SEO_UPDATED_AT,
    keywords: [
      "AI Instagram content calendar",
      "AI social media post generator",
      "Instagram content planner for small business",
    ],
    relatedBlogSlugs: [
      "personalized-b2b-outreach",
      "b2b-prospecting-guide",
    ],
    relatedMarketingPaths: [
      "features/outreach-automation",
      "features/ai-lead-discovery",
    ],
  },
  {
    id: "use-case-agencies",
    group: "use-cases",
    slug: "agencies",
    pathname: "use-cases/agencies",
    updatedAt: SEO_UPDATED_AT,
    keywords: ["lead generation for agencies", "agency prospecting software"],
    relatedBlogSlugs: ["ai-lead-generation-guide", "personalized-b2b-outreach"],
  },
  {
    id: "compare-sales-prospecting-software",
    group: "compare",
    slug: "sales-prospecting-software",
    pathname: "compare/sales-prospecting-software",
    updatedAt: "2026-09-21",
    keywords: [
      "sales prospecting software",
      "B2B prospecting software",
      "sales prospecting tools",
      "AI sales prospecting",
    ],
    relatedBlogSlugs: [
      "b2b-prospecting-guide",
      "sales-prospecting-automation",
    ],
    relatedMarketingPaths: [
      "features/ai-lead-discovery",
      "features/lead-scoring",
    ],
  },
  {
    id: "compare-best-lead-scoring-software",
    group: "compare",
    slug: "best-lead-scoring-software",
    pathname: "compare/best-lead-scoring-software",
    updatedAt: "2026-09-21",
    keywords: [
      "best lead scoring software",
      "lead scoring software comparison",
      "AI lead scoring software",
      "predictive lead scoring software",
    ],
    relatedBlogSlugs: ["b2b-lead-scoring-model", "b2b-sales-pipeline-guide"],
    relatedMarketingPaths: [
      "features/lead-scoring",
      "tools/lead-scoring-calculator",
    ],
  },
  {
    id: "compare-b2b-lead-enrichment-tools",
    group: "compare",
    slug: "b2b-lead-enrichment-tools",
    pathname: "compare/b2b-lead-enrichment-tools",
    updatedAt: "2026-09-21",
    keywords: [
      "B2B lead enrichment tools",
      "lead enrichment software",
      "data enrichment tools",
      "B2B lead enrichment API",
    ],
    relatedBlogSlugs: ["lead-enrichment-guide", "crm-data-quality-guide"],
    relatedMarketingPaths: [
      "features/lead-enrichment",
      "tools/enrichment-checklist",
    ],
  },
  {
    id: "case-study-ceramik",
    group: "case-studies",
    slug: "ceramik",
    pathname: "case-studies/ceramik",
    publishedAt: SEO_UPDATED_AT,
    updatedAt: "2026-09-21",
    keywords: [
      "Ceramik ScoreLead case study",
      "B2B lead generation case study",
    ],
    relatedBlogSlugs: [
      "ai-lead-generation-guide",
      "sales-prospecting-automation",
    ],
  },
  {
    id: "company-pricing",
    group: "company",
    slug: "pricing",
    pathname: "pricing",
    updatedAt: SEO_UPDATED_AT,
    keywords: ["ScoreLead pricing", "lead generation software pricing"],
    relatedBlogSlugs: ["ai-lead-generation-guide"],
  },
  {
    id: "company-security",
    group: "company",
    slug: "security",
    pathname: "security",
    updatedAt: SEO_UPDATED_AT,
    keywords: ["ScoreLead security", "ScoreLead data protection"],
    relatedBlogSlugs: ["crm-data-quality-guide"],
  },
  {
    id: "company-about",
    group: "company",
    slug: "about",
    pathname: "about",
    updatedAt: SEO_UPDATED_AT,
    keywords: ["about ScoreLead", "ScoreLead AI lead generation"],
    relatedBlogSlugs: ["ai-lead-generation-guide"],
  },
  {
    id: "tool-icp-worksheet",
    group: "tools",
    slug: "icp-worksheet",
    pathname: "tools/icp-worksheet",
    updatedAt: "2026-09-21",
    keywords: ["ideal customer profile worksheet", "B2B ICP template"],
    relatedBlogSlugs: ["ideal-customer-profile-guide"],
    relatedMarketingPaths: ["features/ai-lead-discovery", "tools/lead-scoring-calculator"],
  },
  {
    id: "tool-lead-scoring-calculator",
    group: "tools",
    slug: "lead-scoring-calculator",
    pathname: "tools/lead-scoring-calculator",
    updatedAt: "2026-09-21",
    keywords: ["lead scoring calculator", "lead scoring template", "B2B lead score template"],
    relatedBlogSlugs: ["b2b-lead-scoring-model"],
    relatedMarketingPaths: ["features/lead-scoring", "compare/best-lead-scoring-software"],
  },
  {
    id: "tool-enrichment-checklist",
    group: "tools",
    slug: "enrichment-checklist",
    pathname: "tools/enrichment-checklist",
    updatedAt: "2026-09-21",
    keywords: ["lead enrichment checklist", "B2B data enrichment template"],
    relatedBlogSlugs: ["lead-enrichment-guide", "crm-data-quality-guide"],
    relatedMarketingPaths: ["features/lead-enrichment", "compare/b2b-lead-enrichment-tools"],
  },
  {
    id: "tool-roi-calculator",
    group: "tools",
    slug: "lead-research-roi-calculator",
    pathname: "tools/lead-research-roi-calculator",
    updatedAt: "2026-09-21",
    keywords: [
      "lead research ROI calculator",
      "sales research cost calculator",
    ],
    relatedBlogSlugs: ["manual-lead-research-vs-automation"],
    relatedMarketingPaths: ["features/ai-lead-discovery", "case-studies/ceramik"],
  },
];

const content: Record<
  MarketingLocale,
  Record<string, MarketingPageTranslation>
> = {
  en: marketingContentEn,
  pt: marketingContentPt,
  es: marketingContentEs,
};

export const marketingUi: Record<MarketingLocale, MarketingUi> = {
  en: {
    home: "Home",
    overview: "Direct answer",
    keyOutcomes: "What you can do",
    evidence: "Evidence and limits",
    relatedGuides: "Related field guides",
    relatedGuidesDescription:
      "Go deeper with practical, source-aware guidance.",
    readGuide: "Read guide",
    relatedSolutions: "Related solutions",
    relatedSolutionsDescription:
      "Compare the workflow, evaluate the category, or try a practical tool.",
    viewPage: "View page",
    lastReviewed: "Last reviewed",
    startFree: "Start free",
  },
  pt: {
    home: "Início",
    overview: "Resposta direta",
    keyOutcomes: "O que você pode fazer",
    evidence: "Evidências e limites",
    relatedGuides: "Guias relacionados",
    relatedGuidesDescription:
      "Aprofunde o tema com orientação prática e baseada em fontes.",
    readGuide: "Ler guia",
    relatedSolutions: "Soluções relacionadas",
    relatedSolutionsDescription:
      "Compare o fluxo, avalie a categoria ou experimente uma ferramenta prática.",
    viewPage: "Ver página",
    lastReviewed: "Última revisão",
    startFree: "Começar grátis",
  },
  es: {
    home: "Inicio",
    overview: "Respuesta directa",
    keyOutcomes: "Lo que puedes hacer",
    evidence: "Evidencia y límites",
    relatedGuides: "Guías relacionadas",
    relatedGuidesDescription:
      "Profundiza con orientación práctica y basada en fuentes.",
    readGuide: "Leer guía",
    relatedSolutions: "Soluciones relacionadas",
    relatedSolutionsDescription:
      "Compara el flujo, evalúa la categoría o prueba una herramienta práctica.",
    viewPage: "Ver página",
    lastReviewed: "Última revisión",
    startFree: "Empezar gratis",
  },
};

export const marketingPages: MarketingPage[] = definitions.map((definition) => {
  const translations = {
    en: content.en[definition.id],
    pt: content.pt[definition.id],
    es: content.es[definition.id],
  };

  if (!translations.en || !translations.pt || !translations.es) {
    throw new Error(`Missing marketing translation for ${definition.id}`);
  }

  return { ...definition, translations };
});

export function getMarketingPage(group: MarketingPageGroup, slug: string) {
  return marketingPages.find(
    (page) => page.group === group && page.slug === slug,
  );
}

export function getMarketingPageByPath(pathname: string) {
  return marketingPages.find(
    (page) => page.pathname === pathname.replace(/^\/+|\/+$/g, ""),
  );
}

export function getMarketingPagesByGroup(group: MarketingPageGroup) {
  return marketingPages.filter((page) => page.group === group);
}

export function getMarketingTranslation(page: MarketingPage, locale: string) {
  return page.translations[normalizeLocale(locale)];
}

export function getMarketingUi(locale: string) {
  return marketingUi[normalizeLocale(locale)];
}

export function generateMarketingMetadata(
  page: MarketingPage,
  locale: string,
): Metadata {
  const normalizedLocale = normalizeLocale(locale);
  const translation = getMarketingTranslation(page, normalizedLocale);
  const canonical = getLocalizedUrl(normalizedLocale, page.pathname);
  const platformImage = getMarketingPlatformImage(page.id);
  const platformImageText = getMarketingPlatformImageCopy(
    normalizedLocale,
    platformImage.variant,
  );
  const image = `${siteConfig.url}${platformImage.src}`;

  return {
    title: translation.title,
    description: translation.description,
    keywords: [...page.keywords, translation.title],
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.creator,
    publisher: siteConfig.name,
    alternates: {
      canonical,
      languages: getLanguageAlternates(page.pathname),
    },
    openGraph: {
      type: "website",
      locale: getLocaleConfig(normalizedLocale).ogLocale,
      url: canonical,
      siteName: siteConfig.name,
      title: translation.title,
      description: translation.description,
      images: [
        {
          url: image,
          width: platformImage.width,
          height: platformImage.height,
          alt: platformImageText.alt,
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: translation.title,
      description: translation.description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export type {
  MarketingLocale,
  MarketingPage,
  MarketingPageGroup,
  MarketingPageTranslation,
};

export {
  getMarketingPlatformImage,
  getMarketingPlatformImageCopy,
  platformImageCopy,
} from "./platform-images";
export type {
  PlatformImageAsset,
  PlatformImageCopy,
  PlatformImageVariant,
} from "./platform-images";
