"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarClock, ExternalLink, Loader2 } from "lucide-react"
import type { ContentPostRow } from "../types"
import type { PublicationView } from "@/lib/instagram/data"
import { getLocalizedAppPath } from "@/lib/site-urls"
import { type PostFormValues } from "./shared"
import { Button } from "@/components/ui/button"

export function PublicationPanel({
  post,
  values,
  businessId,
  readOnly,
  onSave,
  onPublicationChange,
  onBusyChange,
}: {
  post: ContentPostRow | null
  values: PostFormValues
  businessId: string
  readOnly: boolean
  onSave: (
    values: PostFormValues,
    keepOpen?: boolean,
  ) => Promise<ContentPostRow>
  onPublicationChange: (publication: PublicationView | null) => void
  onBusyChange: (busy: boolean) => void
}) {
  const t = useTranslations("instagram")
  const locale = useLocale()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  )
  const publication = post?.publication
  const canSchedule =
    !publication || ["cancelled", "failed"].includes(publication.status)
  async function act(action: "schedule" | "cancel") {
    if (!post || busy) return
    setBusy(true)
    onBusyChange(true)
    setError(null)
    try {
      // Save the exact caption/date shown in the editor before scheduling.
      // The server rejects stale versions and creates an immutable media copy.
      const saved = action === "schedule" ? await onSave(values, true) : post
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
      )
      const body = await response.json()
      if (!response.ok) throw new Error(body.code || "INSTAGRAM_REQUEST_FAILED")
      onPublicationChange(body.publication)
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "INSTAGRAM_REQUEST_FAILED",
      )
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }
  return (
    <section
      className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800"
      aria-labelledby="publication-heading"
    >
      <h3
        id="publication-heading"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <CalendarClock className="size-4" />
        {t("publishingTitle")}
      </h3>
      {publication && (
        <div
          className="mt-3 rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-900"
          role="status"
        >
          <p className="font-medium">{t(`status.${publication.status}`)}</p>
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
              {t.has(`errors.${publication.errorCode}`)
                ? t(`errors.${publication.errorCode}`)
                : t("errors.INSTAGRAM_REQUEST_FAILED")}
            </p>
          )}
          {publication.permalink && (
            <a
              className="mt-2 inline-flex items-center gap-1 underline"
              href={publication.permalink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("viewPost")}
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}
      {!post ? (
        <p className="mt-3 text-xs text-zinc-500">{t("saveFirst")}</p>
      ) : (
        canSchedule && (
          <>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {t("scheduleHelp", { timeZone })}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {t("imagePreparation")}
            </p>
            {!readOnly && (
              <Button
                className="mt-3"
                onClick={() => act("schedule")}
                disabled={
                  busy ||
                  !post.images?.length ||
                  !["single", "carousel"].includes(values.postType)
                }
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CalendarClock className="size-4" />
                )}
                {t("schedule")}
              </Button>
            )}
            <a
              className="mt-3 block text-xs underline underline-offset-2"
              href={getLocalizedAppPath(
                `/admin/business/${businessId}/integrations`,
                locale,
              )}
            >
              {t("manageConnection")}
            </a>
          </>
        )
      )}
      {publication?.status === "scheduled" && !readOnly && (
        <>
          <p className="mt-3 text-xs text-zinc-500">{t("cancelToEdit")}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => act("cancel")}
            disabled={busy}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("cancelSchedule")}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {t.has(`errors.${error}`)
            ? t(`errors.${error}`)
            : t("errors.INSTAGRAM_REQUEST_FAILED")}
        </p>
      )}
    </section>
  )
}
