import type { MarketingLocale } from "./types";

export type PlatformImageVariant =
  "dashboard" | "discovery" | "pipeline" | "leads" | "case-study";

export type PlatformImageAsset = {
  variant: PlatformImageVariant;
  src: string;
  width: number;
  height: number;
};

export type PlatformImageCopy = {
  alt: string;
  caption: string;
};

const assets: Record<PlatformImageVariant, PlatformImageAsset> = {
  dashboard: {
    variant: "dashboard",
    src: "/images/platform/ceramik-dashboard.webp",
    width: 3840,
    height: 2400,
  },
  discovery: {
    variant: "discovery",
    src: "/images/platform/ceramik-discovery.webp",
    width: 3840,
    height: 2400,
  },
  pipeline: {
    variant: "pipeline",
    src: "/images/platform/ceramik-pipeline.webp",
    width: 3840,
    height: 2400,
  },
  leads: {
    variant: "leads",
    src: "/images/platform/ceramik-leads.webp",
    width: 3840,
    height: 2400,
  },
  "case-study": {
    variant: "case-study",
    src: "/images/platform/ceramik-case-study.webp",
    width: 3840,
    height: 2400,
  },
};

const pageVariants: Record<string, PlatformImageVariant> = {
  "feature-ai-lead-discovery": "discovery",
  "feature-lead-scoring": "leads",
  "feature-lead-enrichment": "leads",
  "feature-outreach-automation": "leads",
  "feature-sales-pipeline": "pipeline",
  "use-case-agencies": "dashboard",
  "use-case-b2b-sales-teams": "leads",
  "use-case-b2b-startups": "discovery",
  "use-case-b2b-companies": "pipeline",
  "compare-manual-lead-research": "leads",
  "compare-spreadsheets": "pipeline",
  "compare-purchased-lead-lists": "discovery",
  "case-study-ceramik": "case-study",
  "company-pricing": "dashboard",
  "company-security": "dashboard",
  "company-about": "case-study",
  "company-editorial-policy": "dashboard",
  "author-scorelead-editorial": "dashboard",
  "tool-icp-worksheet": "discovery",
  "tool-lead-scoring-calculator": "leads",
  "tool-enrichment-checklist": "leads",
  "tool-roi-calculator": "dashboard",
};

export const platformImageCopy: Record<
  MarketingLocale,
  Record<PlatformImageVariant, PlatformImageCopy>
> = {
  en: {
    dashboard: {
      alt: "Ceramik's ScoreLead dashboard showing lead volume, average score, discovery jobs, enrichment coverage, and performance charts.",
      caption:
        "ScoreLead product demo based on the Ceramik workspace. Values reflect the example workspace at capture time.",
    },
    discovery: {
      alt: "ScoreLead discovery report for Ceramik showing ten San Francisco pottery studio leads, average score, enrichment, ratings, and source coverage.",
      caption:
        "Product demo based on Ceramik's discovery report, with aggregate prospecting results and no private contact details.",
    },
    pipeline: {
      alt: "ScoreLead sales pipeline for Ceramik showing pottery studio leads organized into new, contacted, interested, and profile stages.",
      caption:
        "Product demo based on Ceramik's pipeline, showing how discovered accounts can be organized into clear sales stages.",
    },
    leads: {
      alt: "ScoreLead lead workspace for Ceramik showing a pottery studio list, company profile, five-point score, and explainable scoring signals.",
      caption:
        "Product demo based on Ceramik's lead workspace, showing qualification evidence without exposing contact details.",
    },
    "case-study": {
      alt: "Ceramik's ScoreLead dashboard showing lead metrics, discovery activity, enrichment coverage, and score distribution.",
      caption:
        "ScoreLead product demo based on the Ceramik customer workspace, providing product context for the published customer story.",
    },
  },
  pt: {
    dashboard: {
      alt: "Dashboard do ScoreLead da Ceramik com volume de leads, score médio, buscas, cobertura de enriquecimento e gráficos de desempenho.",
      caption:
        "Demo do ScoreLead baseado no workspace da Ceramik. Os valores refletem o workspace de exemplo no momento da captura.",
    },
    discovery: {
      alt: "Relatório de descoberta do ScoreLead para a Ceramik com dez estúdios de cerâmica em São Francisco, score médio, enriquecimento e fontes.",
      caption:
        "Demo baseado no relatório de descoberta da Ceramik, com resultados agregados e sem dados privados de contato.",
    },
    pipeline: {
      alt: "Pipeline de vendas do ScoreLead para a Ceramik com estúdios de cerâmica organizados por novas contas, contato, interesse e perfil.",
      caption:
        "Demo baseado no pipeline da Ceramik, mostrando como contas descobertas podem avançar por etapas comerciais claras.",
    },
    leads: {
      alt: "Workspace de leads do ScoreLead para a Ceramik com lista de estúdios, perfil da empresa, score de cinco pontos e sinais explicáveis.",
      caption:
        "Demo baseado no workspace de leads da Ceramik, com evidências de qualificação e sem expor dados de contato.",
    },
    "case-study": {
      alt: "Dashboard da Ceramik no ScoreLead com métricas de leads, atividade de descoberta, enriquecimento e distribuição de scores.",
      caption:
        "Demo do ScoreLead baseado no workspace de cliente da Ceramik, oferecendo contexto para a história de cliente publicada.",
    },
  },
  es: {
    dashboard: {
      alt: "Panel de ScoreLead de Ceramik con volumen de leads, puntuación media, búsquedas, cobertura de enriquecimiento y gráficos de rendimiento.",
      caption:
        "Demo de ScoreLead basado en el espacio de Ceramik. Los valores reflejan el espacio de ejemplo al momento de la captura.",
    },
    discovery: {
      alt: "Informe de descubrimiento de ScoreLead para Ceramik con diez estudios de cerámica de San Francisco, puntuación, enriquecimiento y fuentes.",
      caption:
        "Demo basado en el informe de descubrimiento de Ceramik, con resultados agregados y sin datos privados de contacto.",
    },
    pipeline: {
      alt: "Pipeline de ventas de ScoreLead para Ceramik con estudios de cerámica organizados por cuentas nuevas, contacto, interés y perfil.",
      caption:
        "Demo basado en el pipeline de Ceramik, que muestra cómo las cuentas descubiertas avanzan por etapas comerciales claras.",
    },
    leads: {
      alt: "Espacio de leads de ScoreLead para Ceramik con lista de estudios, perfil de empresa, puntuación de cinco puntos y señales explicables.",
      caption:
        "Demo basado en el espacio de leads de Ceramik, con evidencia de calificación y sin exponer datos de contacto.",
    },
    "case-study": {
      alt: "Panel de Ceramik en ScoreLead con métricas de leads, actividad de descubrimiento, enriquecimiento y distribución de puntuaciones.",
      caption:
        "Demo de ScoreLead basado en el espacio de cliente de Ceramik, con contexto para la historia de cliente publicada.",
    },
  },
};

export function getMarketingPlatformImage(pageId: string) {
  return assets[pageVariants[pageId] ?? "dashboard"];
}

export function getMarketingPlatformImageCopy(
  locale: MarketingLocale,
  variant: PlatformImageVariant,
) {
  return platformImageCopy[locale][variant];
}
