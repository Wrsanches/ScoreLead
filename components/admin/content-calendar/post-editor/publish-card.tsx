"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, ExternalLink, Loader2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getLocalizedAppPath } from "@/lib/site-urls";
import type { PublicationView } from "@/lib/instagram/data";
import type { ContentPostRow } from "../types";
import { EditorCard } from "./compose-fields";
import type { PostFormValues } from "./shared";

interface PublishCardProps {
  post: ContentPostRow | null;
  values: PostFormValues;
  businessId: string;
  /** Disables approval and scheduling (locked publication, saving, busy). */
  disabled: boolean;
  /** Viewer cannot change anything, including cancelling a schedule. */
  readOnly: boolean;
  onChange: (patch: Partial<PostFormValues>) => void;
  /** Saves the current form (creating the post if needed) and returns it. */
  ensureSaved: () => Promise<ContentPostRow>;
  onPublicationChange: (publication: PublicationView | null) => void;
  onBusyChange: (busy: boolean) => void;
}

export function PublishCard({
  post,
  values,
  businessId,
  disabled,
  readOnly,
  onChange,
  ensureSaved,
  onPublicationChange,
  onBusyChange,
}: PublishCardProps) {
  const t = useTranslations("contentCalendar");
  const ti = useTranslations("instagram");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );

  const publication = post?.publication ?? null;
  const canSchedule =
    !publication || ["cancelled", "failed"].includes(publication.status);
  const hasImages = Boolean(post?.images?.length);
  const typeSupported = ["single", "carousel"].includes(values.postType);

  async function act(action: "schedule" | "cancel") {
    if (busy) return;
    setBusy(true);
    onBusyChange(true);
    setError(null);
    try {
      // Scheduling saves the exact caption and date shown in the editor first.
      // The server rejects stale versions and snapshots the media.
      const saved = action === "schedule" ? await ensureSaved() : post;
      if (!saved) throw new Error("SAVE_FAILED");
      const response = await fetch(
        `/api/content-calendar/${saved.id}/publication`,
        {
          method: action === "schedule" ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          ...(action === "schedule"
            ? {
                body: JSON.stringify({
                  scheduledFor: values.scheduledFor,
                  timeZone,
                  expectedUpdatedAt: saved.updatedAt,
                }),
              }
            : {}),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.code || "INSTAGRAM_REQUEST_FAILED");
      onPublicationChange(body.publication);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "INSTAGRAM_REQUEST_FAILED",
      );
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  const approved = values.status === "approved";

  return (
    <EditorCard title={ti("publishingTitle")}>
      {/* Approval switch */}
      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl surface-card p-4">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-zinc-900 dark:text-white">
            {t("approvedLabel")}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
            {t("approvedHint")}
          </span>
        </span>
        <Switch
          checked={approved}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChange({ status: checked ? "approved" : "draft" })
          }
          className="mt-0.5 data-[state=checked]:bg-emerald-500"
        />
      </label>

      {/* Instagram publication */}
      <div className="mt-4 border-t border-black/[0.05] pt-4 dark:border-white/[0.06]">
        {publication ? (
          <div
            className="rounded-xl surface-card p-4 text-sm"
            role="status"
          >
            <div className="flex items-center gap-2">
              <span
                className={`size-1.5 rounded-full ${
                  publication.status === "published"
                    ? "bg-emerald-500"
                    : publication.status === "failed"
                      ? "bg-red-500"
                      : publication.status === "cancelled"
                        ? "bg-zinc-400"
                        : "bg-sky-500"
                }`}
                aria-hidden="true"
              />
              <p className="font-medium text-zinc-900 dark:text-white">
                {ti(`status.${publication.status}`)}
              </p>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: publication.timeZone,
              }).format(new Date(publication.scheduledAt))}{" "}
              · {publication.timeZone}
            </p>
            {publication.errorCode && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                {ti.has(`errors.${publication.errorCode}`)
                  ? ti(`errors.${publication.errorCode}`)
                  : ti("errors.INSTAGRAM_REQUEST_FAILED")}
              </p>
            )}
            {publication.permalink && (
              <a
                className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
                href={publication.permalink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ti("viewPost")}
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            )}
          </div>
        ) : null}

        {canSchedule && !readOnly ? (
          <div className={publication ? "mt-4" : ""}>
            <p className="text-xs leading-relaxed text-zinc-500">
              {ti("scheduleHelp", { timeZone })}
            </p>
            {!hasImages ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                {t("scheduleNeedsImage")}
              </p>
            ) : !typeSupported ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                {t("scheduleTypeUnsupported")}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => act("schedule")}
                disabled={disabled || busy || !hasImages || !typeSupported}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CalendarClock className="size-4" aria-hidden="true" />
                )}
                {ti("schedule")}
              </button>
              <a
                className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:hover:text-white"
                href={getLocalizedAppPath(
                  `/admin/business/${businessId}/integrations`,
                  locale,
                )}
              >
                {ti("manageConnection")}
              </a>
            </div>
          </div>
        ) : null}

        {publication?.status === "scheduled" && !readOnly ? (
          <div className="mt-4">
            <p className="text-xs text-zinc-500">{ti("cancelToEdit")}</p>
            <button
              type="button"
              onClick={() => act("cancel")}
              disabled={busy || readOnly}
              className="glass-pill mt-3 inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-medium text-zinc-700 transition-[filter] hover:brightness-110 disabled:opacity-50 dark:text-zinc-300"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <X className="size-3.5" aria-hidden="true" />
              )}
              {ti("cancelSchedule")}
            </button>
          </div>
        ) : null}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {ti.has(`errors.${error}`)
              ? ti(`errors.${error}`)
              : ti("errors.INSTAGRAM_REQUEST_FAILED")}
          </p>
        )}
      </div>
    </EditorCard>
  );
}
