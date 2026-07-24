import type { ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Globe2,
  LayoutDashboard,
  ListChecks,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";
import { ScoreLeadLogo } from "@/components/scorelead-logo";
import {
  type MarketingLocale,
  type MarketingPage,
} from "@/lib/marketing";

type DemoVariant =
  | "dashboard"
  | "discovery"
  | "scoring"
  | "enrichment"
  | "outreach"
  | "pipeline"
  | "case-study";

type DemoCopy = {
  productDemo: string;
  workspace: string;
  views: Record<DemoVariant, string>;
  labels: {
    overview: string;
    allLeads: string;
    discover: string;
    pipeline: string;
    outreach: string;
    leads: string;
    averageScore: string;
    discoveryJobs: string;
    enriched: string;
    scoreDistribution: string;
    contactAvailability: string;
    recentLeads: string;
    recentJobs: string;
    email: string;
    phone: string;
    website: string;
    discoveryReport: string;
    discoveryQuery: string;
    verifiedBusinesses: string;
    sourceCoverage: string;
    rating: string;
    leadProfile: string;
    scoreEvidence: string;
    reach: string;
    trust: string;
    engage: string;
    match: string;
    ready: string;
    fit: string;
    services: string;
    dataSource: string;
    enrichmentCoverage: string;
    companySignals: string;
    serviceTags: string;
    socialProfile: string;
    found: string;
    missing: string;
    synced: string;
    outreachQueue: string;
    approvalRequired: string;
    draft: string;
    reviewed: string;
    sequence: string;
    step: string;
    personalize: string;
    awaitingApproval: string;
    sendAfterApproval: string;
    new: string;
    contacted: string;
    interested: string;
    accounts: string;
    workflowSnapshot: string;
    discovered: string;
    qualified: string;
    organized: string;
    evidenceNote: string;
    updated: string;
  };
};

type DemoDescription = {
  alt: string;
  caption: string;
};

const pageDemoVariants: Record<string, DemoVariant> = {
  "feature-ai-lead-discovery": "discovery",
  "feature-lead-scoring": "scoring",
  "feature-lead-enrichment": "enrichment",
  "feature-outreach-automation": "outreach",
  "feature-sales-pipeline": "pipeline",
  "use-case-agencies": "dashboard",
  "use-case-b2b-sales-teams": "outreach",
  "use-case-b2b-startups": "discovery",
  "use-case-b2b-companies": "pipeline",
  "compare-manual-lead-research": "enrichment",
  "compare-spreadsheets": "pipeline",
  "compare-purchased-lead-lists": "discovery",
  "case-study-ceramik": "case-study",
  "company-pricing": "dashboard",
  "company-security": "dashboard",
  "company-about": "case-study",
  "company-editorial-policy": "dashboard",
  "author-scorelead-editorial": "dashboard",
  "tool-icp-worksheet": "discovery",
  "tool-lead-scoring-calculator": "scoring",
  "tool-enrichment-checklist": "enrichment",
  "tool-roi-calculator": "dashboard",
};

const demoViewportHeight: Record<DemoVariant, string> = {
  dashboard: "h-[30rem]",
  discovery: "h-[38rem] sm:h-[31rem] lg:h-[29rem]",
  scoring: "h-[26rem] sm:h-[27rem] lg:h-[29rem]",
  enrichment: "h-[34rem] sm:h-[39rem] lg:h-[27rem]",
  outreach: "h-[29rem] lg:h-[28rem]",
  pipeline: "h-[27rem] sm:h-[26rem]",
  "case-study": "h-[27rem] sm:h-[26rem]",
};

const demoCopy: Record<MarketingLocale, DemoCopy> = {
  en: {
    productDemo: "Product demo",
    workspace: "Ceramik workspace",
    views: {
      dashboard: "Performance overview",
      discovery: "Discovery intelligence",
      scoring: "Lead qualification",
      enrichment: "Account enrichment",
      outreach: "Outreach workflow",
      pipeline: "Sales pipeline",
      "case-study": "Customer workflow",
    },
    labels: {
      overview: "Dashboard",
      allLeads: "All leads",
      discover: "Discover",
      pipeline: "Pipeline",
      outreach: "Outreach",
      leads: "Leads",
      averageScore: "Average score",
      discoveryJobs: "Discovery jobs",
      enriched: "Enriched",
      scoreDistribution: "Score distribution",
      contactAvailability: "Contact availability",
      recentLeads: "Recent leads",
      recentJobs: "Recent discovery",
      email: "Email",
      phone: "Phone",
      website: "Website",
      discoveryReport: "Discovery report",
      discoveryQuery: "Studios in San Francisco",
      verifiedBusinesses: "Verified businesses",
      sourceCoverage: "Source coverage",
      rating: "Rating",
      leadProfile: "Lead profile",
      scoreEvidence: "Why this score",
      reach: "Reach",
      trust: "Trust",
      engage: "Engage",
      match: "Match",
      ready: "Ready",
      fit: "Fit",
      services: "Services",
      dataSource: "Data source",
      enrichmentCoverage: "Enrichment coverage",
      companySignals: "Company signals",
      serviceTags: "Service categories",
      socialProfile: "Social profile",
      found: "Found",
      missing: "Missing",
      synced: "Synced",
      outreachQueue: "Outreach queue",
      approvalRequired: "Approval required",
      draft: "Draft",
      reviewed: "Reviewed",
      sequence: "Sequence",
      step: "Step",
      personalize: "Personalize from lead evidence",
      awaitingApproval: "Awaiting approval",
      sendAfterApproval: "Send after approval",
      new: "New",
      contacted: "Contacted",
      interested: "Interested",
      accounts: "accounts",
      workflowSnapshot: "Workflow snapshot",
      discovered: "Discovered",
      qualified: "Qualified",
      organized: "Organized",
      evidenceNote: "Public business data only",
      updated: "Updated now",
    },
  },
  pt: {
    productDemo: "Demo do produto",
    workspace: "Workspace da Ceramik",
    views: {
      dashboard: "Visão de desempenho",
      discovery: "Inteligência de descoberta",
      scoring: "Qualificação de leads",
      enrichment: "Enriquecimento de contas",
      outreach: "Fluxo de abordagem",
      pipeline: "Pipeline de vendas",
      "case-study": "Fluxo do cliente",
    },
    labels: {
      overview: "Dashboard",
      allLeads: "Todos os leads",
      discover: "Descobrir",
      pipeline: "Pipeline",
      outreach: "Abordagem",
      leads: "Leads",
      averageScore: "Score médio",
      discoveryJobs: "Buscas realizadas",
      enriched: "Enriquecidos",
      scoreDistribution: "Distribuição de scores",
      contactAvailability: "Disponibilidade de contato",
      recentLeads: "Leads recentes",
      recentJobs: "Descobertas recentes",
      email: "E-mail",
      phone: "Telefone",
      website: "Site",
      discoveryReport: "Relatório de descoberta",
      discoveryQuery: "Estúdios em São Francisco",
      verifiedBusinesses: "Empresas verificadas",
      sourceCoverage: "Cobertura de fontes",
      rating: "Avaliação",
      leadProfile: "Perfil do lead",
      scoreEvidence: "Por que este score",
      reach: "Alcance",
      trust: "Confiança",
      engage: "Engajamento",
      match: "Compatibilidade",
      ready: "Prontidão",
      fit: "Aderência",
      services: "Serviços",
      dataSource: "Fonte de dados",
      enrichmentCoverage: "Cobertura de enriquecimento",
      companySignals: "Sinais da empresa",
      serviceTags: "Categorias de serviço",
      socialProfile: "Perfil social",
      found: "Encontrado",
      missing: "Ausente",
      synced: "Sincronizado",
      outreachQueue: "Fila de abordagem",
      approvalRequired: "Aprovação necessária",
      draft: "Rascunho",
      reviewed: "Revisado",
      sequence: "Sequência",
      step: "Etapa",
      personalize: "Personalizar com evidências do lead",
      awaitingApproval: "Aguardando aprovação",
      sendAfterApproval: "Enviar após aprovação",
      new: "Novo",
      contacted: "Contatado",
      interested: "Interessado",
      accounts: "contas",
      workflowSnapshot: "Resumo do fluxo",
      discovered: "Descobertos",
      qualified: "Qualificados",
      organized: "Organizados",
      evidenceNote: "Somente dados públicos de empresas",
      updated: "Atualizado agora",
    },
  },
  es: {
    productDemo: "Demo del producto",
    workspace: "Espacio de Ceramik",
    views: {
      dashboard: "Resumen de rendimiento",
      discovery: "Inteligencia de descubrimiento",
      scoring: "Calificación de leads",
      enrichment: "Enriquecimiento de cuentas",
      outreach: "Flujo de contacto",
      pipeline: "Pipeline de ventas",
      "case-study": "Flujo del cliente",
    },
    labels: {
      overview: "Dashboard",
      allLeads: "Todos los leads",
      discover: "Descubrir",
      pipeline: "Pipeline",
      outreach: "Contacto",
      leads: "Leads",
      averageScore: "Puntuación media",
      discoveryJobs: "Búsquedas realizadas",
      enriched: "Enriquecidos",
      scoreDistribution: "Distribución de puntuaciones",
      contactAvailability: "Disponibilidad de contacto",
      recentLeads: "Leads recientes",
      recentJobs: "Descubrimientos recientes",
      email: "Correo",
      phone: "Teléfono",
      website: "Sitio web",
      discoveryReport: "Informe de descubrimiento",
      discoveryQuery: "Estudios en San Francisco",
      verifiedBusinesses: "Empresas verificadas",
      sourceCoverage: "Cobertura de fuentes",
      rating: "Valoración",
      leadProfile: "Perfil del lead",
      scoreEvidence: "Por qué tiene esta puntuación",
      reach: "Alcance",
      trust: "Confianza",
      engage: "Interacción",
      match: "Coincidencia",
      ready: "Preparación",
      fit: "Ajuste",
      services: "Servicios",
      dataSource: "Fuente de datos",
      enrichmentCoverage: "Cobertura de enriquecimiento",
      companySignals: "Señales de la empresa",
      serviceTags: "Categorías de servicio",
      socialProfile: "Perfil social",
      found: "Encontrado",
      missing: "Ausente",
      synced: "Sincronizado",
      outreachQueue: "Cola de contacto",
      approvalRequired: "Aprobación necesaria",
      draft: "Borrador",
      reviewed: "Revisado",
      sequence: "Secuencia",
      step: "Paso",
      personalize: "Personalizar con evidencia del lead",
      awaitingApproval: "Esperando aprobación",
      sendAfterApproval: "Enviar tras aprobación",
      new: "Nuevo",
      contacted: "Contactado",
      interested: "Interesado",
      accounts: "cuentas",
      workflowSnapshot: "Resumen del flujo",
      discovered: "Descubiertos",
      qualified: "Calificados",
      organized: "Organizados",
      evidenceNote: "Solo datos públicos de empresas",
      updated: "Actualizado ahora",
    },
  },
};

const demoDescriptions: Record<
  MarketingLocale,
  Record<DemoVariant, DemoDescription>
> = {
  en: {
    dashboard: {
      alt: "ScoreLead performance overview recreated from the Ceramik workspace, with lead volume, average score, discovery activity, enrichment, and source coverage.",
      caption:
        "ScoreLead product demo based on the Ceramik workspace. Values reflect the example workspace at capture time.",
    },
    discovery: {
      alt: "ScoreLead discovery report recreated from Ceramik data, showing ten pottery studios in San Francisco, average score, ratings, and source coverage.",
      caption:
        "Product demo based on Ceramik’s discovery report, with aggregate prospecting results and no private contact details.",
    },
    scoring: {
      alt: "ScoreLead qualification view recreated from the Ceramik workspace, showing a five-point lead score and six explainable scoring signals.",
      caption:
        "Product demo based on Ceramik’s lead workspace, showing qualification evidence without exposing contact details.",
    },
    enrichment: {
      alt: "ScoreLead enrichment view recreated from the Ceramik workspace, showing public company signals, contact coverage, service categories, and sources.",
      caption:
        "Product demo focused on the enrichment evidence ScoreLead can organize from public business sources.",
    },
    outreach: {
      alt: "ScoreLead outreach workflow showing a Ceramik account, a three-step sequence, evidence-based personalization, and human approval before sending.",
      caption:
        "Product demo focused on account-specific outreach and the review step before a message is used or scheduled.",
    },
    pipeline: {
      alt: "ScoreLead pipeline recreated from the Ceramik workspace, showing pottery studio accounts organized into new, contacted, and interested stages.",
      caption:
        "Product demo based on Ceramik’s pipeline, showing how discovered accounts can be organized into clear sales stages.",
    },
    "case-study": {
      alt: "ScoreLead customer workflow based on the Ceramik workspace, connecting discovery, qualification, enrichment, and pipeline organization.",
      caption:
        "ScoreLead product demo based on the Ceramik customer workspace, providing product context for the published customer story.",
    },
  },
  pt: {
    dashboard: {
      alt: "Visão de desempenho do ScoreLead recriada a partir do workspace da Ceramik, com volume de leads, score, buscas, enriquecimento e cobertura de fontes.",
      caption:
        "Demo do ScoreLead baseado no workspace da Ceramik. Os valores refletem o workspace de exemplo no momento da captura.",
    },
    discovery: {
      alt: "Relatório de descoberta do ScoreLead recriado com dados da Ceramik, mostrando dez estúdios em São Francisco, score, avaliações e fontes.",
      caption:
        "Demo baseado no relatório de descoberta da Ceramik, com resultados agregados e sem dados privados de contato.",
    },
    scoring: {
      alt: "Visão de qualificação do ScoreLead recriada a partir do workspace da Ceramik, com score de cinco pontos e seis sinais explicáveis.",
      caption:
        "Demo baseado no workspace de leads da Ceramik, com evidências de qualificação e sem expor dados de contato.",
    },
    enrichment: {
      alt: "Visão de enriquecimento do ScoreLead recriada a partir da Ceramik, com sinais públicos da empresa, cobertura de contato, serviços e fontes.",
      caption:
        "Demo focado nas evidências de enriquecimento que o ScoreLead organiza a partir de fontes públicas de empresas.",
    },
    outreach: {
      alt: "Fluxo de abordagem do ScoreLead com uma conta da Ceramik, sequência de três etapas, personalização por evidências e aprovação humana.",
      caption:
        "Demo focado em abordagem específica por conta e na revisão antes de uma mensagem ser usada ou agendada.",
    },
    pipeline: {
      alt: "Pipeline do ScoreLead recriado a partir do workspace da Ceramik, com estúdios organizados em etapas de novo, contatado e interessado.",
      caption:
        "Demo baseado no pipeline da Ceramik, mostrando como contas descobertas podem avançar por etapas comerciais claras.",
    },
    "case-study": {
      alt: "Fluxo de cliente do ScoreLead baseado no workspace da Ceramik, conectando descoberta, qualificação, enriquecimento e organização no pipeline.",
      caption:
        "Demo do ScoreLead baseado no workspace de cliente da Ceramik, oferecendo contexto para a história de cliente publicada.",
    },
  },
  es: {
    dashboard: {
      alt: "Resumen de rendimiento de ScoreLead recreado a partir del espacio de Ceramik, con leads, puntuación, búsquedas, enriquecimiento y fuentes.",
      caption:
        "Demo de ScoreLead basado en el espacio de Ceramik. Los valores reflejan el espacio de ejemplo al momento de la captura.",
    },
    discovery: {
      alt: "Informe de descubrimiento de ScoreLead recreado con datos de Ceramik, con diez estudios de San Francisco, puntuación, valoraciones y fuentes.",
      caption:
        "Demo basado en el informe de descubrimiento de Ceramik, con resultados agregados y sin datos privados de contacto.",
    },
    scoring: {
      alt: "Vista de calificación de ScoreLead recreada a partir del espacio de Ceramik, con puntuación de cinco puntos y seis señales explicables.",
      caption:
        "Demo basado en el espacio de leads de Ceramik, con evidencia de calificación y sin exponer datos de contacto.",
    },
    enrichment: {
      alt: "Vista de enriquecimiento de ScoreLead recreada a partir de Ceramik, con señales públicas, cobertura de contacto, servicios y fuentes.",
      caption:
        "Demo centrado en la evidencia de enriquecimiento que ScoreLead organiza a partir de fuentes públicas de empresas.",
    },
    outreach: {
      alt: "Flujo de contacto de ScoreLead con una cuenta de Ceramik, secuencia de tres pasos, personalización por evidencia y aprobación humana.",
      caption:
        "Demo centrado en el contacto específico por cuenta y la revisión antes de usar o programar un mensaje.",
    },
    pipeline: {
      alt: "Pipeline de ScoreLead recreado a partir del espacio de Ceramik, con estudios organizados en etapas de nuevo, contactado e interesado.",
      caption:
        "Demo basado en el pipeline de Ceramik, que muestra cómo las cuentas descubiertas avanzan por etapas comerciales claras.",
    },
    "case-study": {
      alt: "Flujo de cliente de ScoreLead basado en el espacio de Ceramik, conectando descubrimiento, calificación, enriquecimiento y organización.",
      caption:
        "Demo de ScoreLead basado en el espacio de cliente de Ceramik, con contexto para la historia de cliente publicada.",
    },
  },
};

const businesses = [
  "The Pottery Studio San Francisco",
  "Ruby’s Clay Studio & Gallery",
  "Clayroom",
  "Terra Mia Ceramic Studio",
];

function Metric({
  label,
  value,
  note,
  icon: Icon = Target,
  accent = "emerald",
}: {
  label: string;
  value: string;
  note?: string;
  icon?: typeof Target;
  accent?: "emerald" | "amber" | "sky" | "violet";
}) {
  const accents = {
    emerald: {
      card: "from-emerald-500/[0.08] via-emerald-500/[0.02] ring-emerald-500/15",
      icon: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
    },
    amber: {
      card: "from-amber-500/[0.07] via-amber-500/[0.02] ring-amber-500/15",
      icon: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
    },
    sky: {
      card: "from-sky-500/[0.07] via-sky-500/[0.02] ring-sky-500/15",
      icon: "bg-sky-500/10 text-sky-300 ring-sky-500/25",
    },
    violet: {
      card: "from-violet-500/[0.07] via-violet-500/[0.02] ring-violet-500/15",
      icon: "bg-violet-500/10 text-violet-300 ring-violet-500/25",
    },
  } as const;
  const styles = accents[accent];

  return (
    <div
      className={`min-w-0 rounded-xl bg-gradient-to-br to-transparent p-3.5 ring-1 ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.11em] text-zinc-500">
          {label}
        </p>
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-lg ring-1 ${styles.icon}`}
        >
          <Icon className="size-3" />
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-zinc-100">
        {value}
      </p>
      {note ? (
        <span className="mt-0.5 block truncate text-[9px] text-zinc-600">
          {note}
        </span>
      ) : null}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total = 5,
  suffix,
  color = "bg-zinc-500",
}: {
  label: string;
  value: number;
  total?: number;
  suffix?: string;
  color?: string;
}) {
  const width = `${Math.round((value / total) * 100)}%`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-200">
          {value}
          {suffix ?? `/${total}`}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${color}`} style={{ width }} />
      </div>
    </div>
  );
}

function DemoSidebar({
  active,
  labels,
}: {
  active: DemoVariant;
  labels: DemoCopy["labels"];
}) {
  const primaryItems = [
    { id: "dashboard", icon: LayoutDashboard, label: labels.overview },
    { id: "scoring", icon: Users, label: labels.allLeads },
    { id: "pipeline", icon: Workflow, label: labels.pipeline },
  ] as const;
  const activeId =
    active === "case-study"
      ? "dashboard"
      : active === "enrichment" || active === "outreach"
        ? "scoring"
        : active;

  function SidebarItem({
    id,
    icon: Icon,
    label,
  }: {
    id: string;
    icon: typeof LayoutDashboard;
    label: string;
  }) {
    const isActive = id === activeId;
    return (
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[9px] ${
          isActive
            ? "bg-emerald-500/[0.08] text-zinc-100"
            : "text-zinc-500"
        }`}
      >
        <Icon
          className={`size-3.5 ${
            isActive ? "text-emerald-400" : "text-zinc-600"
          }`}
        />
        <span className="truncate">{label}</span>
      </div>
    );
  }

  return (
    <aside className="hidden bg-[#090a09] p-2.5 md:block">
      <div className="flex items-center gap-2 px-1.5 py-1">
        <ScoreLeadLogo className="size-4 text-zinc-100" />
        <span className="text-[11px] font-semibold text-zinc-100">
          ScoreLead
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#b86f52] text-white">
          <Building2 className="size-3" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-zinc-300">
          Ceramik
        </span>
        <ChevronRight className="size-3 text-zinc-600" />
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-zinc-900/80 px-2 py-1.5 text-[9px] text-zinc-600">
        <Search className="size-3" />
        <span className="truncate">Search leads...</span>
      </div>
      <nav className="mt-2 space-y-0.5">
        {primaryItems.map((item) => (
          <SidebarItem key={item.id} {...item} />
        ))}
        <SidebarItem id="outreach" icon={CalendarDays} label={labels.outreach} />
        <p className="px-2 pb-1 pt-4 text-[8px] font-semibold uppercase tracking-[0.15em] text-zinc-700">
          Discovery
        </p>
        <SidebarItem id="discovery" icon={Radar} label={labels.discover} />
      </nav>
    </aside>
  );
}

