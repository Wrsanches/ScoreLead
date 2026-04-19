"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useActiveBusiness } from "@/components/admin/active-business-context";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  AtSign,
  Loader2,
} from "lucide-react";
import { PageHeader, ContentWrapper, LoadingState } from "@/components/admin";
import { MonthGrid } from "@/components/admin/content-calendar/month-grid";
import {
  PostSheet,
  type PostFormValues,
} from "@/components/admin/content-calendar/post-sheet";
import { GenerateBanner } from "@/components/admin/content-calendar/generate-banner";
import { CalendarEmptyState } from "@/components/admin/content-calendar/empty-state";
import type { ContentPostRow } from "@/components/admin/content-calendar/types";

function monthStartUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function monthEndUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

function monthParam(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function ContentCalendarPage() {
  const t = useTranslations("contentCalendar");
  const locale = useLocale();
  const { activeBusinessId } = useActiveBusiness();
  const weekStartsOn: 0 | 1 = locale === "en" ? 0 : 1;
  const [cursor, setCursor] = useState<Date>(() => monthStartUtc(new Date()));
  const [posts, setPosts] = useState<ContentPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentGenerationIds, setRecentGenerationIds] = useState<
    string[] | null
  >(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPostRow | null>(null);
  const [draftDate, setDraftDate] = useState<Date | null>(null);

  const monthStart = useMemo(() => monthStartUtc(cursor), [cursor]);
  const monthEnd = useMemo(() => monthEndUtc(cursor), [cursor]);

  const weekdayLabels =
    weekStartsOn === 0
      ? [
          t("weekdayShortSun"),
          t("weekdayShortMon"),
          t("weekdayShortTue"),
          t("weekdayShortWed"),
          t("weekdayShortThu"),
          t("weekdayShortFri"),
          t("weekdayShortSat"),
        ]
      : [
          t("weekdayShortMon"),
          t("weekdayShortTue"),
          t("weekdayShortWed"),
          t("weekdayShortThu"),
          t("weekdayShortFri"),
          t("weekdayShortSat"),
          t("weekdayShortSun"),
        ];

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/content-calendar?month=${monthParam(cursor)}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError(t("onboardingRequired"));
        } else {
          setError(body?.error || "Failed to load");
        }
        setPosts([]);
      } else {
        const body = await res.json();
        setPosts((body.posts as ContentPostRow[]) ?? []);
      }
    } catch {
      setError("Failed to load");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [cursor, t, activeBusinessId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleGenerate() {
    if (generating) return;
    if (posts.length > 0) {
      const ok = window.confirm(
        "This will replace untouched AI drafts for this month. Posts you've edited or that already have images will be kept. Continue?",
      );
      if (!ok) return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/content-calendar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: monthParam(cursor),
          replaceExisting: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || "Generation failed");
        return;
      }
      const fresh = (body.posts as ContentPostRow[]) ?? [];
      setPosts(fresh);
      setRecentGenerationIds(fresh.map((p) => p.id));
    } catch {
      setError("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleUndoGeneration() {
    if (!recentGenerationIds) return;
    const ids = recentGenerationIds;
    setRecentGenerationIds(null);
    setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/content-calendar/${id}`, { method: "DELETE" }).catch(
          () => null,
        ),
      ),
    );
  }

  async function handleApproveAll() {
    if (!recentGenerationIds) return;
    const ids = recentGenerationIds;
    setRecentGenerationIds(null);
    setPosts((prev) =>
      prev.map((p) =>
        ids.includes(p.id) ? { ...p, status: "approved" as const } : p,
      ),
    );
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/content-calendar/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        }).catch(() => null),
      ),
    );
  }

  async function handleReschedule(postId: string, newDate: Date) {
    const previous = posts;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, scheduledFor: newDate.toISOString() } : p,
      ),
    );
    try {
      const res = await fetch(`/api/content-calendar/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: newDate.toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setPosts(previous);
    }
  }

  function openNew(date: Date) {
    setEditingPost(null);
    setDraftDate(date);
    setSheetOpen(true);
  }

  function openEdit(id: string) {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    setEditingPost(post);
    setDraftDate(null);
    setSheetOpen(true);
  }

  async function handleSave(values: PostFormValues) {
    if (editingPost) {
      const previous = posts;
      const optimistic: ContentPostRow = {
        ...editingPost,
        ...values,
        pillar: values.pillar,
        hashtags: values.hashtags,
      };
      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? optimistic : p)),
      );
      setSheetOpen(false);
      try {
        const res = await fetch(`/api/content-calendar/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("Failed");
        const body = await res.json();
        if (body.post) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === editingPost.id ? (body.post as ContentPostRow) : p,
            ),
          );
        }
      } catch {
        setPosts(previous);
      }
    } else {
      setSheetOpen(false);
      try {
        const res = await fetch("/api/content-calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("Failed");
        const body = await res.json();
        if (body.post) {
          setPosts((prev) => [...prev, body.post as ContentPostRow]);
        }
      } catch {
        // noop
      }
    }
  }

  async function handleGenerateImage(postId: string) {
    const res = await fetch(`/api/content-calendar/${postId}/image`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed");
    const body = await res.json();
    if (body.post) {
      const updated = body.post as ContentPostRow;
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      setEditingPost((prev) => (prev?.id === postId ? updated : prev));
    }
    const failures = Array.isArray(body.failures) ? body.failures : [];
    return {
      failureIndexes: failures
        .map((f: { index?: number }) => f?.index)
        .filter((n: unknown): n is number => typeof n === "number"),
    };
  }

  async function handleRegenerateSlide(
    postId: string,
    slideIndex: number,
    refinementPrompt?: string,
  ) {
    const res = await fetch(
      `/api/content-calendar/${postId}/image/${slideIndex}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refinementPrompt }),
      },
    );
    if (!res.ok) throw new Error("Failed");
    const body = await res.json();
    if (body.post) {
      const updated = body.post as ContentPostRow;
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      setEditingPost((prev) => (prev?.id === postId ? updated : prev));
    }
  }

  async function handleUploadSlide(
    postId: string,
    slideIndex: number,
    file: File,
    headline: string,
  ) {
    const form = new FormData();
    form.append("file", file);
    if (headline) form.append("headline", headline);
    const res = await fetch(
      `/api/content-calendar/${postId}/image/${slideIndex}/upload`,
      { method: "POST", body: form },
    );
    if (!res.ok) throw new Error("Failed");
    const body = await res.json();
    if (body.post) {
      const updated = body.post as ContentPostRow;
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      setEditingPost((prev) => (prev?.id === postId ? updated : prev));
    }
  }

  async function handleDelete(id: string) {
    setSheetOpen(false);
    const previous = posts;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch(`/api/content-calendar/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setPosts(previous);
    }
  }

  const monthLabel = cursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <PageHeader title={t("title")} breadcrumbs={[{ label: t("title") }]} />

      <div className="flex-1 overflow-auto">
        <ContentWrapper>
          {/* Sticky header: month nav + provider + generate */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl border border-zinc-800/70 bg-zinc-900/30 p-1">
              <button
                type="button"
                onClick={() =>
                  setCursor(
                    new Date(
                      Date.UTC(
                        cursor.getUTCFullYear(),
                        cursor.getUTCMonth() - 1,
                        1,
                      ),
                    ),
                  )
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors"
                aria-label={t("monthPrev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold text-white capitalize min-w-35 text-center tabular-nums">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCursor(
                    new Date(
                      Date.UTC(
                        cursor.getUTCFullYear(),
                        cursor.getUTCMonth() + 1,
                        1,
                      ),
                    ),
                  )
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors"
                aria-label={t("monthNext")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCursor(monthStartUtc(new Date()))}
              className="px-3 h-10 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900/30 hover:bg-zinc-800/60 border border-zinc-800/70 rounded-xl transition-colors"
            >
              {t("today")}
            </button>

            <div className="ml-auto flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 h-10 bg-zinc-900/30 border border-zinc-800/70 rounded-xl text-xs text-zinc-300">
                <AtSign className="w-3.5 h-3.5 text-rose-400" />
                {t("provider")}
              </div>
              {posts.length > 0 && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 h-10 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/15 transition-colors"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">
                        {t("generating")}
                      </span>
                    </>
                  ) : (
                    t("regenerate")
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
              {error}
            </div>
          )}

          <AnimatePresence>
            {recentGenerationIds && recentGenerationIds.length > 0 && (
              <div className="mb-4">
                <GenerateBanner
                  count={recentGenerationIds.length}
                  onUndo={handleUndoGeneration}
                  onApproveAll={handleApproveAll}
                  onDismiss={() => setRecentGenerationIds(null)}
                />
              </div>
            )}
          </AnimatePresence>

          {loading ? (
            <LoadingState />
          ) : posts.length === 0 ? (
            <CalendarEmptyState
              onGenerate={handleGenerate}
              isGenerating={generating}
            />
          ) : (
            <motion.div
              animate={
                generating
                  ? { opacity: 0.4, filter: "blur(3px)" }
                  : { opacity: 1, filter: "blur(0px)" }
              }
              transition={{ duration: 0.2 }}
            >
              <MonthGrid
                monthStart={monthStart}
                monthEnd={monthEnd}
                posts={posts}
                onSelectPost={openEdit}
                onAddPost={openNew}
                onReschedule={handleReschedule}
                weekdayLabels={weekdayLabels}
                weekStartsOn={weekStartsOn}
              />
            </motion.div>
          )}
        </ContentWrapper>
      </div>

      <PostSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        post={editingPost}
        draftDate={draftDate}
        onSave={handleSave}
        onDelete={handleDelete}
        onGenerateImage={handleGenerateImage}
        onRegenerateSlide={handleRegenerateSlide}
        onUploadSlide={handleUploadSlide}
      />
    </>
  );
}
