"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
  type Connection,
} from "@xyflow/react";
import {
  Bot,
  Search,
  Mail,
  MessageCircle,
  ArrowRightLeft,
  Plus,
  Pause,
  Play,
  Save,
  ArrowRight,
  Check,
  ChevronRight,
  List,
  Workflow,
  Loader2,
  Trash2,
  Clock,
  Activity,
  Grip,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessId } from "@/components/admin/business-context";
import { PageHeader } from "@/components/admin/page-header";
import { ContentWrapper } from "@/components/admin/content-wrapper";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  UnsavedNavigationProvider,
  useUnsavedNavigation,
} from "@/components/admin/unsaved-navigation";
import { AgentEditor, Choice, Toggle } from "./agent-editor";
import {
  graphSchema,
  newAgent,
  type Agent,
  type AgentGraph,
  type AgentKind,
} from "@/lib/agents/model";
import "@xyflow/react/dist/style.css";
import "./agents.css";

type Workspace = {
  draft: AgentGraph;
  version: number;
  publishedRevisionId: string | null;
  publishedAgentIds?: string[];
  paused: boolean;
  pausedAgentIds: string[];
};
type Snapshot = {
  workspace: Workspace;
  counters: { agentId: string; status: string; count: number }[];
  templates: { id: string; name: string; language: string }[];
  jobs: { id: string; name: string }[];
  workerEnabled: boolean;
  heartbeat: string | null;
};
type Preview = {
  revisionId: string | null;
  agents: {
    id: string;
    total: number;
    samples: { id: string; name: string | null }[];
  }[];
  validation: string | null;
  workerEnabled: boolean;
};
type HistoryItem = {
  id: string;
  kind?: string;
  status?: string;
  createdAt: string;
  result?: string;
  leadName?: string;
  deliveryStatus?: string;
  providerMessageId?: string;
  requestStartedAt?: string;
  prepared?: { body?: string; subject?: string };
  detail?: Record<string, unknown>;
};
type CardData = {
  agent: Agent;
  state: string;
  done: number;
  queued: number;
  attention: number;
  open: () => void;
};
const icons = {
  discovery: Search,
  email: Mail,
  whatsapp: MessageCircle,
  stage: ArrowRightLeft,
};
const kinds: AgentKind[] = ["discovery", "email", "whatsapp", "stage"];
const initialGraph: AgentGraph = { nodes: [], edges: [] };
function AgentCard({ data, selected }: { data: CardData; selected?: boolean }) {
  const t = useTranslations("agents"),
    a = data.agent,
    Icon = icons[a.kind];
  const summary =
    a.kind === "discovery"
      ? a.location || t("discoveryDescription")
      : a.kind === "stage"
        ? `${t(a.from)} → ${t(a.to)}`
        : a.instructions || t(`${a.kind}Description`);
  return (
    <article className={`agent-card ${selected ? "agent-card-selected" : ""}`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${a.kind === "whatsapp" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            {t(a.kind)}
          </p>
          <h2 className="mt-0.5 truncate text-sm font-semibold">{a.name}</h2>
        </div>
        <Grip className="size-4 text-zinc-300 dark:text-zinc-600" />
      </div>
      <p className="mt-4 line-clamp-2 min-h-10 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        {summary}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] ${data.state === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}
        >
          <span
            className={`size-1.5 rounded-full ${data.state === "active" ? "bg-emerald-500" : "bg-zinc-400"}`}
          />
          {t(data.state)}
        </span>
        <button
          className="nodrag nopan inline-flex cursor-pointer items-center gap-1 rounded-md p-1 text-xs text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
          onClick={data.open}
          aria-label={`${t("configure")}: ${a.name}`}
        >
          {t("configuration")}
          <ChevronRight className="size-3" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] tabular-nums text-zinc-500">
        <span>{t("completedCount", { count: data.done })}</span>
        <span>{t("queueCount", { count: data.queued })}</span>
        {data.attention > 0 && (
          <span className="text-amber-700 dark:text-amber-400">
            {t("reviewCount", { count: data.attention })}
          </span>
        )}
      </div>
    </article>
  );
}
function FlowNode({ data, selected }: NodeProps<Node<CardData>>) {
  const t = useTranslations("agents");
  return (
    <>
      {data.agent.kind !== "discovery" && (
        <Handle
          type="target"
          position={Position.Left}
          aria-label={t("connections")}
        />
      )}
      <AgentCard data={data} selected={selected} />
      <Handle type="source" position={Position.Right} aria-label={t("next")} />
    </>
  );
}
const nodeTypes = { agent: FlowNode };

export function AgentsWorkspace() {
  const businessId = useBusinessId();
  return (
    <UnsavedNavigationProvider namespace="agents">
      <WorkspaceCanvas key={businessId} businessId={businessId} />
    </UnsavedNavigationProvider>
  );
}
function WorkspaceCanvas({ businessId }: { businessId: string }) {
  const t = useTranslations("agents"),
    locale = useLocale();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [graph, setGraph] = useState<AgentGraph>(initialGraph),
    [saved, setSaved] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState("configuration"),
    [list, setList] = useState(false),
    [preview, setPreview] = useState<Preview | null>(null),
    [includeCurrent, setIncludeCurrent] = useState(false),
    [removing, setRemoving] = useState(false);
  const [allMatching, setAllMatching] = useState(false);
  const [previewSamples, setPreviewSamples] = useState<
    Record<string, { subject?: string; body?: string }>
  >({});
  const [runOpen, setRunOpen] = useState(false),
    [runLeads, setRunLeads] = useState<string[]>([]),
    [sampleId, setSampleId] = useState(""),
    [sample, setSample] = useState<{ subject?: string; body?: string } | null>(
      null,
    ),
    [candidatePreview, setCandidatePreview] = useState<Preview | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [historyBusy, setHistoryBusy] = useState(false),
    [historyError, setHistoryError] = useState(false);
  const flow = useRef<Pick<
      ReactFlowInstance<Node<CardData>>,
      "screenToFlowPosition"
    > | null>(null),
    mounted = useRef(true),
    graphRef = useRef(graph),
    runRequest = useRef(crypto.randomUUID());
  graphRef.current = graph;
  const { setDirty } = useUnsavedNavigation();
  const dirty = !!snapshot && JSON.stringify(graph) !== saved,
    agent = graph.nodes.find((n) => n.id === selected);
  const url = `/api/businesses/${businessId}/agents`;
  const message = useCallback(
    (code: string) =>
      code === "VERSION_CONFLICT"
        ? t("conflict")
        : t.has(`errors.${code}`)
          ? t(`errors.${code}`)
          : t("error"),
    [t],
  );
  const api = useCallback(
    async (
      path = "",
      body?: unknown,
      method = "POST",
      signal?: AbortSignal,
    ) => {
      const response = await fetch(url + path, {
        method: body ? method : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "REQUEST_FAILED");
      return result;
    },
    [url],
  );
  const load = useCallback(
    async (replace = false, signal?: AbortSignal) => {
      const data: Snapshot = await api("", undefined, "GET", signal);
      if (!mounted.current) return;
      setSnapshot((previous) =>
        replace
          ? data
          : {
              ...data,
              workspace: {
                ...data.workspace,
                version: previous?.workspace.version ?? data.workspace.version,
              },
            },
      );
      if (replace) {
        setGraph(data.workspace.draft);
        setSaved(JSON.stringify(data.workspace.draft));
        setError("");
      }
    },
    [api],
  );
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    load(true, controller.signal).catch((e) => {
      if (!controller.signal.aborted) setError(e.message);
    });
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [load]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) load().catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [load]);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 767px)");
    setList(m.matches);
  }, []);
  useEffect(() => {
    setDirty(businessId, dirty);
    return () => setDirty(businessId, false);
  }, [businessId, dirty, setDirty]);
  const act = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      const code = e instanceof Error ? e.message : "REQUEST_FAILED";
      setError(code);
      toast.error(message(code));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const save = async () => {
    const submittedGraph = graphRef.current;
    const parsed = graphSchema.safeParse(submittedGraph);
    if (!parsed.success) throw new Error("INVALID_GRAPH");
    const data = await api(
      "",
      { graph: parsed.data, version: snapshot?.workspace.version ?? 0 },
      "PUT",
    );
    setSnapshot((s) =>
      s
        ? {
            ...s,
            workspace: {
              ...data.workspace,
              publishedAgentIds: s.workspace.publishedAgentIds,
            },
          }
        : s,
    );
    if (graphRef.current === submittedGraph) setGraph(data.workspace.draft);
    setSaved(JSON.stringify(data.workspace.draft));
    return data.workspace as Workspace;
  };
  const changeGraph = (g: AgentGraph) => {
    setGraph(g);
    setSample(null);
    setCandidatePreview(null);
  };
  const add = (kind: AgentKind, position?: { x: number; y: number }) => {
    const a = newAgent(kind, t(kind), graph.nodes.length);
    if (position) a.position = position;
    changeGraph({ ...graph, nodes: [...graph.nodes, a] });
    setSelected(a.id);
    setTab("configuration");
  };
  const connect = (c: Connection) => {
    if (!c.source || !c.target) return;
    const next = {
      ...graph,
      edges: [
        ...graph.edges.filter((e) => !e.fallback),
        {
          id: crypto.randomUUID(),
          source: c.source,
          target: c.target,
          condition: {
            outcome: "any" as const,
            channel: "any" as const,
            minScore: 0,
          },
          fallback: false,
        },
        ...graph.edges.filter((e) => e.fallback),
      ],
    };
    if (graphSchema.safeParse(next).success) changeGraph(next);
    else toast.error(message("INVALID_GRAPH"));
  };
  const open = (id: string) => {
    setSelected(id);
    setTab("configuration");
    setSample(null);
    setSampleId("");
    setCandidatePreview(null);
    setHistory([]);
  };
  const counters = (id: string) => {
    const rows = snapshot?.counters.filter((c) => c.agentId === id) ?? [];
    const sum = (statuses: string[]) =>
      rows
        .filter((r) => statuses.includes(r.status))
        .reduce((n, r) => n + r.count, 0);
    return {
      done: sum(["succeeded"]),
      queued: sum(["queued", "preparing", "waiting", "sending"]),
      attention: sum(["needs_review", "failed", "blocked"]),
    };
  };
  const cardData = (a: Agent): CardData => ({
    agent: a,
    state:
      !snapshot?.workspace.publishedRevisionId ||
      !snapshot.workspace.publishedAgentIds?.includes(a.id)
        ? "draft"
        : snapshot.workspace.paused ||
            snapshot.workspace.pausedAgentIds.includes(a.id)
          ? "paused"
          : "active",
    ...counters(a.id),
    open: () => open(a.id),
  });
  const nodes = graph.nodes.map((a) => ({
    id: a.id,
    type: "agent",
    position: a.position,
    data: cardData(a),
    selected: selected === a.id,
    ariaLabel: a.name,
  }));
  const edges = useMemo(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        ariaLabel: `${graph.nodes.find((n) => n.id === e.source)?.name} → ${graph.nodes.find((n) => n.id === e.target)?.name}`,
        animated:
          snapshot?.counters.some(
            (c) =>
              c.agentId === e.source &&
              ["preparing", "sending"].includes(c.status) &&
              c.count > 0,
          ) ?? false,
        label: e.fallback
          ? t("fallback")
          : e.condition.channel !== "any"
            ? t(e.condition.channel)
            : e.condition.outcome !== "any"
              ? t(e.condition.outcome)
              : undefined,
        style: { stroke: "var(--agent-edge)", strokeWidth: 1.5 },
        labelStyle: { fill: "var(--agent-text)", fontSize: 10 },
        labelBgStyle: { fill: "var(--agent-bg)" },
        labelBgPadding: [6, 4] as [number, number],
      })),
    [graph.edges, graph.nodes, snapshot?.counters, t],
  );
  const loadHistory = useCallback(
    async (next?: string, signal?: AbortSignal) => {
      if (!selected || tab === "configuration") return;
      setHistoryBusy(true);
      setHistoryError(false);
      try {
        const result = await api(
          `?view=${tab}&agentId=${selected}${next ? `&cursor=${encodeURIComponent(next)}` : ""}`,
          undefined,
          "GET",
          signal,
        );
        if (!signal?.aborted) {
          setHistory((prev) =>
            next ? [...prev, ...result.items] : result.items,
          );
          setCursor(result.nextCursor);
        }
      } catch {
        if (!signal?.aborted) setHistoryError(true);
      } finally {
        if (!signal?.aborted) setHistoryBusy(false);
      }
    },
    [selected, tab, api],
  );
  useEffect(() => {
    setHistory([]);
    setCursor(null);
    const controller = new AbortController();
    loadHistory(undefined, controller.signal);
    return () => controller.abort();
  }, [loadHistory]);
  const getPreview = async () => {
    const w = dirty ? await save() : snapshot!.workspace;
    return (await api("", {
      action: "preview",
      version: w.version,
    })) as Preview;
  };
  const paused = !!snapshot?.workspace.paused,
    agentPaused =
      paused || !!snapshot?.workspace.pausedAgentIds.includes(selected ?? "");
  const samples =
    candidatePreview?.agents.find((a) => a.id === selected)?.samples ?? [];
  return (
    <ContentWrapper>
      <div className="agents-workspace">
        <PageHeader
          title="Agents"
          description={t("description")}
          actions={
            <>
              <Button
                variant="outline"
                disabled={busy || !snapshot || !dirty}
                onClick={() =>
                  act(async () => {
                    await save();
                    toast.success(t("saved"));
                  })
                }
              >
                <Save />
                {t("save")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={!snapshot || graph.nodes.length >= 50}>
                    <Plus />
                    {t("add")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {kinds.map((kind) => {
                    const Icon = icons[kind];
                    return (
                      <DropdownMenuItem key={kind} onSelect={() => add(kind)}>
                        <Icon />
                        {t(kind)}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            <span>{message(error)}</span>
            {(!snapshot || error === "VERSION_CONFLICT") && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => act(() => load(true))}
              >
                {t(error === "VERSION_CONFLICT" ? "reload" : "retry")}
              </Button>
            )}
          </div>
        )}
        {!snapshot && !error && (
          <div className="flex min-h-96 items-center justify-center gap-3 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" />
            {t("loading")}
          </div>
        )}
        {snapshot && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span
                  className={`inline-flex items-center gap-1.5 ${dirty ? "text-amber-700 dark:text-amber-400" : ""}`}
                >
                  {dirty ? (
                    <span className="size-1.5 rounded-full bg-amber-500" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  {t(dirty ? "unsaved" : "saved")}
                </span>
                <span className="hidden h-3 w-px bg-zinc-200 sm:block dark:bg-zinc-700" />
                <span className="hidden sm:block">
                  {t("agentCount", { count: graph.nodes.length })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="mr-1 flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
                  <Button
                    size="icon-sm"
                    variant={!list ? "secondary" : "ghost"}
                    aria-label={t("canvas")}
                    aria-pressed={!list}
                    onClick={() => setList(false)}
                  >
                    <Workflow />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant={list ? "secondary" : "ghost"}
                    aria-label={t("list")}
                    aria-pressed={list}
                    onClick={() => setList(true)}
                  >
                    <List />
                  </Button>
                </div>
                {snapshot.workspace.publishedRevisionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    title={t("pauseHint")}
                    onClick={() =>
                      act(async () => {
                        await api("", { action: "pause", paused: !paused });
                        await load();
                      })
                    }
                  >
                    {paused ? <Play /> : <Pause />}
                    {t(paused ? "resumeAll" : "pauseAll")}
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={busy || !graph.nodes.length}
                  onClick={() =>
                    act(async () => {
                      setPreviewSamples({});
                      setPreview(await getPreview());
                      setIncludeCurrent(false);
                    })
                  }
                >
                  <Play />
                  {t("publish")}
                </Button>
              </div>
            </div>
            {!snapshot.workerEnabled && (
              <p className="mb-4 flex items-start gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                <Clock className="mt-0.5 size-4 shrink-0" />
                {t("workerDisabled")}
              </p>
            )}
            {!graph.nodes.length ? (
              <div className="agent-empty relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 px-6 py-16 text-center dark:border-zinc-800">
                <div
                  className="relative mb-10 flex items-center gap-3"
                  aria-hidden="true"
                >
                  {[Search, Mail, ArrowRightLeft].map((Icon, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`flex size-16 items-center justify-center rounded-2xl border bg-white shadow-sm dark:bg-zinc-900 ${i === 1 ? "border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400" : "border-zinc-200 text-zinc-400 dark:border-zinc-700"}`}
                      >
                        <Icon className="size-6" />
                      </div>
                      {i < 2 && (
                        <span className="h-px w-6 bg-zinc-300 dark:bg-zinc-700" />
                      )}
                    </div>
                  ))}
                </div>
                <h2 className="relative max-w-md text-balance text-2xl font-semibold tracking-tight">
                  {t("emptyTitle")}
                </h2>
                <p className="relative mt-4 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {t("emptyBody")}
                </p>
                <Button
                  className="relative mt-7 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => {
                    const d = newAgent("discovery", t("discovery")),
                      e = newAgent("email", t("email"), 1),
                      w = newAgent("whatsapp", t("whatsapp"), 1);
                    e.position.y = 40;
                    w.position.y = 340;
                    changeGraph({
                      nodes: [d, e, w],
                      edges: [
                        {
                          id: crypto.randomUUID(),
                          source: d.id,
                          target: e.id,
                          fallback: false,
                          condition: {
                            outcome: "success",
                            channel: "email",
                            minScore: 0,
                          },
                        },
                        {
                          id: crypto.randomUUID(),
                          source: d.id,
                          target: w.id,
                          fallback: false,
                          condition: {
                            outcome: "success",
                            channel: "whatsapp",
                            minScore: 0,
                          },
                        },
                      ],
                    });
                  }}
                >
                  {t("starter")}
                  <ArrowRight />
                </Button>
                <p className="relative mt-4 text-xs text-zinc-500">
                  {t("draftHint")}
                </p>
              </div>
            ) : list ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {graph.nodes.map((a) => (
                  <div key={a.id}>
                    <AgentCard
                      data={cardData(a)}
                      selected={selected === a.id}
                    />
                    <div className="flex flex-wrap gap-2 px-4 py-3 text-xs text-zinc-500">
                      {graph.edges
                        .filter((e) => e.source === a.id)
                        .map((e) => (
                          <button
                            key={e.id}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md p-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:hover:bg-zinc-800"
                            onClick={() => open(e.target)}
                          >
                            <ArrowRight className="size-3" />
                            {graph.nodes.find((n) => n.id === e.target)?.name}
                          </button>
                        ))}
                      {!graph.edges.some((e) => e.source === a.id) &&
                        t("noConnection")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="agent-canvas h-[calc(100dvh-310px)] min-h-[420px] max-h-[900px] overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const kind = e.dataTransfer.getData(
                    "application/scorelead-agent",
                  ) as AgentKind;
                  if (kinds.includes(kind) && flow.current)
                    add(
                      kind,
                      flow.current.screenToFlowPosition({
                        x: e.clientX,
                        y: e.clientY,
                      }),
                    );
                }}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onInit={(instance) => {
                    flow.current = instance;
                  }}
                  onNodesChange={(changes) => {
                    const positions = new Map(
                      changes.flatMap((c) =>
                        c.type === "position" && c.position
                          ? [[c.id, c.position] as const]
                          : [],
                      ),
                    );
                    if (positions.size)
                      setGraph((g) => ({
                        ...g,
                        nodes: g.nodes.map((n) =>
                          positions.has(n.id)
                            ? { ...n, position: positions.get(n.id)! }
                            : n,
                        ),
                      }));
                  }}
                  onNodeClick={(_, n) => open(n.id)}
                  onConnect={connect}
                  isValidConnection={(c) =>
                    graphSchema.safeParse({
                      ...graph,
                      edges: [
                        ...graph.edges.filter((e) => !e.fallback),
                        {
                          id: crypto.randomUUID(),
                          source: c.source,
                          target: c.target,
                          condition: {
                            outcome: "any",
                            channel: "any",
                            minScore: 0,
                          },
                          fallback: false,
                        },
                        ...graph.edges.filter((e) => e.fallback),
                      ],
                    }).success
                  }
                  deleteKeyCode={null}
                  minZoom={0.35}
                  maxZoom={1.6}
                  fitView
                  fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                  proOptions={{ hideAttribution: true }}
                  ariaLabelConfig={{
                    "node.a11yDescription.default": t("nodeHelp"),
                    "node.a11yDescription.keyboardDisabled": t("configure"),
                    "node.a11yDescription.ariaLiveMessage": ({ x, y }) =>
                      t("moved", { x, y }),
                    "edge.a11yDescription.default": t("edgeHelp"),
                    "controls.ariaLabel": t("canvas"),
                    "controls.zoomIn.ariaLabel": t("zoomIn"),
                    "controls.zoomOut.ariaLabel": t("zoomOut"),
                    "controls.fitView.ariaLabel": t("fit"),
                    "controls.interactive.ariaLabel": t("canvas"),
                    "handle.ariaLabel": t("connect"),
                    "minimap.ariaLabel": t("canvas"),
                  }}
                >
                  <Background gap={24} size={1} color="var(--agent-dot)" />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-zinc-500">{t("dragHint")}</p>
              <div className="flex gap-2">
                {kinds.map((kind) => {
                  const Icon = icons[kind];
                  return (
                    <Button
                      key={kind}
                      size="sm"
                      variant="ghost"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/scorelead-agent",
                          kind,
                        );
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      disabled={graph.nodes.length >= 50}
                      onClick={() => add(kind)}
                    >
                      <Icon />
                      <span className="hidden lg:inline">{t(kind)}</span>
                      <span className="sr-only lg:hidden">{t(kind)}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            {snapshot.workerEnabled && (
              <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <Activity className="size-3" />
                {t(
                  snapshot.heartbeat &&
                    Date.now() - Date.parse(snapshot.heartbeat) < 180000
                    ? "workerOnline"
                    : "workerOffline",
                )}
              </p>
            )}
          </>
        )}
        <Sheet
          open={!!agent}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <SheetContent
            className="w-full gap-0 p-0 sm:max-w-lg"
            closeLabel={t("close")}
          >
            <SheetHeader className="border-b border-zinc-200 p-6 dark:border-zinc-800">
              <SheetTitle className="flex items-center gap-2 pr-5">
                <Bot className="size-5 text-emerald-600" />
                {agent?.name}
              </SheetTitle>
              <SheetDescription>
                {agent ? t(`${agent.kind}Description`) : ""}
              </SheetDescription>
            </SheetHeader>
            {agent && snapshot && (
              <Tabs
                value={tab}
                onValueChange={setTab}
                className="flex min-h-0 flex-1 flex-col gap-0"
              >
                <TabsList className="mx-6 my-4 grid shrink-0 grid-cols-3">
                  {["configuration", "activity", "leads"].map((v) => (
                    <TabsTrigger key={v} value={v}>
                      {t(v)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                  <TabsContent value="configuration" className="m-0 space-y-6">
                    <AgentEditor
                      key={agent.id}
                      agent={agent}
                      graph={graph}
                      change={(a) =>
                        changeGraph({
                          ...graph,
                          nodes: graph.nodes.map((n) =>
                            n.id === a.id ? a : n,
                          ),
                        })
                      }
                      changeGraph={changeGraph}
                      templates={snapshot.templates}
                      jobs={snapshot.jobs}
                      onError={() => toast.error(message("INVALID_GRAPH"))}
                    />
                    <div
                      hidden={agent.kind === "discovery"}
                      className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800"
                    >
                      <h3 className="text-sm font-semibold">{t("example")}</h3>
                      <p className="text-xs text-zinc-500">
                        {t(
                          agent.kind === "stage"
                            ? "simulateStageHint"
                            : "simulateHint",
                        )}
                      </p>
                      {agent.kind !== "discovery" && (
                        <>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              act(async () => {
                                const p = await getPreview();
                                setCandidatePreview(p);
                                setSampleId(
                                  p.agents.find((a) => a.id === selected)
                                    ?.samples[0]?.id ?? "",
                                );
                              })
                            }
                          >
                            <RefreshCw />
                            {t("selectLead")}
                          </Button>
                          {candidatePreview &&
                            (!samples.length ? (
                              <p className="text-xs text-zinc-500">
                                {t("noMatchingLeads")}
                              </p>
                            ) : (
                              <>
                                <Choice
                                  value={sampleId}
                                  options={samples.map((s) => ({
                                    value: s.id,
                                    label: s.name || s.id,
                                  }))}
                                  onChange={(v) => {
                                    setSampleId(v);
                                    setSample(null);
                                  }}
                                />
                                <Button
                                  disabled={busy || dirty || !sampleId}
                                  onClick={() =>
                                    act(async () => {
                                      const result = await api("", {
                                        action: "simulate",
                                        agentId: agent.id,
                                        leadId: sampleId,
                                      });
                                      setSample(result.prepared);
                                    })
                                  }
                                >
                                  {busy ? (
                                    <Loader2 className="animate-spin" />
                                  ) : (
                                    <Play />
                                  )}
                                  {t("simulate")}
                                </Button>
                              </>
                            ))}
                        </>
                      )}
                      {sample && (
                        <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                          {sample.subject && (
                            <p className="font-semibold">{sample.subject}</p>
                          )}
                          <p className="whitespace-pre-wrap leading-6">
                            {sample.body ||
                              `${t("from")}: ${agent.kind === "stage" ? t(agent.from) : ""} → ${agent.kind === "stage" ? t(agent.to) : ""}`}
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={
                        busy ||
                        !snapshot.workspace.publishedRevisionId ||
                        agentPaused
                      }
                      onClick={() =>
                        act(async () => {
                          setCandidatePreview(
                            await api("", {
                              action: "preview",
                              version: snapshot.workspace.version,
                              published: true,
                            }),
                          );
                          setRunLeads([]);
                          setAllMatching(false);
                          runRequest.current = crypto.randomUUID();
                          setRunOpen(true);
                        })
                      }
                    >
                      <Play />
                      {t(agent.kind === "discovery" ? "runDiscovery" : "run")}
                    </Button>
                    <div className="flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800">
                      {snapshot.workspace.publishedRevisionId && (
                        <Button
                          variant="outline"
                          disabled={busy || paused}
                          title={t("pauseHint")}
                          onClick={() =>
                            act(async () => {
                              await api("", {
                                action: "pause",
                                agentId: agent.id,
                                paused: !agentPaused,
                              });
                              await load();
                            })
                          }
                        >
                          {agentPaused ? <Play /> : <Pause />}
                          {t(agentPaused ? "resume" : "pause")}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => setRemoving(true)}
                      >
                        <Trash2 />
                        {t("remove")}
                      </Button>
                    </div>
                  </TabsContent>
                  {["activity", "leads"].map((v) => (
                    <TabsContent key={v} value={v} className="m-0 space-y-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={historyBusy}
                        onClick={() => loadHistory()}
                      >
                        <RefreshCw />
                        {t("refresh")}
                      </Button>
                      {historyBusy && !history.length ? (
                        <p className="py-10 text-center text-sm text-zinc-500">
                          {t("loading")}
                        </p>
                      ) : historyError ? (
                        <p role="alert" className="text-sm text-red-600">
                          {t("error")}
                        </p>
                      ) : !history.length ? (
                        <p className="py-10 text-center text-sm text-zinc-500">
                          {t(v === "activity" ? "emptyActivity" : "emptyLeads")}
                        </p>
                      ) : (
                        history.map((h) => (
                          <div
                            key={h.id}
                            className="space-y-2 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800"
                          >
                            <div className="flex justify-between gap-3">
                              <p className="font-medium">
                                {h.leadName ||
                                  t(
                                    h.kind && t.has(h.kind)
                                      ? h.kind
                                      : h.status && t.has(h.status)
                                        ? h.status
                                        : "activity",
                                  )}
                              </p>
                              <time className="shrink-0 text-[11px] text-zinc-500">
                                {new Intl.DateTimeFormat(locale, {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }).format(new Date(h.createdAt))}
                              </time>
                            </div>
                            {h.status && (
                              <p className="text-xs text-zinc-500">
                                {t(h.status)}
                              </p>
                            )}
                            {h.result && t.has(`errors.${h.result}`) && (
                              <p className="text-xs text-zinc-500">
                                {message(h.result)}
                              </p>
                            )}
                            {h.deliveryStatus && (
                              <p className="mt-2 text-xs text-zinc-500">
                                {t("delivery")}:{" "}
                                {t.has(`deliveryStates.${h.deliveryStatus}`)
                                  ? t(`deliveryStates.${h.deliveryStatus}`)
                                  : h.deliveryStatus}
                              </p>
                            )}
                            {h.providerMessageId && (
                              <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">
                                {h.providerMessageId}
                              </p>
                            )}
                            {h.prepared?.body && (
                              <details>
                                <summary className="cursor-pointer text-xs text-emerald-600">
                                  {t("prepared")}
                                </summary>
                                <p className="mt-2 whitespace-pre-wrap text-xs leading-5">
                                  {h.prepared.subject}
                                  {"\n"}
                                  {h.prepared.body}
                                </p>
                              </details>
                            )}
                            {(!h.requestStartedAt || h.status === "waiting") &&
                              h.status &&
                              [
                                "blocked",
                                "failed",
                                "queued",
                                "preparing",
                                "waiting",
                              ].includes(h.status) && (
                                <div className="flex gap-2">
                                  {["blocked", "failed"].includes(h.status) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={busy}
                                      onClick={() =>
                                        act(async () => {
                                          await api("", {
                                            action: "retry",
                                            executionId: h.id,
                                          });
                                          await loadHistory();
                                        })
                                      }
                                    >
                                      {t("retry")}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={busy}
                                    onClick={() =>
                                      act(async () => {
                                        await api("", {
                                          action: "cancel",
                                          executionId: h.id,
                                        });
                                        await loadHistory();
                                      })
                                    }
                                  >
                                    {t("cancel")}
                                  </Button>
                                </div>
                              )}
                          </div>
                        ))
                      )}
                      {cursor && (
                        <Button
                          variant="outline"
                          disabled={historyBusy}
                          onClick={() => loadHistory(cursor)}
                        >
                          {t("more")}
                        </Button>
                      )}
                    </TabsContent>
                  ))}
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500" aria-live="polite">
                    {t(dirty ? "unsaved" : "saved")}
                  </p>
                  <Button
                    disabled={busy || !dirty}
                    onClick={() =>
                      act(async () => {
                        await save();
                        toast.success(t("saved"));
                      })
                    }
                  >
                    <Save />
                    {t("save")}
                  </Button>
                </div>
              </Tabs>
            )}
          </SheetContent>
        </Sheet>
        <AlertDialog open={removing} onOpenChange={setRemoving}>
          <AlertDialogContent>
            <AlertDialogTitle>{t("removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("removeBody")}</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  changeGraph({
                    ...graph,
                    nodes: graph.nodes.filter((n) => n.id !== selected),
                    edges: graph.edges.filter(
                      (e) => e.source !== selected && e.target !== selected,
                    ),
                  });
                  setSelected(null);
                }}
              >
                {t("remove")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog
          open={!!preview}
          onOpenChange={(open) => {
            if (!open && !busy) setPreview(null);
          }}
        >
          <AlertDialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
            <AlertDialogTitle>{t("previewTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("previewBody")}</AlertDialogDescription>
            <div className="space-y-3">
              {preview?.agents.map((p) => {
                const a = graph.nodes.find((n) => n.id === p.id)!;
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-medium">{a.name}</span>
                      <span className="text-zinc-500">{t(a.kind)}</span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      {a.kind === "discovery"
                        ? `${t("quantity")}: ${a.maxResults} · ${t(a.schedule.cadence)}`
                        : t("estimated", { count: p.total })}{" "}
                      · {a.schedule.dailyLimit}/{t("daily")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {a.schedule.weekdays
                        .map((d) => t(`days.${d}`))
                        .join(", ")}{" "}
                      · {a.schedule.start}–{a.schedule.end} ·{" "}
                      {a.schedule.timezone}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {p.samples
                        .map((s) => s.name)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {(a.kind === "email" || a.kind === "whatsapp") &&
                      p.samples.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy || !a.instructions.trim()}
                            onClick={() =>
                              act(async () => {
                                const result = await api("", {
                                  action: "simulate",
                                  agentId: a.id,
                                  leadId: p.samples[0].id,
                                });
                                setPreviewSamples((previous) => ({
                                  ...previous,
                                  [a.id]: result.prepared,
                                }));
                              })
                            }
                          >
                            {t("simulate")}
                          </Button>
                          <p className="text-xs text-zinc-500">
                            {t("simulateHint")}
                          </p>
                          {previewSamples[a.id] && (
                            <div className="rounded-lg bg-zinc-100 p-3 text-xs leading-5 dark:bg-zinc-900">
                              <strong>{previewSamples[a.id].subject}</strong>
                              <p className="whitespace-pre-wrap">
                                {previewSamples[a.id].body}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs leading-5 text-zinc-500">
              {t("estimateHint")}
            </p>
            <Toggle
              label={t("includeCurrent")}
              value={includeCurrent}
              onChange={setIncludeCurrent}
            />
            {preview?.validation && (
              <p
                role="alert"
                className="text-sm text-amber-700 dark:text-amber-400"
              >
                {message(preview.validation)}
              </p>
            )}
            {!preview?.workerEnabled && (
              <p className="text-xs text-zinc-500">{t("workerDisabled")}</p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>
                {t("cancel")}
              </AlertDialogCancel>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={busy || !!preview?.validation}
                onClick={() =>
                  act(async () => {
                    const r = await api("", {
                      action: "publish",
                      version: snapshot!.workspace.version,
                      includeCurrent,
                    });
                    setSnapshot((s) =>
                      s ? { ...s, workspace: r.workspace } : s,
                    );
                    setPreview(null);
                    toast.success(t("changesActivated"));
                  })
                }
              >
                {busy ? <Loader2 className="animate-spin" /> : <Play />}
                {t("publish")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={runOpen} onOpenChange={setRunOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>{t("confirmBatch")}</AlertDialogTitle>
            <AlertDialogDescription>{t("runHint")}</AlertDialogDescription>
            {agent?.kind !== "discovery" && (
              <div className="max-h-72 space-y-4 overflow-y-auto">
                <Toggle
                  label={t("allMatching", {
                    count:
                      candidatePreview?.agents.find((a) => a.id === selected)
                        ?.total ?? 0,
                  })}
                  value={allMatching}
                  onChange={setAllMatching}
                />
                {samples.length ? (
                  samples.map((s) => (
                    <Toggle
                      key={s.id}
                      label={s.name || s.id}
                      value={allMatching || runLeads.includes(s.id)}
                      onChange={(v) =>
                        setRunLeads((prev) =>
                          v ? [...prev, s.id] : prev.filter((x) => x !== s.id),
                        )
                      }
                    />
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    {t("noMatchingLeads")}
                  </p>
                )}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>
                {t("cancel")}
              </AlertDialogCancel>
              <Button
                disabled={
                  busy ||
                  (agent?.kind !== "discovery" &&
                    !allMatching &&
                    !runLeads.length)
                }
                onClick={() =>
                  act(async () => {
                    const r = await api("", {
                      action: "run",
                      agentId: agent!.id,
                      leadIds: runLeads,
                      requestId: runRequest.current,
                      revisionId: candidatePreview?.revisionId,
                      allMatching,
                    });
                    setRunOpen(false);
                    await load();
                    toast.success(t("queuedCount", { count: r.count }));
                  })
                }
              >
                {t("run")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ContentWrapper>
  );
}
