import { z } from "zod";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/lib/services/lead-types";

export const filterSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    source: z.enum(LEAD_SOURCES).optional(),
    jobId: z.string().max(100).optional(),
    location: z.string().max(200).default(""),
    minScore: z.number().min(0).max(10).default(0),
    maxScore: z.number().min(0).max(10).default(10),
    channel: z.enum(["any", "email", "whatsapp"]).default("any"),
  })
  .refine((f) => f.maxScore >= f.minScore, { message: "SCORE_RANGE" });
export const scheduleSchema = z
  .object({
    timezoneConfirmed: z.boolean().default(false),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, "TIMEZONE"),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    dailyLimit: z.number().int().min(1).max(500),
    cadence: z.enum(["off", "daily", "weekly"]),
  })
  .refine((s) => s.start < s.end, { message: "SEND_WINDOW" });
const base = {
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  position: z.object({
    x: z.number().finite().min(-100000).max(100000),
    y: z.number().finite().min(-100000).max(100000),
  }),
  automatic: z.boolean(),
  filter: filterSchema,
  schedule: scheduleSchema,
};
export const agentSchema = z.discriminatedUnion("kind", [
  z.object({
    ...base,
    kind: z.literal("discovery"),
    country: z.string().max(100),
    location: z.string().max(200),
    keywords: z.array(z.string().trim().min(1).max(100)).max(20),
    maxResults: z.number().int().min(1).max(500),
  }),
  z.object({
    ...base,
    kind: z.literal("email"),
    instructions: z.string().max(4000),
    tone: z.string().max(100),
    markContacted: z.boolean(),
  }),
  z.object({
    ...base,
    kind: z.literal("whatsapp"),
    instructions: z.string().max(4000),
    templateId: z.string().max(100),
    markContacted: z.boolean(),
  }),
  z.object({
    ...base,
    kind: z.literal("stage"),
    from: z.enum(LEAD_STATUSES),
    to: z.enum(LEAD_STATUSES),
  }),
]);
export const conditionSchema = z.object({
  outcome: z.enum(["any", "success", "failed", "skipped"]).default("any"),
  channel: z.enum(["any", "email", "whatsapp"]).default("any"),
  status: z.enum(LEAD_STATUSES).optional(),
  minScore: z.number().min(0).max(10).default(0),
});
export const graphSchema = z
  .object({
    nodes: z.array(agentSchema).max(50),
    edges: z
      .array(
        z.object({
          id: z.string().uuid(),
          source: z.string().uuid(),
          target: z.string().uuid(),
          condition: conditionSchema,
          fallback: z.boolean().default(false),
        }),
      )
      .max(100),
  })
  .superRefine((g, ctx) => {
    const error = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    const ids = new Set(g.nodes.map((n) => n.id));
    if (ids.size !== g.nodes.length) error("DUPLICATE_AGENT");
    const pairs = new Set<string>(),
      edgeIds = new Set<string>();
    for (const e of g.edges) {
      if (!ids.has(e.source) || !ids.has(e.target)) error("MISSING_AGENT");
      if (e.source === e.target) error("CYCLE");
      if (g.nodes.find((n) => n.id === e.target)?.kind === "discovery")
        error("DISCOVERY_INPUT");
      const key = e.source + e.target;
      if (pairs.has(key) || edgeIds.has(e.id)) error("DUPLICATE_CONNECTION");
      pairs.add(key);
      edgeIds.add(e.id);
    }
    for (const n of g.nodes) {
      const edges = g.edges.filter((e) => e.source === n.id);
      if (edges.filter((e) => e.fallback).length > 1)
        error("DUPLICATE_FALLBACK");
      if (edges.some((e, i) => e.fallback && i !== edges.length - 1))
        error("FALLBACK_LAST");
    }
    const done = new Set<string>(),
      visiting = new Set<string>();
    const visit = (id: string): boolean => {
      if (visiting.has(id)) return false;
      if (done.has(id)) return true;
      visiting.add(id);
      for (const e of g.edges.filter((e) => e.source === id))
        if (!visit(e.target)) return false;
      visiting.delete(id);
      done.add(id);
      return true;
    };
    if (g.nodes.some((n) => !visit(n.id))) error("CYCLE");
  });
export type Agent = z.infer<typeof agentSchema>;
export type AgentKind = Agent["kind"];
export type AgentGraph = z.infer<typeof graphSchema>;
export type AudienceLead = {
  id: string;
  status: string;
  source: string;
  jobId: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  score: number;
  emailEligible: boolean;
  whatsappEligible: boolean;
};
export function matchesFilter(a: Agent["filter"], l: AudienceLead) {
  return (
    (!a.status || a.status === l.status) &&
    (!a.source || a.source === l.source) &&
    (!a.jobId || a.jobId === l.jobId) &&
    (!a.location ||
      [l.city, l.state, l.country]
        .join(" ")
        .toLowerCase()
        .includes(a.location.toLowerCase())) &&
    l.score >= a.minScore &&
    l.score <= a.maxScore &&
    (a.channel === "any" ||
      (a.channel === "email" ? l.emailEligible : l.whatsappEligible))
  );
}
export function nextAgent(
  g: AgentGraph,
  source: string,
  l: AudienceLead,
  outcome: "success" | "failed" | "skipped",
) {
  return g.edges
    .filter((e) => e.source === source)
    .find(
      (e) =>
        e.fallback ||
        ((e.condition.outcome === "any" || e.condition.outcome === outcome) &&
          (!e.condition.status || e.condition.status === l.status) &&
          l.score >= e.condition.minScore &&
          (e.condition.channel === "any" ||
            (e.condition.channel === "email"
              ? l.emailEligible
              : l.whatsappEligible))),
    )?.target;
}
export function newAgent(kind: AgentKind, name: string, index = 0): Agent {
  const common = {
    id: crypto.randomUUID(),
    name,
    position: {
      x: 80 + (index % 3) * 340,
      y: 100 + Math.floor(index / 3) * 280,
    },
    automatic: false,
    filter: {
      status: "new" as const,
      location: "",
      minScore: 0,
      maxScore: 10,
      channel: "any" as const,
    },
    schedule: {
      timezoneConfirmed: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      weekdays: [1, 2, 3, 4, 5],
      start: "09:00",
      end: "17:00",
      dailyLimit: 20,
      cadence: "off" as const,
    },
  };
  if (kind === "discovery")
    return {
      ...common,
      kind,
      country: "",
      location: "",
      keywords: [],
      maxResults: 20,
    };
  if (kind === "email")
    return { ...common, kind, instructions: "", tone: "", markContacted: true };
  if (kind === "whatsapp")
    return {
      ...common,
      kind,
      instructions: "",
      templateId: "",
      markContacted: true,
    };
  return { ...common, kind, from: "new", to: "contacted" };
}
