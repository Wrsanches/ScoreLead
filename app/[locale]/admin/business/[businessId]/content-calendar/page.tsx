"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  useBusinessAccess,
  useBusinessId,
} from "@/components/admin/business-context";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { PageHeader, ContentWrapper, LoadingState } from "@/components/admin";
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
import { MonthGrid } from "@/components/admin/content-calendar/month-grid";
import { CalendarEmptyState } from "@/components/admin/content-calendar/empty-state";
import type { ContentPostRow } from "@/components/admin/content-calendar/types";
import type { ContentPlanJobView } from "@/lib/jobs/content-plan-queue";
import { InstagramStatusButton } from "@/components/admin/integrations/instagram-status-button";
import { publicationLocksPost } from "@/lib/instagram/status";
import { usePlan } from "@/components/admin/plan-context";

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
  const tb = useTranslations("billing");
  const locale = useLocale();
  const router = useRouter();
  const businessId = useBusinessId();
  const { readOnly } = useBusinessAccess();
  const { openUpgrade, limits } = usePlan();
  /**
   * The content calendar starts at Growth. A cap of 0 means the tier does not
   * include it at all (an unlimited cap arrives as null, not 0), so the page
   * still shows any existing posts but swaps generation for an upgrade prompt.
   */
  const contentLocked = limits?.contentPlans === 0;
  const weekStartsOn: 0 | 1 = locale === "en" ? 0 : 1;
  const [cursor, setCursor] = useState<Date>(() => monthStartUtc(new Date()));
  const [posts, setPosts] = useState<ContentPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /**
   * The month's generation job, as reported by the server. This is what makes
   * generation survive leaving the page: the state lives in the database, not
   * in this component, so a reload picks the run back up mid-flight.
   */
  const [job, setJob] = useState<ContentPlanJobView | null>(null);
  const publishing = posts.some(post => post.publication && ["scheduled", "publishing"].includes(post.publication.status));
  const generating = job?.status === "queued" || job?.status === "running";
  const [regenerateOpen, setRegenerateOpen] = useState(false);

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
        `/api/content-calendar?businessId=${businessId}&month=${monthParam(cursor)}`,
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
        const incoming = (body.job as ContentPlanJobView | null) ?? null;
        setJob(incoming);
        if (incoming?.status === "failed") {
          setError(incoming.errorMessage || "Generation failed");
        }
      }
    } catch {
      setError("Failed to load");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [cursor, t, businessId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // While a job is queued or running, poll until it settles. The calendar GET
  // returns the posts and the job together, so the finished plan lands in the
  // same response that reports completion.
  useEffect(() => {
    if (!generating && !publishing) return;
    const id = setInterval(() => {
      fetch(
        `/api/content-calendar?businessId=${businessId}&month=${monthParam(cursor)}`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => {
          if (!body) return;
          const received = (body.posts as ContentPostRow[]) ?? [];
          setPosts(received);
          const incoming = (body.job as ContentPlanJobView | null) ?? null;
          setJob(incoming);
          if (incoming?.status === "failed") {
            setError(incoming.errorMessage || "Generation failed");
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [generating, publishing, businessId, cursor]);

  function handleGenerate() {
    if (generating) return;
    if (contentLocked) {
      openUpgrade("contentPlan");
      return;
    }
    // Regenerating over an existing month replaces untouched AI drafts, so it
    // asks first. An empty month starts right away.
    if (posts.length > 0) {
      setRegenerateOpen(true);
      return;
    }
    void runGenerate();
  }

  async function runGenerate() {
    setRegenerateOpen(false);
    setError(null);
    // Optimistic in-progress state: the response only carries the queued job,
    // and the poller below drives it from here.
    setJob({
      id: "pending",
      month: monthParam(cursor),
      status: "queued",
      insertedPosts: 0,
      postIds: [],
      errorMessage: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    });
    try {
      const res = await fetch("/api/content-calendar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          month: monthParam(cursor),
          replaceExisting: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setJob(null);
        if (res.status === 402) openUpgrade(body?.action);
        else setError(body?.error || "Generation failed");
        return;
      }
      // 202 + the job row. Generation continues server-side even if this tab
      // goes away; the poller (or the next page load) picks it up.
      setJob((body.job as ContentPlanJobView | null) ?? null);
    } catch {
      setJob(null);
      setError("Generation failed");
    }
  }

  async function handleReschedule(postId: string, newDate: Date) {
    if (publicationLocksPost(posts.find(post => post.id === postId)?.publication?.status)) return;
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

  // The editor is a full page. New posts carry the picked day so the form
  // opens with that date already set.
  function openNew(date: Date) {
    router.push(`/admin/content-calendar/new?date=${encodeURIComponent(date.toISOString())}`);
  }

  function openEdit(id: string) {
    router.push(`/admin/content-calendar/${id}`);
  }

  const monthLabel = cursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <div className="flex-1 overflow-auto">
        <ContentWrapper>
          <PageHeader
            title={t("title")}
            description={t("subtitle")}
            breadcrumbs={[{ label: t("title") }]}
          />
          {/* Sticky header: month nav + provider + generate */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-white/[0.03] p-1">
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
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.11] transition-colors"
                aria-label={t("monthPrev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold text-zinc-900 dark:text-white capitalize min-w-35 text-center tabular-nums">
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
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.11] transition-colors"
                aria-label={t("monthNext")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCursor(monthStartUtc(new Date()))}
              className="px-3 h-10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-50/60 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.11] border border-zinc-200 dark:border-white/[0.08] rounded-xl transition-colors"
            >
              {t("today")}
            </button>

            <div className="ml-auto flex items-center gap-2">
              {!readOnly && (
                <button
                  type="button"
                  disabled={loading || generating}
                  onClick={() => {
                    const today = new Date();
                    openNew(monthParam(cursor) === monthParam(today) ? today : monthStart);
                  }}
                  className="inline-flex items-center gap-2 h-10 px-4 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.11] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  {t("addPost")}
                </button>
              )}
              <InstagramStatusButton businessId={businessId} />
              {posts.length > 0 && !readOnly && (
                <button
                  type="button"
                  onClick={
                    contentLocked
                      ? () => openUpgrade("contentPlan")
                      : handleGenerate
                  }
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
                  ) : contentLocked ? (
                    tb("upgradeCta")
                  ) : (
                    t("regenerate")
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : posts.length === 0 ? (
            <CalendarEmptyState
              onGenerate={() => void runGenerate()}
              isGenerating={generating}
              readOnly={readOnly}
              locked={contentLocked}
              onUpgrade={() => openUpgrade("contentPlan")}
              startedAt={job?.startedAt ?? job?.createdAt ?? null}
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
                readOnly={readOnly}
              />
            </motion.div>
          )}
        </ContentWrapper>
      </div>

      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent className="glass-strong rounded-2xl border-transparent">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("regenerateConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("regenerateConfirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void runGenerate()}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              {t("regenerateConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