function ViewHeader({
  eyebrow,
  title,
  detail,
  icon: Icon = Sparkles,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  icon?: typeof Sparkles;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-white/[0.06] bg-[#090a09]/80 px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="min-w-0">
        <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-400">
          {eyebrow}
        </p>
        <h3 className="mt-1 truncate text-sm font-semibold tracking-tight text-zinc-100 sm:text-base">
          {title}
        </h3>
        {detail ? (
          <p className="mt-0.5 truncate text-[10px] text-zinc-500">{detail}</p>
        ) : null}
      </div>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-800/80 bg-zinc-900/70 text-emerald-300">
        <Icon className="size-4" />
      </span>
    </header>
  );
}

function BusinessRow({
  name,
  score,
  meta,
}: {
  name: string;
  score: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.05] px-3 py-2.5 last:border-0">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#49372e] text-[#d9aa91] ring-1 ring-white/[0.06]">
        <Building2 className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-medium text-zinc-200">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[9px] text-zinc-600">
          {meta}
        </span>
      </span>
      <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
        {score}
      </span>
    </div>
  );
}

function SectionPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-800/70 bg-zinc-950/45 p-3.5 ${className}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.11em] text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function ScoreDistribution({ label }: { label: string }) {
  return (
    <SectionPanel title={label}>
      <div className="relative mt-3 h-22">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <span
              key={line}
              className="block border-t border-dashed border-zinc-800/80"
            />
          ))}
        </div>
        <div className="absolute inset-x-[18%] bottom-0 top-3 flex items-end justify-center">
          <div className="h-[86%] w-[64%] rounded-t bg-emerald-500/80" />
        </div>
        <span className="absolute inset-x-0 -bottom-3 text-center text-[8px] text-zinc-600">
          4.5–5.0
        </span>
      </div>
    </SectionPanel>
  );
}

