import { expect, test } from "bun:test";
import {
  graphSchema,
  newAgent,
  nextAgent,
  matchesFilter,
  type AgentGraph,
  type AudienceLead,
} from "./model";
const lead: AudienceLead = {
  id: "l",
  status: "new",
  source: "manual",
  jobId: null,
  city: "São Paulo",
  state: "SP",
  country: "BR",
  score: 8,
  emailEligible: true,
  whatsappEligible: true,
};
function graph() {
  const d = newAgent("discovery", "Discovery"),
    e = newAgent("email", "Email"),
    w = newAgent("whatsapp", "WhatsApp");
  return {
    nodes: [d, e, w],
    edges: [
      {
        id: crypto.randomUUID(),
        source: d.id,
        target: e.id,
        condition: {
          outcome: "success" as const,
          channel: "email" as const,
          minScore: 0,
        },
        fallback: false,
      },
      {
        id: crypto.randomUUID(),
        source: d.id,
        target: w.id,
        condition: {
          outcome: "success" as const,
          channel: "whatsapp" as const,
          minScore: 0,
        },
        fallback: false,
      },
    ],
  } satisfies AgentGraph;
}
test("ordered branches route each lead only once, eligible fallback, or end", () => {
  const g = graph();
  expect(nextAgent(g, g.nodes[0].id, lead, "success")).toBe(g.nodes[1].id);
  expect(
    nextAgent(g, g.nodes[0].id, { ...lead, emailEligible: false }, "success"),
  ).toBe(g.nodes[2].id);
  expect(
    nextAgent(
      g,
      g.nodes[0].id,
      { ...lead, emailEligible: false, whatsappEligible: false },
      "success",
    ),
  ).toBeUndefined();
  expect(nextAgent(g, g.nodes[0].id, lead, "failed")).toBeUndefined();
});
test("rejects cycles, discovery predecessors, duplicates, missing targets and fallback before another path", () => {
  const g = graph();
  expect(graphSchema.safeParse(g).success).toBe(true);
  for (const edge of [
    { ...g.edges[0], id: crypto.randomUUID() },
    { ...g.edges[0], target: crypto.randomUUID() },
    { ...g.edges[0], source: g.nodes[1].id, target: g.nodes[0].id },
  ])
    expect(
      graphSchema.safeParse({ ...g, edges: [...g.edges, edge] }).success,
    ).toBe(false);
  expect(
    graphSchema.safeParse({
      ...g,
      edges: g.edges.map((e, i) => ({ ...e, fallback: i === 0 })),
    }).success,
  ).toBe(false);
  const a = newAgent("stage", "A"),
    b = newAgent("stage", "B");
  expect(
    graphSchema.safeParse({
      nodes: [a, b],
      edges: [
        { ...g.edges[0], source: a.id, target: b.id },
        { ...g.edges[1], source: b.id, target: a.id },
      ],
    }).success,
  ).toBe(false);
});
test("audience filters combine stage, source, search, geography, score and consent eligibility", () => {
  const a = newAgent("email", "Email");
  expect(
    matchesFilter(
      { ...a.filter, location: "paulo", minScore: 7, source: "manual" },
      lead,
    ),
  ).toBe(true);
  expect(
    matchesFilter(
      { ...a.filter, channel: "whatsapp" },
      { ...lead, whatsappEligible: false },
    ),
  ).toBe(false);
  expect(matchesFilter({ ...a.filter, jobId: "foreign" }, lead)).toBe(false);
  expect(matchesFilter({ ...a.filter, minScore: 9 }, lead)).toBe(false);
});
test("draft defaults never schedule discovery and require explicit timezone confirmation", () => {
  const a = newAgent("discovery", "Discovery");
  expect(a.schedule.cadence).toBe("off");
  expect(a.schedule.timezoneConfirmed).toBe(false);
  expect(a.automatic).toBe(false);
  expect(a.kind === "discovery" && a.maxResults).toBe(20);
  expect(a.schedule.dailyLimit).toBe(20);
  expect(
    graphSchema.safeParse({
      nodes: [{ ...a, schedule: { ...a.schedule, timezone: "wrong" } }],
      edges: [],
    }).success,
  ).toBe(false);
});
