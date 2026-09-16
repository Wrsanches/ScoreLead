"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TagsInput } from "@/components/admin/tags-input";
import { PILLARS, POST_TYPES } from "@/lib/content-pillars";
import {
  type PostFormValues,
  POST_TYPE_HINT_KEY,
  POST_TYPE_ICON,
  POST_TYPE_LABEL_KEY,
  PILLAR_LABEL_KEY,
  fieldClass,
} from "./shared";
import { SchedulePicker } from "./schedule-picker";

/** Content-layer card shared by every editor section. */
export function EditorCard({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-card rounded-2xl p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function FieldLabel({
  children,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        {children}
      </label>
      {hint ? <span className="text-[11px] text-zinc-500">{hint}</span> : null}
    </div>
  );
}

interface ComposeFieldsProps {
  values: PostFormValues;
  onChange: (patch: Partial<PostFormValues>) => void;
}

export function ComposeFields({ values, onChange }: ComposeFieldsProps) {
  const t = useTranslations("contentCalendar");
  const [moreOpen, setMoreOpen] = useState(
    () =>
      Boolean(values.visualIdea.trim() || values.callToAction.trim()) ||
      (values.pillar !== null && values.pillar !== "educate"),
  );

  const hookLine = values.caption.split("\n")[0] ?? "";
  const hookLen = hookLine.length;
  const hookPct = Math.min((hookLen / 80) * 100, 100);
  const hookOk = hookLen > 0 && hookLen <= 80;

  // Reels and stories are no longer offered (static feed images only), but
  // legacy posts may carry them - keep the current value selectable so an
  // old post can still be edited without silently changing its type.
  const postTypes = POST_TYPES.some((pt) => pt.key === values.postType)
    ? POST_TYPES
    : [
        ...POST_TYPES,
        { key: values.postType, label: values.postType === "reel" ? "Reel" : "Story" },
      ];

  return (
    <>
      <EditorCard title={t("sectionPost")}>
        <FieldLabel>{t("postTypeLabel")}</FieldLabel>
        <div
          className={`grid gap-2 ${postTypes.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
        >
          {postTypes.map((pt) => {
            const Icon = POST_TYPE_ICON[pt.key];
            const active = values.postType === pt.key;
            return (
              <button
                key={pt.key}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ postType: pt.key })}
                className={`flex flex-col items-start gap-2 rounded-xl p-3.5 text-left transition-all duration-150 ${
                  active
                    ? "glass-pill ring-1 ring-emerald-500/40 text-zinc-900 dark:text-white"
                    : "surface-card text-zinc-600 hover:brightness-110 dark:text-zinc-400"
                }`}
              >
                <span
                  className={`inline-flex size-8 items-center justify-center rounded-lg ring-1 ${
                    active
                      ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-300"
                      : "bg-black/[0.04] text-zinc-500 ring-black/[0.06] dark:bg-white/[0.06] dark:ring-white/[0.1]"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium">
                  {t(POST_TYPE_LABEL_KEY[pt.key])}
                </span>
                <span className="text-[11px] leading-snug text-zinc-500">
                  {t(POST_TYPE_HINT_KEY[pt.key])}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <FieldLabel htmlFor="post-when">{t("whenLabel")}</FieldLabel>
          <SchedulePicker
            id="post-when"
            value={values.scheduledFor}
            onChange={(iso) => onChange({ scheduledFor: iso })}
          />
        </div>
      </EditorCard>

      <EditorCard
        title={t("caption")}
        actions={
          <span
            className={`text-[11px] tabular-nums ${
              values.caption.length > 2000
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-500"
            }`}
          >
            {t("charactersLeft", { n: values.caption.length })}
          </span>
        }
      >
        <textarea
          id="post-caption"
          value={values.caption}
          onChange={(e) => onChange({ caption: e.target.value.slice(0, 2200) })}
          rows={10}
          className={`${fieldClass} min-h-56 resize-y py-3 text-[15px] leading-relaxed`}
          placeholder={t("captionPlaceholder")}
        />
        <div className="mt-2.5">
          <div className="h-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.07]">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                hookLen === 0
                  ? "bg-transparent"
                  : hookOk
                    ? "bg-emerald-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${hookPct}%` }}
            />
          </div>
          <p
            className={`mt-1.5 flex items-center gap-1 text-[11px] ${
              hookLen === 0
                ? "text-zinc-500"
                : hookOk
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {hookOk && <Check className="size-3" aria-hidden="true" />}
            {hookLen === 0
              ? t("captionHint")
              : hookOk
                ? `${t("hookGood")} (${hookLen}/80)`
                : `${t("hookTooLong")} (${hookLen}/80)`}
          </p>
        </div>

        <div className="mt-5">
          <FieldLabel hint={t("hashtagsHint")}>{t("hashtags")}</FieldLabel>
          <TagsInput
            asArray
            arrayValue={values.hashtags}
            onArrayChange={(next) => onChange({ hashtags: next })}
            value=""
            onChange={() => {}}
            placeholder="photography  tuesdaytip  saopaulo"
            maxTags={15}
            stripHashPrefix
            inputClassName={fieldClass}
            chipClassName="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium"
            chipRemoveClassName="text-emerald-500/60 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          />
        </div>
      </EditorCard>

      <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
        <section className="glass-card rounded-2xl">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-left transition-colors hover:brightness-110"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                  {t("moreOptions")}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {t("moreOptionsHint")}
                </span>
              </span>
              <ChevronDown
                className={`size-4 shrink-0 text-zinc-500 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-5 px-5 pb-5">
              <div>
                <FieldLabel>{t("pillarLabel")}</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {PILLARS.map((p) => {
                    const active = values.pillar === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          onChange({ pillar: active ? null : p.key })
                        }
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                          active
                            ? `${p.bgClass} ${p.textClass} ${p.ringClass}`
                            : "text-zinc-600 ring-black/[0.08] hover:text-zinc-900 dark:text-zinc-400 dark:ring-white/[0.1] dark:hover:text-zinc-200"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${p.dotClass}`} />
                        {t(PILLAR_LABEL_KEY[p.key])}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="post-visual">{t("visualIdea")}</FieldLabel>
                <textarea
                  id="post-visual"
                  value={values.visualIdea}
                  onChange={(e) => onChange({ visualIdea: e.target.value })}
                  rows={3}
                  className={`${fieldClass} resize-y py-3`}
                  placeholder={t("visualIdeaHint")}
                />
              </div>

              <div>
                <FieldLabel htmlFor="post-cta">{t("callToAction")}</FieldLabel>
                <input
                  id="post-cta"
                  type="text"
                  value={values.callToAction}
                  onChange={(e) => onChange({ callToAction: e.target.value })}
                  placeholder={t("callToActionPlaceholder")}
                  className={fieldClass}
                />
              </div>
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>
    </>
  );
}
