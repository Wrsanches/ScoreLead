"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { Check, Loader2, Trash2 } from "lucide-react";
import { getPathname, useRouter } from "@/i18n/routing";
import {
  ContentWrapper,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/admin";
import {
  useBusinessAccess,
  useBusinessId,
} from "@/components/admin/business-context";
import { usePlan } from "@/components/admin/plan-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { uploadImage } from "@/lib/upload-client";
import { publicationLocksPost } from "@/lib/instagram/status";
import type { PublicationView } from "@/lib/instagram/data";
import type { ContentPostRow } from "../types";
import { type PostFormValues, blank, fromPost } from "./shared";
import { ComposeFields } from "./compose-fields";
import { MediaPanel } from "./media-panel";
import { PublishCard } from "./publish-card";

const CALENDAR_HREF = "/admin/content-calendar";

function sameValues(a: PostFormValues | null, b: PostFormValues | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Full-page post editor. `postId` is null for a new post; `draftDate` seeds the
 * schedule for new posts opened from a calendar day.
 *
 * Saving is explicit (button or Cmd/Ctrl+S), but anything that needs a saved
 * row (image generation, uploads, scheduling) saves on its own first, so users
 * never hit a "save before you can do this" wall.
 */
export function PostEditor({
  postId,
  draftDate,
}: {
  postId: string | null;
  draftDate: string | null;
}) {
  const t = useTranslations("contentCalendar");
  const ti = useTranslations("instagram");
  const locale = useLocale();
  const router = useRouter();
  // Raw router for hrefs captured from rendered links, which already carry
  // the locale prefix.
  const nextRouter = useNextRouter();
  const businessId = useBusinessId();
  const { readOnly } = useBusinessAccess();
  const { openUpgrade } = usePlan();

  const [post, setPost] = useState<ContentPostRow | null>(null);
  const [loading, setLoading] = useState(Boolean(postId));
  const [missing, setMissing] = useState(false);
  const [values, setValues] = useState<PostFormValues>(() =>
    blank(draftDate ? new Date(draftDate) : null),
  );
  const [savedValues, setSavedValues] = useState<PostFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** Destination the user tried to reach while the form had unsaved edits. */
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Refs so async helpers (save-before-generate, keyboard shortcut) always see
  // the latest state without re-creating callbacks on every keystroke.
  const postRef = useRef(post);
  postRef.current = post;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const savedValuesRef = useRef(savedValues);
  savedValuesRef.current = savedValues;

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    fetch(`/api/content-calendar/${postId}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setMissing(true);
          return;
        }
        if (!res.ok) throw new Error("LOAD_FAILED");
        const body = await res.json();
        if (cancelled) return;
        const row = body.post as ContentPostRow;
        const initial = fromPost(row);
        setPost(row);
        setValues(initial);
        setSavedValues(initial);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // While Instagram is publishing, refresh the row until it settles.
  const publicationStatus = post?.publication?.status;
  const currentId = post?.id;
  useEffect(() => {
    if (!currentId || publicationStatus !== "publishing") return;
    const id = setInterval(() => {
      fetch(`/api/content-calendar/${currentId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          if (body?.post) setPost(body.post as ContentPostRow);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [currentId, publicationStatus]);

  const dirty = !sameValues(values, savedValues);
  const publicationLocked = publicationLocksPost(publicationStatus);
  const locked = readOnly || publishBusy || publicationLocked;
  const guardRef = useRef(false);
  guardRef.current = dirty && !readOnly;

  // In-app navigation has no route-change hook, so intercept plain left clicks
  // on internal links while the form is dirty and ask first. Modified clicks,
  // new tabs, hash links, and external URLs pass through untouched.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!guardRef.current) return;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const raw = anchor.getAttribute("href") ?? "";
      if (raw.startsWith("#")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveHref(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!dirty || readOnly) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, readOnly]);

  const save = useCallback(async (): Promise<ContentPostRow> => {
    const current = postRef.current;
    const next = valuesRef.current;
    const response = await fetch(
      current ? `/api/content-calendar/${current.id}` : "/api/content-calendar",
      {
        method: current ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current ? next : { ...next, businessId }),
      },
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.post) throw new Error(body.code || "SAVE_FAILED");
    const saved = body.post as ContentPostRow;
    setPost(saved);
    setSavedValues(next);
    if (!current) {
      // The post now exists: make the URL its permanent address without a
      // navigation, so a refresh or share lands on this same editor.
      const href = getPathname({ locale, href: `${CALENDAR_HREF}/${saved.id}` });
      window.history.replaceState(window.history.state, "", href);
    }
    return saved;
  }, [businessId, locale]);

  const ensureSaved = useCallback(async (): Promise<ContentPostRow> => {
    const current = postRef.current;
    if (current && sameValues(valuesRef.current, savedValuesRef.current)) {
      return current;
    }
    return save();
  }, [save]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setFormError(null);
    try {
      await save();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      setFormError(ti("errors.SAVE_FAILED"));
    } finally {
      setSaving(false);
    }
  }, [save, ti]);

  const canSave = !locked && !saving && !mediaBusy && (dirty || !post);
  const canSaveRef = useRef(canSave);
  canSaveRef.current = canSave;
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (canSaveRef.current) void handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handlePlanGuard(response: Response) {
    if (response.status === 402) {
      const body = await response.json().catch(() => ({}));
      openUpgrade(body?.action);
      throw new Error("PLAN_LIMIT");
    }
  }

  async function handleGenerate(referenceFile?: File) {
    const saved = await ensureSaved();
    const referenceUpload = referenceFile
      ? await uploadImage(referenceFile, {
          kind: "content-reference",
          postId: saved.id,
          slideIndex: 0,
          maxBytes: 4 * 1024 * 1024,
        })
      : null;
    const response = await fetch(`/api/content-calendar/${saved.id}/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceKey: referenceUpload?.key }),
    });
    await handlePlanGuard(response);
    if (!response.ok) throw new Error("Failed");
    const body = await response.json();
    if (body.post) setPost(body.post as ContentPostRow);
    const failures = Array.isArray(body.failures) ? body.failures : [];
    return {
      failureIndexes: failures
        .map((f: { index?: number }) => f?.index)
        .filter((n: unknown): n is number => typeof n === "number"),
    };
  }

  async function handleRegenerateSlide(
    slideIndex: number,
    refinementPrompt?: string,
    referenceFile?: File,
  ) {
    const saved = await ensureSaved();
    const referenceUpload = referenceFile
      ? await uploadImage(referenceFile, {
          kind: "content-reference",
          postId: saved.id,
          slideIndex,
          maxBytes: 4 * 1024 * 1024,
        })
      : null;
    const response = await fetch(
      `/api/content-calendar/${saved.id}/image/${slideIndex}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refinementPrompt,
          referenceKey: referenceUpload?.key,
        }),
      },
    );
    await handlePlanGuard(response);
    if (!response.ok) throw new Error("Failed");
    const body = await response.json();
    if (body.post) setPost(body.post as ContentPostRow);
  }

  async function handleUploadSlide(slideIndex: number, file: File) {
    const saved = await ensureSaved();
    const { key } = await uploadImage(file, {
      kind: "content-slide",
      postId: saved.id,
      slideIndex,
    });
    const response = await fetch(
      `/api/content-calendar/${saved.id}/image/${slideIndex}/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          headline: saved.images?.[slideIndex]?.headline ?? "",
        }),
      },
    );
    if (!response.ok) throw new Error("Failed");
    const body = await response.json();
    if (body.post) setPost(body.post as ContentPostRow);
  }

  function handlePublicationChange(publication: PublicationView | null) {
    const scheduled = publication?.status === "scheduled";
    setPost((previous) =>
      previous
        ? {
            ...previous,
            publication,
            ...(scheduled
              ? {
                  scheduledFor: publication.scheduledAt,
                  status: "approved" as const,
                }
              : {}),
          }
        : previous,
    );
    if (scheduled) {
      const patch = {
        status: "approved" as const,
        scheduledFor: publication.scheduledAt,
      };
      setValues((v) => ({ ...v, ...patch }));
      setSavedValues((v) => (v ? { ...v, ...patch } : v));
    }
  }

  function handleBack() {
    const href = getPathname({ locale, href: CALENDAR_HREF });
    if (guardRef.current) setLeaveHref(href);
    else nextRouter.push(href);
  }

  async function saveAndLeave() {
    if (!leaveHref || leaving) return;
    setLeaving(true);
    setFormError(null);
    try {
      await save();
      nextRouter.push(leaveHref);
    } catch {
      setFormError(ti("errors.SAVE_FAILED"));
      setLeaving(false);
      setLeaveHref(null);
    }
  }

  function discardAndLeave() {
    if (!leaveHref) return;
    // Treat the current values as saved so the unload prompt stays quiet.
    setSavedValues(valuesRef.current);
    guardRef.current = false;
    nextRouter.push(leaveHref);
  }

  async function handleDelete() {
    if (!post || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/content-calendar/${post.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      // Nothing left to lose; silence the unsaved-changes prompt.
      setSavedValues(valuesRef.current);
      router.push(CALENDAR_HREF);
    } catch {
      setFormError(ti("errors.SAVE_FAILED"));
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  const isNew = !post;
  const title = isNew ? t("newPost") : t("editPost");

  if (missing) {
    return (
      <>
        <PageHeader
          title={t("editPost")}
          backHref={CALENDAR_HREF}
          onBack={handleBack}
          breadcrumbs={[{ label: t("title") }]}
        />
        <div className="flex-1 overflow-auto">
          <ContentWrapper>
            <EmptyState
              title={t("postMissing")}
              action={
                <button
                  type="button"
                  onClick={() => router.push(CALENDAR_HREF)}
                  className="glass-pill inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  {t("backToCalendar")}
                </button>
              }
            />
          </ContentWrapper>
        </div>
      </>
    );
  }

  const statusLabel = saving
    ? t("saving")
    : savedFlash
      ? t("saved")
      : dirty && post
        ? t("unsavedChanges")
        : null;

  return (
    <>
      <PageHeader
        title={title}
        backHref={CALENDAR_HREF}
        onBack={handleBack}
        breadcrumbs={[{ label: t("title") }]}
        actions={
          <div className="flex items-center gap-2">
            {statusLabel && (
              <span
                className={`hidden text-xs sm:inline ${
                  savedFlash
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500"
                }`}
                aria-live="polite"
              >
                {statusLabel}
              </span>
            )}
            {post && !locked && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting || mediaBusy}
                aria-label={t("deletePost")}
                title={t("deletePost")}
                className="glass-hover inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            )}
            {!locked && (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                {t("save")}
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <ContentWrapper>
          {loading ? (
            <LoadingState />
          ) : (
            <>
              {publicationLocked && (
                <div className="mb-5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-700 dark:text-sky-300">
                  {ti("cancelToEdit")}
                </div>
              )}
              {formError && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                >
                  {formError}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
                <div className="min-w-0 space-y-4">
                  <fieldset
                    disabled={locked || saving}
                    className="min-w-0 space-y-4"
                  >
                    <ComposeFields
                      values={values}
                      onChange={(patch) =>
                        setValues((v) => ({ ...v, ...patch }))
                      }
                    />
                  </fieldset>
                  <PublishCard
                    post={post}
                    values={values}
                    businessId={businessId}
                    disabled={locked || saving || mediaBusy}
                    readOnly={readOnly}
                    onChange={(patch) =>
                      setValues((v) => ({ ...v, ...patch }))
                    }
                    ensureSaved={ensureSaved}
                    onPublicationChange={handlePublicationChange}
                    onBusyChange={setPublishBusy}
                  />
                </div>

                <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
                  <MediaPanel
                    post={post}
                    businessId={businessId}
                    values={values}
                    locked={locked}
                    onGenerate={handleGenerate}
                    onRegenerateSlide={handleRegenerateSlide}
                    onUploadSlide={handleUploadSlide}
                    onBusyChange={setMediaBusy}
                  />
                </aside>
              </div>
            </>
          )}
        </ContentWrapper>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-strong rounded-2xl border-transparent">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t("deletePost")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={leaveHref !== null}
        onOpenChange={(open) => {
          if (!open && !leaving) setLeaveHref(null);
        }}
      >
        <AlertDialogContent className="glass-strong rounded-2xl border-transparent">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leaveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("leaveBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <button
              type="button"
              onClick={discardAndLeave}
              disabled={leaving}
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
            >
              {t("leaveDiscard")}
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <AlertDialogCancel disabled={leaving}>{t("leaveStay")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void saveAndLeave();
                }}
                disabled={leaving}
                className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              >
                {leaving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {t("leaveSave")}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
