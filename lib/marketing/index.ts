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

const UPDATED_AT = "2026-07-23";

const definitions: MarketingPageDefinition[] = [
  {
    id: "feature-ai-lead-discovery",
    group: "features",
    slug: "ai-lead-discovery",
    pathname: "features/ai-lead-discovery",
    updatedAt: UPDATED_AT,
    keywords: [
      "AI lead discovery",
      "B2B account discovery",
      "lead generation software",
    ],
    relatedBlogSlugs: [
      "ai-lead-generation-guide",
      "ideal-customer-profile-guide",
    ],
  },
  {
    id: "feature-lead-scoring",
    group: "features",
    slug: "lead-scoring",
    pathname: "features/lead-scoring",
    updatedAt: UPDATED_AT,
    keywords: ["B2B lead scoring", "AI lead scoring", "prospect scoring"],
    relatedBlogSlugs: ["b2b-lead-scoring-model", "b2b-sales-pipeline-guide"],
  },
  {
    id: "feature-lead-enrichment",
    group: "features",
    slug: "lead-enrichment",
    pathname: "features/lead-enrichment",
    updatedAt: UPDATED_AT,
    keywords: ["B2B lead enrichment", "sales intelligence", "CRM-ready leads"],
    relatedBlogSlugs: ["lead-enrichment-guide", "crm-data-quality-guide"],
  },
  {
    id: "feature-outreach-automation",
    group: "features",
    slug: "outreach-automation",
    pathname: "features/outreach-automation",
    updatedAt: UPDATED_AT,
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
    updatedAt: UPDATED_AT,
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
    id: "use-case-agencies",
    group: "use-cases",
    slug: "agencies",
    pathname: "use-cases/agencies",
    updatedAt: UPDATED_AT,
    keywords: ["lead generation for agencies", "agency prospecting software"],
    relatedBlogSlugs: ["ai-lead-generation-guide", "personalized-b2b-outreach"],
  },
  {
    id: "use-case-b2b-sales-teams",
    group: "use-cases",
    slug: "b2b-sales-teams",
    pathname: "use-cases/b2b-sales-teams",
    updatedAt: UPDATED_AT,
    keywords: ["B2B sales prospecting software", "sales team lead generation"],
    relatedBlogSlugs: ["b2b-lead-scoring-model", "b2b-sales-pipeline-guide"],
  },
  {
    id: "use-case-b2b-startups",
    group: "use-cases",
    slug: "b2b-startups",
    pathname: "use-cases/b2b-startups",
    updatedAt: UPDATED_AT,
    keywords: ["startup lead generation", "founder-led sales prospecting"],
    relatedBlogSlugs: [
      "ideal-customer-profile-guide",
      "manual-lead-research-vs-automation",
    ],
  },
  {
    id: "use-case-b2b-companies",
    group: "use-cases",
    slug: "b2b-companies",
    pathname: "use-cases/b2b-companies",
    updatedAt: UPDATED_AT,
    keywords: ["B2B company lead generation", "multi-region sales prospecting"],
    relatedBlogSlugs: [
      "multilingual-b2b-prospecting",
      "crm-data-quality-guide",
    ],
  },
  {
    id: "compare-manual-lead-research",
    group: "compare",
    slug: "manual-lead-research",
    pathname: "compare/manual-lead-research",
    updatedAt: UPDATED_AT,
    keywords: ["manual lead research vs automation", "AI lead research"],
    relatedBlogSlugs: [
      "manual-lead-research-vs-automation",
      "sales-prospecting-automation",
    ],
  },
  {
    id: "compare-spreadsheets",
    group: "compare",
    slug: "spreadsheets",
    pathname: "compare/spreadsheets",
    updatedAt: UPDATED_AT,
    keywords: [
      "lead generation spreadsheet alternative",
      "sales prospecting software",
    ],
    relatedBlogSlugs: ["crm-data-quality-guide", "b2b-sales-pipeline-guide"],
  },
  {
    id: "compare-purchased-lead-lists",
    group: "compare",
    slug: "purchased-lead-lists",
    pathname: "compare/purchased-lead-lists",
    updatedAt: UPDATED_AT,
    keywords: ["purchased lead lists alternative", "fresh B2B lead discovery"],
    relatedBlogSlugs: ["lead-enrichment-guide", "ideal-customer-profile-guide"],
  },
  {
    id: "case-study-ceramik",
    group: "case-studies",
    slug: "ceramik",
    pathname: "case-studies/ceramik",
    updatedAt: "2026-07-24",
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
    updatedAt: UPDATED_AT,
    keywords: ["ScoreLead pricing", "lead generation software pricing"],
    relatedBlogSlugs: ["ai-lead-generation-guide"],
  },
  {
    id: "company-security",
    group: "company",
    slug: "security",
    pathname: "security",
    updatedAt: UPDATED_AT,
    keywords: ["ScoreLead security", "ScoreLead data protection"],
    relatedBlogSlugs: ["crm-data-quality-guide"],
  },
  {
    id: "company-about",
    group: "company",
    slug: "about",
    pathname: "about",
    updatedAt: UPDATED_AT,
    keywords: ["about ScoreLead", "ScoreLead AI lead generation"],
    relatedBlogSlugs: ["ai-lead-generation-guide"],
  },
  {
    id: "company-editorial-policy",
    group: "company",
    slug: "editorial-policy",
    pathname: "editorial-policy",
    updatedAt: UPDATED_AT,
    keywords: ["ScoreLead editorial policy", "ScoreLead content methodology"],
    relatedBlogSlugs: ["ai-lead-generation-guide"],
  },
  {
    id: "author-scorelead-editorial",
    group: "company",
    slug: "scorelead-editorial",
    pathname: "authors/scorelead-editorial",
    updatedAt: UPDATED_AT,
    keywords: ["ScoreLead Editorial", "ScoreLead authors"],
    relatedBlogSlugs: ["ai-lead-generation-guide", "b2b-lead-scoring-model"],
  },
  {
    id: "tool-icp-worksheet",
    group: "tools",
    slug: "icp-worksheet",
    pathname: "tools/icp-worksheet",
    updatedAt: UPDATED_AT,
    keywords: ["ideal customer profile worksheet", "B2B ICP template"],
    relatedBlogSlugs: ["ideal-customer-profile-guide"],
  },
  {
    id: "tool-lead-scoring-calculator",
    group: "tools",
    slug: "lead-scoring-calculator",
    pathname: "tools/lead-scoring-calculator",
    updatedAt: UPDATED_AT,
    keywords: ["lead scoring calculator", "B2B lead score template"],
    relatedBlogSlugs: ["b2b-lead-scoring-model"],
  },
  {
    id: "tool-enrichment-checklist",
    group: "tools",
    slug: "enrichment-checklist",
    pathname: "tools/enrichment-checklist",
    updatedAt: UPDATED_AT,
    keywords: ["lead enrichment checklist", "B2B data enrichment template"],
    relatedBlogSlugs: ["lead-enrichment-guide", "crm-data-quality-guide"],
  },
  {
    id: "tool-roi-calculator",
    group: "tools",
    slug: "lead-research-roi-calculator",
    pathname: "tools/lead-research-roi-calculator",
    updatedAt: UPDATED_AT,
    keywords: [
      "lead research ROI calculator",
      "sales research cost calculator",
    ],
    relatedBlogSlugs: ["manual-lead-research-vs-automation"],
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
    lastReviewed: "Last reviewed",
    methodology: "Content methodology",
    methodologyDescription:
      "See how ScoreLead handles sources, updates, translations, and corrections.",
    editorialPolicy: "Read the editorial policy",
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
    lastReviewed: "Última revisão",
    methodology: "Metodologia de conteúdo",
    methodologyDescription:
      "Veja como o ScoreLead trata fontes, atualizações, traduções e correções.",
    editorialPolicy: "Ler a política editorial",
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
    lastReviewed: "Última revisión",
    methodology: "Metodología de contenido",
    methodologyDescription:
      "Consulta cómo ScoreLead gestiona fuentes, actualizaciones, traducciones y correcciones.",
    editorialPolicy: "Leer la política editorial",
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
    authors: [
      {
        name: "ScoreLead Editorial",
        url: getLocalizedUrl(normalizedLocale, "authors/scorelead-editorial"),
      },
    ],
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
