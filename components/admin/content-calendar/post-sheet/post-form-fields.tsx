"use client";

import { useTranslations } from "next-intl";
import { Check, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TagsInput } from "@/components/admin/tags-input";
import { PILLARS, POST_TYPES, getPillar } from "@/lib/content-pillars";
import {
  type PostFormValues,
  POST_TYPE_ICON,
  POST_TYPE_LABEL_KEY,
  PILLAR_LABEL_KEY,
  fieldClass,
  microLabelClass,
  toLocalInputValue,
  fromLocalInputValue,
} from "./shared";

interface PostFormFieldsProps {
  values: PostFormValues;
  onChange: (patch: Partial<PostFormValues>) => void;
}

function FieldLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${microLabelClass} ${className}`}>
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600 font-semibold">
      {children}
    </p>
  );
}

export function PostFormFields({ values, onChange }: PostFormFieldsProps) {
  const t = useTranslations("contentCalendar");

  const hookLine = values.caption.split("\n")[0] ?? "";
  const hookLen = hookLine.length;
  const hookGood = hookLen > 0 && hookLen <= 80;
  const pillarMeta = getPillar(values.pillar);

  // Reel is no longer offered (static images only), but legacy posts may
  // still carry it - keep it selectable only while it is the current value.
  const postTypes =
    values.postType === "reel"
      ? [...POST_TYPES, { key: "reel" as const, label: "Reel" }]
      : POST_TYPES;

  return (
    <div className="space-y-5">
      <SectionTitle>{t("sectionPost")}</SectionTitle>

      {/* Post type */}
      <div>
        <FieldLabel className="mb-2">{t("postTypeLabel")}</FieldLabel>
        <div
          className={`grid gap-1.5 ${postTypes.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}
        >
          {postTypes.map((pt) => {
            const Icon = POST_TYPE_ICON[pt.key];
            const active = values.postType === pt.key;
            return (
              <button
                key={pt.key}
                type="button"
                onClick={() => onChange({ postType: pt.key })}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-150 ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px] font-medium">
                  {t(POST_TYPE_LABEL_KEY[pt.key])}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date + pillar */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel className="mb-2">{t("dateLabel")}</FieldLabel>
          <input
            type="datetime-local"
            value={toLocalInputValue(values.scheduledFor)}
            onChange={(e) =>
              onChange({ scheduledFor: fromLocalInputValue(e.target.value) })
            }
            className={`${fieldClass} px-3 scheme-dark`}
          />
        </div>
        <div>
          <FieldLabel className="mb-2">{t("pillarLabel")}</FieldLabel>
          <div className="grid grid-cols-5 gap-1">
            {PILLARS.map((p) => {
              const active = values.pillar === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    onChange({
                      pillar: values.pillar === p.key ? null : p.key,
                    })
                  }
                  title={p.label}
                  className={`h-10 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                    active
                      ? `${p.bgClass} border-current ${p.textClass} ring-1 ${p.ringClass}`
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.dotClass}`} />
                </button>
              );
            })}
          </div>
          {pillarMeta && (
            <p className={`text-[10px] mt-1 ${pillarMeta.textClass}`}>
              {t(PILLAR_LABEL_KEY[pillarMeta.key])}
            </p>
          )}
        </div>
      </div>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <SectionTitle>{t("sectionContent")}</SectionTitle>

      {/* Caption */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel>{t("caption")}</FieldLabel>
          <span
            className={`text-[10px] tabular-nums ${
              values.caption.length > 2000
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-500 dark:text-zinc-600"
            }`}
          >
            {t("charactersLeft", { n: values.caption.length })}
          </span>
        </div>
        <textarea
          value={values.caption}
          onChange={(e) => onChange({ caption: e.target.value.slice(0, 2200) })}
          rows={8}
          className={`${fieldClass} py-3 resize-none`}
          placeholder={
            "Hook that stops the scroll...\n\nYour value or story\n\nSave this if it helped"
          }
        />
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
          {hookGood ? (
            <>
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">
                {t("hookGood")} ({hookLen}/80)
              </span>
            </>
          ) : hookLen > 80 ? (
            <>
              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-600 dark:text-amber-400">
                {t("hookTooLong")} ({hookLen}/80)
              </span>
            </>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-600">
              {t("captionHint")}
            </span>
          )}
        </div>
      </div>

      {/* Hashtags */}
      <div>
        <FieldLabel className="mb-2">{t("hashtags")}</FieldLabel>
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
          chipClassName="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium"
          chipRemoveClassName="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        />
        <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1.5">
          {t("hashtagsHint")}
        </p>
      </div>

      {/* Visual idea */}
      <div>
        <FieldLabel className="mb-2">{t("visualIdea")}</FieldLabel>
        <textarea
          value={values.visualIdea}
          onChange={(e) => onChange({ visualIdea: e.target.value })}
          rows={4}
          className={`${fieldClass} py-3 resize-none`}
          placeholder={t("visualIdeaHint")}
        />
      </div>

      {/* CTA */}
      <div>
        <FieldLabel className="mb-2">{t("callToAction")}</FieldLabel>
        <input
          type="text"
          value={values.callToAction}
          onChange={(e) => onChange({ callToAction: e.target.value })}
          placeholder={t("callToActionPlaceholder")}
          className={fieldClass}
        />
      </div>

      {/* Status toggle */}
      <button
        type="button"
        onClick={() =>
          onChange({
            status: values.status === "approved" ? "draft" : "approved",
          })
        }
        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
          values.status === "approved"
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        {values.status === "approved" ? (
          <>
            <Check className="w-3.5 h-3.5" />
            {t("statusApproved")}
          </>
        ) : (
          t("statusDraft")
        )}
      </button>
    </div>
  );
}
