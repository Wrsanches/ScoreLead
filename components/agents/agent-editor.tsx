"use client";

import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/lib/services/lead-types";
import { graphSchema, type Agent, type AgentGraph } from "@/lib/agents/model";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: (id: string) => ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {hint && (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}
export function Choice({
  id,
  value,
  onChange,
  options,
}: {
  id?: string;
  value: string;
  onChange: (s: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value || "_any"}
      onValueChange={(v) => onChange(v === "_any" ? "" : v)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value || "_any"}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (s: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className="leading-relaxed">
          {label}
        </Label>
        {hint && (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {hint}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={value}
        onCheckedChange={onChange}
        className="shrink-0"
      />
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-zinc-200/70 pt-6 dark:border-zinc-800">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
export function AgentEditor({
  agent: a,
  graph,
  change,
  changeGraph,
  templates,
  jobs,
  onError,
}: {
  agent: Agent;
  graph: AgentGraph;
  change: (a: Agent) => void;
  changeGraph: (g: AgentGraph) => void;
  templates: { id: string; name: string; language: string }[];
  jobs: { id: string; name: string }[];
  onError: () => void;
}) {
  const t = useTranslations("agents"),
    [target, setTarget] = useState("");
  const stages = LEAD_STATUSES.map((v) => ({ value: v, label: t(v) })),
    any = { value: "", label: t("any") };
  const channels = ["any", "email", "whatsapp"].map((v) => ({
    value: v,
    label: t(v),
  }));
  const filter = (v: Partial<Agent["filter"]>) =>
    change({ ...a, filter: { ...a.filter, ...v } });
  const schedule = (v: Partial<Agent["schedule"]>) =>
    change({ ...a, schedule: { ...a.schedule, ...v } });
  const editEdge = (
    id: string,
    patch: Partial<AgentGraph["edges"][number]>,
  ) => {
    const edges = graph.edges.map((e) =>
      e.id === id ? { ...e, ...patch } : e,
    );
    // Otherwise is always last within this source; conditions retain their order.
    const next = {
      ...graph,
      edges: [
        ...edges.filter((e) => !e.fallback),
        ...edges.filter((e) => e.fallback),
      ],
    };
    if (graphSchema.safeParse(next).success) changeGraph(next);
    else onError();
  };
  return (
    <div className="space-y-6">
      <Field label={t("name")}>
        {(id) => (
          <Input
            id={id}
            value={a.name}
            maxLength={80}
            onChange={(e) => change({ ...a, name: e.target.value })}
          />
        )}
      </Field>
      {a.kind === "discovery" && (
        <>
          <Field label={t("country")}>
            {(id) => (
              <Input
                id={id}
                value={a.country}
                onChange={(e) => change({ ...a, country: e.target.value })}
              />
            )}
          </Field>
          <Field label={t("location")}>
            {(id) => (
              <Input
                id={id}
                value={a.location}
                onChange={(e) => change({ ...a, location: e.target.value })}
              />
            )}
          </Field>
          <Field label={t("keywords")}>
            {(id) => (
              <Textarea
                id={id}
                value={a.keywords.join("\n")}
                onChange={(e) =>
                  change({ ...a, keywords: e.target.value.split("\n") })
                }
              />
            )}
          </Field>
          <Field label={t("quantity")}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={500}
                value={a.maxResults}
                onChange={(e) =>
                  change({ ...a, maxResults: Number(e.target.value) })
                }
              />
            )}
          </Field>
        </>
      )}
      {(a.kind === "email" || a.kind === "whatsapp") && (
        <>
          {a.kind === "whatsapp" && (
            <Field
              label={t("template")}
              hint={!templates.length ? t("noTemplates") : undefined}
            >
              {(id) => (
                <Choice
                  id={id}
                  value={a.templateId}
                  onChange={(templateId) => change({ ...a, templateId })}
                  options={[
                    { value: "", label: t("choose") },
                    ...templates.map((v) => ({
                      value: v.id,
                      label: `${v.name} · ${v.language}`,
                    })),
                  ]}
                />
              )}
            </Field>
          )}
          <Field label={t("instructions")} hint={t("instructionsHint")}>
            {(id) => (
              <Textarea
                id={id}
                className="min-h-32"
                value={a.instructions}
                maxLength={4000}
                onChange={(e) => change({ ...a, instructions: e.target.value })}
              />
            )}
          </Field>
          {a.kind === "email" && (
            <Field label={t("tone")}>
              {(id) => (
                <Input
                  id={id}
                  value={a.tone}
                  maxLength={100}
                  onChange={(e) => change({ ...a, tone: e.target.value })}
                />
              )}
            </Field>
          )}
          <Toggle
            label={t("markContacted")}
            hint={t("markHint")}
            value={a.markContacted}
            onChange={(markContacted) => change({ ...a, markContacted })}
          />
        </>
      )}
      {a.kind === "stage" && (
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("from")}>
            {(id) => (
              <Choice
                id={id}
                value={a.from}
                options={stages}
                onChange={(from) =>
                  change({
                    ...a,
                    from: from as typeof a.from,
                    filter: {
                      ...a.filter,
                      status:
                        a.filter.status === a.from
                          ? (from as typeof a.from)
                          : a.filter.status,
                    },
                  })
                }
              />
            )}
          </Field>
          <Field label={t("to")}>
            {(id) => (
              <Choice
                id={id}
                value={a.to}
                options={stages}
                onChange={(to) => change({ ...a, to: to as typeof a.to })}
              />
            )}
          </Field>
        </div>
      )}
      {a.kind !== "discovery" && (
        <Section title={t("audience")}>
          {!graph.edges.some((e) => e.target === a.id) && (
            <Toggle
              label={t("automatic")}
              hint={t("automaticHint")}
              value={a.automatic}
              onChange={(automatic) => change({ ...a, automatic })}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("status")}>
              {(id) => (
                <Choice
                  id={id}
                  value={a.filter.status ?? ""}
                  options={[any, ...stages]}
                  onChange={(status) =>
                    filter({
                      status: (status ||
                        undefined) as Agent["filter"]["status"],
                    })
                  }
                />
              )}
            </Field>
            <Field label={t("source")}>
              {(id) => (
                <Choice
                  id={id}
                  value={a.filter.source ?? ""}
                  options={[
                    any,
                    ...LEAD_SOURCES.map((v) => ({ value: v, label: t(v) })),
                  ]}
                  onChange={(source) =>
                    filter({
                      source: (source ||
                        undefined) as Agent["filter"]["source"],
                    })
                  }
                />
              )}
            </Field>
          </div>
          <Field label={t("search")}>
            {(id) => (
              <Choice
                id={id}
                value={a.filter.jobId ?? ""}
                options={[
                  any,
                  ...jobs.map((v) => ({ value: v.id, label: v.name })),
                ]}
                onChange={(jobId) => filter({ jobId: jobId || undefined })}
              />
            )}
          </Field>
          <Field label={t("location")}>
            {(id) => (
              <Input
                id={id}
                value={a.filter.location}
                onChange={(e) => filter({ location: e.target.value })}
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            {(["minScore", "maxScore"] as const).map((key) => (
              <Field key={key} label={t(key)}>
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={a.filter[key]}
                    onChange={(e) => filter({ [key]: Number(e.target.value) })}
                  />
                )}
              </Field>
            ))}
          </div>
          <Field label={t("channel")}>
            {(id) => (
              <Choice
                id={id}
                value={a.filter.channel}
                options={channels}
                onChange={(channel) =>
                  filter({ channel: channel as Agent["filter"]["channel"] })
                }
              />
            )}
          </Field>
        </Section>
      )}
      <Section title={t("schedule")}>
        <Field label={t("timezone")}>
          {(id) => (
            <Input
              id={id}
              value={a.schedule.timezone}
              onChange={(e) =>
                schedule({ timezone: e.target.value, timezoneConfirmed: false })
              }
            />
          )}
        </Field>
        <Toggle
          label={t("confirmTimezone")}
          value={a.schedule.timezoneConfirmed}
          onChange={(timezoneConfirmed) => schedule({ timezoneConfirmed })}
        />
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={t("schedule")}
        >
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={a.schedule.weekdays.includes(d) ? "default" : "outline"}
              aria-pressed={a.schedule.weekdays.includes(d)}
              onClick={() =>
                schedule({
                  weekdays: a.schedule.weekdays.includes(d)
                    ? a.schedule.weekdays.filter((x) => x !== d)
                    : [...a.schedule.weekdays, d].sort(
                        (x, y) => ((x + 6) % 7) - ((y + 6) % 7),
                      ),
                })
              }
            >
              {t(`days.${d}`)}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(["start", "end"] as const).map((key) => (
            <Field key={key} label={t(key)}>
              {(id) => (
                <Input
                  id={id}
                  type="time"
                  value={a.schedule[key]}
                  onChange={(e) => schedule({ [key]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </div>
        {a.kind === "discovery" && (
          <Field label={t("cadence")}>
            {(id) => (
              <Choice
                id={id}
                value={a.schedule.cadence}
                options={["off", "daily", "weekly"].map((v) => ({
                  value: v,
                  label: t(v),
                }))}
                onChange={(cadence) =>
                  schedule({ cadence: cadence as Agent["schedule"]["cadence"] })
                }
              />
            )}
          </Field>
        )}
        <Field label={t("dailyLimit")} hint={t("limitHint")}>
          {(id) => (
            <Input
              id={id}
              type="number"
              min={1}
              max={500}
              value={a.schedule.dailyLimit}
              onChange={(e) => schedule({ dailyLimit: Number(e.target.value) })}
            />
          )}
        </Field>
      </Section>
      <Section title={t("connections")}>
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t("connectionHint")}
        </p>
        {graph.edges
          .filter((e) => e.source === a.id)
          .map((edge, index, edges) => (
            <div
              key={edge.id}
              className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium">
                  {index + 1}.{" "}
                  {graph.nodes.find((n) => n.id === edge.target)?.name}
                </span>
                <div className="flex">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t("moveUp")}
                    disabled={
                      index === 0 || edge.fallback || edges[index - 1]?.fallback
                    }
                    onClick={() => {
                      const all = [...graph.edges],
                        i = all.indexOf(edge),
                        j = all.indexOf(edges[index - 1]);
                      [all[i], all[j]] = [all[j], all[i]];
                      changeGraph({ ...graph, edges: all });
                    }}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t("removeConnection")}
                    onClick={() =>
                      changeGraph({
                        ...graph,
                        edges: graph.edges.filter((e) => e.id !== edge.id),
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <Toggle
                label={t("fallback")}
                value={edge.fallback}
                onChange={(fallback) => editEdge(edge.id, { fallback })}
              />
              {!edge.fallback && (
                <>
                  <Field label={t("outcome")}>
                    {(id) => (
                      <Choice
                        id={id}
                        value={edge.condition.outcome}
                        options={["any", "success", "failed", "skipped"].map(
                          (v) => ({ value: v, label: t(v) }),
                        )}
                        onChange={(outcome) =>
                          editEdge(edge.id, {
                            condition: {
                              ...edge.condition,
                              outcome: outcome as typeof edge.condition.outcome,
                            },
                          })
                        }
                      />
                    )}
                  </Field>
                  <Field label={t("channel")}>
                    {(id) => (
                      <Choice
                        id={id}
                        value={edge.condition.channel}
                        options={channels}
                        onChange={(channel) =>
                          editEdge(edge.id, {
                            condition: {
                              ...edge.condition,
                              channel: channel as typeof edge.condition.channel,
                            },
                          })
                        }
                      />
                    )}
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t("status")}>
                      {(id) => (
                        <Choice
                          id={id}
                          value={edge.condition.status ?? ""}
                          options={[any, ...stages]}
                          onChange={(status) =>
                            editEdge(edge.id, {
                              condition: {
                                ...edge.condition,
                                status: (status ||
                                  undefined) as typeof edge.condition.status,
                              },
                            })
                          }
                        />
                      )}
                    </Field>
                    <Field label={t("minScore")}>
                      {(id) => (
                        <Input
                          id={id}
                          type="number"
                          min={0}
                          max={10}
                          value={edge.condition.minScore}
                          onChange={(e) =>
                            editEdge(edge.id, {
                              condition: {
                                ...edge.condition,
                                minScore: Number(e.target.value),
                              },
                            })
                          }
                        />
                      )}
                    </Field>
                  </div>
                </>
              )}
            </div>
          ))}
        <Field label={t("next")}>
          {(id) => (
            <Choice
              id={id}
              value={target}
              options={[
                { value: "", label: t("choose") },
                ...graph.nodes
                  .filter(
                    (n) =>
                      n.id !== a.id &&
                      n.kind !== "discovery" &&
                      !graph.edges.some(
                        (e) => e.source === a.id && e.target === n.id,
                      ),
                  )
                  .map((n) => ({ value: n.id, label: n.name })),
              ]}
              onChange={setTarget}
            />
          )}
        </Field>
        <Button
          variant="outline"
          className="w-full"
          disabled={!target}
          onClick={() => {
            const edge = {
              id: crypto.randomUUID(),
              source: a.id,
              target,
              fallback: false,
              condition: {
                outcome: "any" as const,
                channel: "any" as const,
                minScore: 0,
              },
            };
            const next = {
              ...graph,
              edges: [
                ...graph.edges.filter((e) => !e.fallback),
                edge,
                ...graph.edges.filter((e) => e.fallback),
              ],
            };
            if (graphSchema.safeParse(next).success) {
              changeGraph(next);
              setTarget("");
            } else onError();
          }}
        >
          <Link2 />
          {t("connect")}
        </Button>
      </Section>
    </div>
  );
}