function DashboardScene({ copy }: { copy: DemoCopy }) {
  const l = copy.labels;
  return (
    <>
      <ViewHeader
        eyebrow={l.overview}
        title={copy.views.dashboard}
        detail={l.updated}
        icon={LayoutDashboard}
      />
      <div className="p-3.5 sm:p-5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Metric
            label={l.leads}
            value="10"
            note="10 high score"
            icon={Users}
          />
          <Metric
            label={l.averageScore}
            value="5.0"
            note="avg across all leads"
            icon={Star}
            accent="amber"
          />
          <Metric
            label={l.discoveryJobs}
            value="1"
            note="0 completed"
            icon={Radar}
            accent="sky"
          />
          <Metric
            label={l.enriched}
            value="10"
            note="100% of leads"
            icon={TrendingUp}
            accent="violet"
          />
        </div>
        <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-[1.25fr_0.75fr]">
          <ScoreDistribution label={l.scoreDistribution} />
          <SectionPanel
            title={l.contactAvailability}
            className="hidden sm:block"
          >
            <div className="mt-4 space-y-4">
              <ProgressRow label={l.website} value={10} total={10} suffix="/10" />
              <ProgressRow label={l.email} value={9} total={10} suffix="/10" />
              <ProgressRow label={l.phone} value={4} total={10} suffix="/10" />
            </div>
          </SectionPanel>
        </div>
        <div className="mt-3 hidden overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/45 sm:block">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.11em] text-zinc-500">
              {l.recentLeads}
            </p>
            <ChevronRight className="size-3 text-zinc-600" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
            <BusinessRow
              name={businesses[0]}
              score="5.0"
              meta="San Francisco, CA"
            />
            <BusinessRow
              name={businesses[1]}
              score="5.0"
              meta="San Francisco, CA"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function DiscoveryScene({ copy }: { copy: DemoCopy }) {
  const l = copy.labels;
  return (
    <>
      <ViewHeader
        eyebrow={l.discoveryReport}
        title={l.discoveryQuery}
        detail={`10 ${l.verifiedBusinesses}`}
        icon={Radar}
      />
      <div className="p-3.5 sm:p-5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Metric label={l.leads} value="10" icon={Users} />
          <Metric
            label={l.averageScore}
            value="5.0"
            icon={Star}
            accent="amber"
          />
          <Metric
            label={l.enriched}
            value="10"
            icon={Radar}
            accent="sky"
          />
          <Metric
            label={l.rating}
            value="4.7"
            icon={Star}
            accent="violet"
          />
        </div>
        <SectionPanel title={l.scoreDistribution} className="mt-3 sm:mt-4">
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              ["High (4+)", 10, "bg-emerald-500"],
              ["Medium (3–4)", 0, "bg-amber-500"],
              ["Low (<3)", 0, "bg-rose-500"],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="flex items-center justify-between gap-2 text-[8px] text-zinc-500">
                  <span className="truncate">{label}</span>
                  <span>{value}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: value === 10 ? "100%" : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SectionPanel title={l.contactAvailability}>
            <div className="mt-3 space-y-3">
              <ProgressRow label={l.website} value={10} total={10} suffix="/10" />
              <ProgressRow label={l.email} value={9} total={10} suffix="/10" />
              <ProgressRow label={l.phone} value={4} total={10} suffix="/10" />
            </div>
          </SectionPanel>
          <SectionPanel title={l.sourceCoverage} className="hidden sm:block">
            <div className="mt-3">
              <ProgressRow
                label="Google Places"
                value={10}
                total={10}
                suffix="/10"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-zinc-800/70 pt-3">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span className="text-[9px] text-zinc-500">
                {l.evidenceNote}
              </span>
            </div>
          </SectionPanel>
        </div>
      </div>
    </>
  );
}

function ScoringScene({ copy }: { copy: DemoCopy }) {
  const l = copy.labels;
  const signals = [
    [l.reach, 3, "bg-emerald-500", "bg-emerald-500/[0.07]"],
    [l.trust, 4, "bg-sky-500", "bg-sky-500/[0.07]"],
    [l.engage, 4, "bg-violet-500", "bg-violet-500/[0.07]"],
    [l.match, 3, "bg-amber-500", "bg-amber-500/[0.07]"],
    [l.ready, 3, "bg-rose-500", "bg-rose-500/[0.07]"],
    [l.fit, 4, "bg-teal-500", "bg-teal-500/[0.07]"],
  ] as const;

  return (
    <>
      <ViewHeader
        eyebrow={l.leadProfile}
        title={copy.views.scoring}
        detail={`Leads / ${businesses[0]}`}
        icon={Target}
      />
      <div className="space-y-3 p-3.5 sm:p-5">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/45 p-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#49372e] text-[#d9aa91] ring-1 ring-white/[0.08]">
            <Building2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] text-emerald-300 ring-1 ring-emerald-500/20">
                <span className="size-1 rounded-full bg-emerald-400" />
                {l.new}
              </span>
              <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[8px] text-zinc-400">
                {l.enriched}
              </span>
            </div>
            <p className="mt-1.5 truncate text-sm font-semibold tracking-tight text-zinc-100">
              {businesses[0]}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[9px] text-zinc-600">
              <MapPin className="size-2.5" />
              San Francisco, United States
            </p>
            <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
              <span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-[8px] text-zinc-400">
                <Star className="mr-1 inline size-2.5 text-amber-400" />
                4.6 (20)
              </span>
              <span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-[8px] text-zinc-400">
                <ListChecks className="mr-1 inline size-2.5 text-emerald-400" />
                12 {l.services}
              </span>
              <span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-[8px] text-zinc-400">
                <Radar className="mr-1 inline size-2.5 text-emerald-400" />
                Google Places
              </span>
            </div>
          </div>
          <div className="shrink-0 rounded-xl border border-zinc-800/70 bg-zinc-900/50 px-3 py-2 text-right ring-1 ring-zinc-800/70">
            <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              Score
            </span>
            <span className="text-2xl font-semibold tracking-[-0.05em] text-emerald-400">
              5.0
            </span>
            <span className="text-[9px] text-zinc-600">/5</span>
          </div>
        </div>

        <SectionPanel title={l.scoreEvidence}>
          <div className="mt-3 grid grid-cols-6 gap-2 sm:gap-3">
            {signals.map(([label, value, activeColor, emptyColor]) => (
              <div
                key={label}
                className="flex min-w-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`text-[9px] font-semibold ${
                    value >= 4 ? "text-zinc-200" : "text-zinc-400"
                  }`}
                >
                  {value}/5
                </span>
                <div className="flex w-full max-w-9 flex-col-reverse gap-[3px]">
                  {[0, 1, 2, 3, 4].map((segment) => (
                    <span
                      key={segment}
                      className={`h-1.5 w-full rounded-sm ${
                        segment < value ? activeColor : emptyColor
                      }`}
                    />
                  ))}
                </div>
                <span className="max-w-full truncate text-[8px] font-medium text-zinc-600">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </SectionPanel>
        <div className="hidden grid-cols-2 gap-3 lg:grid">
          <SectionPanel title={l.dataSource}>
            <p className="mt-2 text-[9px] text-zinc-400">
              Google Places · Public business profile
            </p>
          </SectionPanel>
          <SectionPanel title={l.serviceTags}>
            <div className="mt-2 flex gap-1.5">
              {["Pottery classes", "Workshops", "Memberships"].map(
                (service) => (
                  <span
                    key={service}
                    className="rounded-md bg-zinc-800/70 px-2 py-1 text-[8px] text-zinc-500"
                  >
                    {service}
                  </span>
                ),
              )}
            </div>
          </SectionPanel>
        </div>
      </div>
    </>
  );
}

function StatusLine({
  icon: Icon,
  label,
  status,
  positive = true,
}: {
  icon: typeof Mail;
  label: string;
  status: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 last:border-0">
      <span className="grid size-7 place-items-center rounded-lg bg-zinc-900 text-zinc-500 ring-1 ring-zinc-800/70">
        <Icon className="size-3.5" />
      </span>
      <span className="flex-1 text-[10px] text-zinc-300">{label}</span>
      <span
        className={`flex items-center gap-1 text-[9px] ${
          positive ? "text-emerald-400" : "text-zinc-600"
        }`}
      >
        {positive ? <Check className="size-3" /> : null}
        {status}
      </span>
    </div>
  );
}

function EnrichmentScene({ copy }: { copy: DemoCopy }) {
  const l = copy.labels;
  return (
    <>
      <ViewHeader
        eyebrow={l.enrichmentCoverage}
        title={businesses[0]}
        detail={l.updated}
        icon={Sparkles}
      />
      <div className="grid gap-3 p-3.5 sm:p-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/45 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-200">
              {l.companySignals}
            </p>
            <span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-[9px] font-medium text-emerald-300 ring-1 ring-emerald-500/15">
              100% {l.enriched.toLowerCase()}
            </span>
          </div>
          <div className="mt-3">
            <StatusLine icon={Globe2} label={l.website} status={l.found} />
            <StatusLine icon={Phone} label={l.phone} status={l.found} />
            <StatusLine icon={Mail} label={l.email} status={l.found} />
            <StatusLine
              icon={Users}
              label={l.socialProfile}
              status={l.missing}
              positive={false}
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/45 p-4">
            <p className="text-[11px] font-medium text-zinc-200">
              {l.serviceTags}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "Pottery classes",
                "Ceramic studio",
                "Workshops",
                "Private events",
                "Memberships",
                "Retail",
              ].map((service) => (
                <span
                  key={service}
                  className="rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1.5 text-[9px] text-zinc-400"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden rounded-xl border border-zinc-800/70 bg-zinc-950/45 p-4 sm:block">
            <p className="text-[11px] font-medium text-zinc-200">
              {l.sourceCoverage}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Google Places", l.website, l.companySignals].map((source) => (
                <div
                  key={source}
                  className="rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3 text-center"
                >
                  <CircleCheck className="mx-auto size-4 text-emerald-400" />
                  <p className="mt-2 truncate text-[8px] text-zinc-500">
                    {source}
                  </p>
                  <p className="mt-0.5 text-[8px] text-emerald-400">
                    {l.synced}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function OutreachScene({ copy }: { copy: DemoCopy }) {
  const l = copy.labels;
  return (
    <>
      <ViewHeader
        eyebrow={l.outreachQueue}
        title={businesses[0]}
        detail={l.approvalRequired}
        icon={MessageCircle}
      />
      <div className="grid gap-3 p-3.5 sm:p-5 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="hidden overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/45 lg:block">
          <div className="border-b border-white/[0.06] px-3 py-2.5 text-[10px] font-medium text-zinc-400">
            {l.outreachQueue}
          </div>
          {businesses.slice(0, 3).map((business, index) => (
            <div
              key={business}
              className={`border-b border-white/[0.05] p-3 last:border-0 ${
                index === 0 ? "bg-zinc-800/50" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1 size-1.5 shrink-0 rounded-full ${
                    index === 0 ? "bg-emerald-400" : "bg-zinc-700"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[9px] text-zinc-300">
                    {business}
                  </span>
                  <span className="mt-1 block text-[8px] text-zinc-600">
                    {index === 0 ? l.awaitingApproval : l.draft}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/45">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <p className="text-[10px] font-medium text-zinc-200">
                {l.sequence}
              </p>
              <p className="mt-0.5 text-[8px] text-zinc-600">
                {l.personalize}
              </p>
            </div>
            <span className="rounded-md border border-amber-300/15 bg-amber-300/[0.06] px-2 py-1 text-[8px] text-amber-200">
              {l.draft}
            </span>
          </div>
          <div className="space-y-2.5 p-3 sm:p-4">
            {[1, 2, 3].map((step, index) => (
              <div
                key={step}
                className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-3"
              >
                <span className="grid size-7 place-items-center rounded-lg border border-zinc-800 text-[9px] font-medium text-zinc-500">
                  {step}
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-medium text-zinc-300">
                    {l.step} {step}
                  </span>
                  <span className="mt-0.5 block truncate text-[8px] text-zinc-600">
                    {index === 0 ? l.email : index === 1 ? "WhatsApp" : l.email}
                  </span>
                </span>
                <span className="hidden items-center gap-1 text-[8px] text-zinc-500 sm:flex">
                  <Clock3 className="size-3" />
                  {index === 0 ? l.reviewed : `+${index * 2}d`}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
            <span className="flex items-center gap-1.5 text-[8px] text-amber-200">
              <ShieldCheck className="size-3.5" />
              {l.awaitingApproval}
            </span>
            <span className="rounded-lg bg-emerald-400 px-3 py-1.5 text-[8px] font-semibold text-zinc-950">
              {l.sendAfterApproval}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function PipelineCard({
  name,
  score,
}: {
  name: string;
  score: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/60 p-2.5">
      <div className="flex items-start gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#49372e] text-[#d9aa91]">
          <Building2 className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <p className="line-clamp-1 min-w-0 flex-1 text-[9px] font-medium leading-4 text-zinc-300">
              {name}
            </p>
            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-400">
              {score}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[8px] text-zinc-600">
            <MapPin className="size-2.5" />
            San Francisco, United States
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-zinc-600">
            <Globe2 className="size-2.5" />
            <Mail className="size-2.5" />
            <Phone className="size-2.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineScene({ copy }: { copy: DemoCopy }) {
  const l = copy.labels;
  const columns = [
    { label: l.new, count: 10, leads: businesses.slice(0, 3) },
    { label: l.contacted, count: 0, leads: [] },
    { label: l.interested, count: 0, leads: [] },
  ];
  return (
    <>
      <ViewHeader
        eyebrow={l.pipeline}
        title={copy.views.pipeline}
        detail={`10 ${l.accounts}`}
        icon={Workflow}
      />
      <div className="grid grid-cols-2 gap-2 p-3.5 sm:grid-cols-3 sm:gap-3 sm:p-5">
        {columns.map((column, columnIndex) => (
          <div
            key={column.label}
            className={`overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-900/30 ${
              columnIndex === 2 ? "hidden sm:block" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/60 px-3 py-2.5">
              <span className="flex items-center gap-2 text-[10px] font-medium text-zinc-300">
                <span
                  className={`size-1.5 rounded-full ${
                    columnIndex === 0
                      ? "bg-emerald-400"
                      : columnIndex === 1
                        ? "bg-sky-400"
                        : "bg-amber-300"
                  }`}
                />
                {column.label}
              </span>
              <span className="min-w-5 rounded-md bg-zinc-800/70 px-1.5 py-0.5 text-center text-[8px] text-zinc-500">
                {column.count}
              </span>
            </div>
            <div className="space-y-2 p-2">
              {column.leads.length > 0 ? (
                column.leads.map((lead) => (
                  <PipelineCard key={lead} name={lead} score="5.0" />
                ))
              ) : (
                <div className="grid h-14 place-items-center rounded-lg border border-dashed border-zinc-800/70 text-[8px] text-zinc-700">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function WorkflowStep({
  icon: Icon,
  label,
  value,
  last = false,
}: {
  icon: typeof Radar;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <div className="flex items-center">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300">
          <Icon className="size-3.5" />
        </span>
        {!last ? (
          <span className="mx-2 h-px flex-1 bg-zinc-800 sm:mx-3" />
        ) : null}
      </div>
      <p className="mt-3 text-[9px] font-medium text-zinc-300">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function CaseStudyScene({ copy }: { copy: DemoCopy }) {
  const l = copy.labels;
  return (
    <>
      <ViewHeader
        eyebrow="Ceramik"
        title={l.workflowSnapshot}
        detail={l.evidenceNote}
        icon={Building2}
      />
      <div className="p-3.5 sm:p-5">
        <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/45 p-4 sm:p-5">
          <div className="flex">
            <WorkflowStep icon={Radar} label={l.discovered} value="10" />
            <WorkflowStep icon={Target} label={l.qualified} value="5.0" />
            <WorkflowStep
              icon={Sparkles}
              label={l.enriched}
              value="100%"
            />
            <WorkflowStep
              icon={Workflow}
              label={l.organized}
              value="10"
              last
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/45">
            <div className="border-b border-white/[0.06] px-3 py-2.5 text-[10px] font-medium text-zinc-400">
              {l.recentLeads}
            </div>
            <div className="grid sm:grid-cols-2">
              <BusinessRow
                name={businesses[0]}
                score="5.0"
                meta="San Francisco, CA"
              />
              <BusinessRow
                name={businesses[1]}
                score="5.0"
                meta="San Francisco, CA"
              />
            </div>
          </div>
          <div className="hidden rounded-xl border border-zinc-800/70 bg-zinc-950/45 p-4 sm:block">
            <p className="text-[10px] font-medium text-zinc-300">
              {l.contactAvailability}
            </p>
            <div className="mt-3 space-y-3">
              <ProgressRow label={l.website} value={10} total={10} suffix="/10" />
              <ProgressRow label={l.email} value={9} total={10} suffix="/10" />
              <ProgressRow label={l.phone} value={4} total={10} suffix="/10" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Scene({
  variant,
  copy,
}: {
  variant: DemoVariant;
  copy: DemoCopy;
}) {
  const scenes: Record<DemoVariant, ReactNode> = {
    dashboard: <DashboardScene copy={copy} />,
    discovery: <DiscoveryScene copy={copy} />,
    scoring: <ScoringScene copy={copy} />,
    enrichment: <EnrichmentScene copy={copy} />,
    outreach: <OutreachScene copy={copy} />,
    pipeline: <PipelineScene copy={copy} />,
    "case-study": <CaseStudyScene copy={copy} />,
  };

  return (
    <div className="h-full bg-[#080908]">
      <div className="flex h-11 items-center justify-between border-b border-zinc-800/70 px-4 md:hidden">
        <span className="flex items-center gap-2">
          <ScoreLeadLogo className="size-4 text-zinc-100" />
          <span className="text-[11px] font-semibold text-zinc-100">
            ScoreLead
          </span>
          <span className="text-[9px] text-zinc-600">/</span>
          <span className="truncate text-[9px] text-zinc-500">
            {copy.views[variant]}
          </span>
        </span>
        <span className="size-1.5 rounded-full bg-emerald-400" />
      </div>
      <div className="grid h-[calc(100%-2.75rem)] md:h-full md:grid-cols-[8.75rem_minmax(0,1fr)]">
        <DemoSidebar active={variant} labels={copy.labels} />
        <div className="min-w-0 overflow-hidden bg-[radial-gradient(circle_at_42%_0%,rgba(16,185,129,0.045),transparent_34%),#090b0a] md:rounded-l-xl md:border md:border-zinc-800/70">
          {scenes[variant]}
        </div>
      </div>
    </div>
  );
}

export function MarketingPlatformImage({
  page,
  locale,
}: {
  page: MarketingPage;
  locale: MarketingLocale;
}) {
  const variant = pageDemoVariants[page.id] ?? "dashboard";
  const copy = demoCopy[locale];
  const description = demoDescriptions[locale][variant];

  return (
    <figure className="mt-12 sm:mt-16">
      <div className="relative">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-zinc-800/80 bg-[#070807] p-1 shadow-[0_34px_90px_-52px_rgba(16,185,129,0.22),0_28px_70px_-44px_rgba(0,0,0,0.95)]">
          <div
            role="img"
            aria-label={description.alt}
            className={`${demoViewportHeight[variant]} overflow-hidden rounded-[1.05rem] bg-[#080908]`}
          >
            <div aria-hidden="true" className="h-full">
              <Scene variant={variant} copy={copy} />
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-4 flex flex-col gap-3 text-sm leading-6 text-zinc-500 sm:flex-row sm:items-start sm:justify-between">
        <span className="max-w-3xl">{description.caption}</span>
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          <span aria-hidden="true" className="size-1 rounded-full bg-emerald-400" />
          {copy.workspace}
        </span>
      </figcaption>
    </figure>
  );
}
