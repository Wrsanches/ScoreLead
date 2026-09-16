"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ChevronDown,
  ImagePlus,
  Images,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ContentPostRow } from "../types";
import { ReferenceImagePicker } from "../reference-image-picker";
import { type PostFormValues, fieldClass, imageAspectClass } from "./shared";
import { InstagramPreview } from "./instagram-preview";
import { ImageViewerDialog } from "./image-viewer-dialog";

interface MediaPanelProps {
  /** The saved post, or null while a new post has not been created yet. */
  post: ContentPostRow | null;
  businessId: string;
  values: PostFormValues;
  /** Read-only viewer or a publication that locks edits. */
  locked: boolean;
  onGenerate: (referenceFile?: File) => Promise<{ failureIndexes: number[] }>;
  onRegenerateSlide: (
    index: number,
    refinementPrompt?: string,
    referenceFile?: File,
  ) => Promise<void>;
  onUploadSlide: (index: number, file: File) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}

const toolButtonClass =
  "glass-pill inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-zinc-700 transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300";

/**
 * Instagram preview plus everything that changes its images: AI generation,
 * uploads, per-slide tools, and reference assets. Generation and uploads work
 * on unsaved posts too; the parent saves first and passes the saved id.
 */
export function MediaPanel({
  post,
  businessId,
  values,
  locked,
  onGenerate,
  onRegenerateSlide,
  onUploadSlide,
  onBusyChange,
}: MediaPanelProps) {
  const t = useTranslations("contentCalendar");
  const [generating, setGenerating] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [failures, setFailures] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [refsOpen, setRefsOpen] = useState(false);
  const [generationReference, setGenerationReference] = useState<File | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [refineReference, setRefineReference] = useState<File | null>(null);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const generationRefInputRef = useRef<HTMLInputElement | null>(null);
  const refineRefInputRef = useRef<HTMLInputElement | null>(null);

  const images = post?.images ?? [];
  const hasImages = images.length > 0;
  const isCarousel = values.postType === "carousel";
  const clamped = Math.min(slideIndex, Math.max(images.length - 1, 0));
  const busy = generating || regeneratingIndex !== null;

  useEffect(() => {
    setSlideIndex(0);
  }, [images.length]);

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);
  useEffect(() => () => onBusyChange(false), [onBusyChange]);

  // A refinement draft belongs to one slide only.
  useEffect(() => {
    setRefineOpen(false);
    setRefinementPrompt("");
    setRefineReference(null);
  }, [clamped]);

  async function run(index: number | null, work: () => Promise<void>) {
    setError(null);
    if (index === null) setGenerating(true);
    else setRegeneratingIndex(index);
    try {
      await work();
    } catch (failure) {
      if (!(failure instanceof Error && failure.message === "PLAN_LIMIT")) {
        setError(t("imageFailed"));
      }
    } finally {
      if (index === null) setGenerating(false);
      else setRegeneratingIndex(null);
    }
  }

  function handleGenerate() {
    if (busy) return;
    setFailures([]);
    void run(null, async () => {
      const result = await onGenerate(generationReference ?? undefined);
      setFailures(result.failureIndexes ?? []);
      setGenerationReference(null);
    });
  }

  function handleRegenerate(index: number, prompt?: string, reference?: File) {
    if (busy) return;
    void run(index, async () => {
      await onRegenerateSlide(index, prompt, reference);
      setFailures((prev) => prev.filter((i) => i !== index));
    });
  }

  function handleUpload(index: number, file: File) {
    if (busy) return;
    void run(index, async () => {
      await onUploadSlide(index, file);
      setFailures((prev) => prev.filter((i) => i !== index));
    });
  }

  function applyRefinement() {
    const prompt = refinementPrompt.trim();
    if (!prompt && !refineReference) return;
    handleRegenerate(clamped, prompt || undefined, refineReference ?? undefined);
    setRefineOpen(false);
    setRefinementPrompt("");
    setRefineReference(null);
  }

  const canAddPhoto = !hasImages || (isCarousel && images.length < 10);

  return (
    <div className="space-y-4">
      <InstagramPreview
        businessId={businessId}
        images={images}
        index={clamped}
        onIndexChange={setSlideIndex}
        caption={values.caption}
        hashtags={values.hashtags}
        postType={values.postType}
        scheduledFor={values.scheduledFor}
        generating={generating}
        regeneratingIndex={regeneratingIndex}
        imageFailures={failures}
        onExpand={() => setViewerOpen(true)}
      />

      {!locked && (
        <div className="mx-auto w-full max-w-sm space-y-3">
          {/* Two ways to get an image: let the AI design one, or use your own. */}
          <div className={`grid gap-2 ${canAddPhoto ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="min-w-0">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={busy}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/10 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                    <span className="truncate">
                      {isCarousel ? t("generatingCarousel") : t("generatingImage")}
                    </span>
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {generationReference
                        ? t("generateWithReference")
                        : hasImages
                          ? isCarousel
                            ? t("regenerateCarousel")
                            : t("regenerateImage")
                          : isCarousel
                            ? t("generateCarousel")
                            : t("generateImage")}
                    </span>
                  </>
                )}
              </button>
              <p className="mt-1.5 text-center text-[10px] leading-4 text-zinc-500">
                {t("generateHint")}
              </p>
            </div>
            {canAddPhoto && (
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => addInputRef.current?.click()}
                  disabled={busy}
                  className="glass-pill inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-zinc-700 transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300"
                >
                  <ImagePlus className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {hasImages ? t("addMyPhoto") : t("useMyPhoto")}
                  </span>
                </button>
                <p className="mt-1.5 text-center text-[10px] leading-4 text-zinc-500">
                  {t("useMyPhotoHint")}
                </p>
                <input
                  ref={addInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handleUpload(hasImages ? images.length : 0, file);
                  }}
                />
              </div>
            )}
          </div>

          {/* Per-slide tools */}
          {hasImages && !generating && (
            <div className="surface-card rounded-xl p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {t("slideTools", { n: clamped + 1, total: images.length })}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRegenerate(clamped)}
                  disabled={busy}
                  className={toolButtonClass}
                >
                  {regeneratingIndex === clamped ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                  )}
                  {t("regenerateSlide")}
                </button>
                <button
                  type="button"
                  onClick={() => setRefineOpen((open) => !open)}
                  disabled={busy}
                  aria-expanded={refineOpen}
                  className={`${toolButtonClass} ${refineOpen ? "ring-1 ring-emerald-500/40 text-emerald-700 dark:text-emerald-300" : ""}`}
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  {t("refineSlide")}
                </button>
                <button
                  type="button"
                  onClick={() => replaceInputRef.current?.click()}
                  disabled={busy}
                  title={t("uploadSlideHint")}
                  className={toolButtonClass}
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  {t("replaceSlide")}
                </button>
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handleUpload(clamped, file);
                  }}
                />
              </div>

              {refineOpen && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value.slice(0, 500))}
                    placeholder={t("refinePlaceholder")}
                    rows={3}
                    autoFocus
                    className={`${fieldClass} resize-none text-xs`}
                  />
                  <FileAttachRow
                    file={refineReference}
                    inputRef={refineRefInputRef}
                    label={t("refineReference")}
                    onPick={setRefineReference}
                    disabled={busy}
                    attachLabel={t("attachReference")}
                    replaceLabel={t("replaceReference")}
                    removeLabel={t("removeReference")}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={applyRefinement}
                      disabled={busy || (!refinementPrompt.trim() && !refineReference)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-xs font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Wand2 className="size-3.5" aria-hidden="true" />
                      {t("applyRefinement")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRefineOpen(false);
                        setRefinementPrompt("");
                        setRefineReference(null);
                      }}
                      className="glass-hover h-9 rounded-lg px-3 text-xs text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* References */}
          <Collapsible open={refsOpen} onOpenChange={setRefsOpen}>
            <div className="surface-card rounded-xl">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left"
                >
                  <span className="flex min-w-0 items-start gap-2.5">
                    {/* Source photos the AI draws from, tinted violet so it reads
                        as an input rather than as the emerald generate action. */}
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/25 dark:text-violet-300">
                      <Images className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {t("references")}
                        {generationReference ? (
                          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                            {t("referencePending")}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                        {t("referencesHint")}
                      </span>
                    </span>
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-zinc-500 transition-transform ${refsOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 px-3 pb-3">
                  {post ? (
                    <ReferenceImagePicker
                      key={post.id}
                      postId={post.id}
                      businessId={businessId}
                      initialPref={post.referenceImagePref}
                    />
                  ) : null}
                  <FileAttachRow
                    file={generationReference}
                    inputRef={generationRefInputRef}
                    label={t("generationReference")}
                    hint={t("generationReferenceHint")}
                    onPick={setGenerationReference}
                    disabled={busy}
                    attachLabel={t("attachReference")}
                    replaceLabel={t("replaceReference")}
                    removeLabel={t("removeReference")}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {failures.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-[11px] text-red-700 dark:text-red-300">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {t("slidesFailed", { count: failures.length })} {t("slidesFailedHint")}
              </span>
            </div>
          )}
          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}

      <ImageViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        images={images}
        index={clamped}
        onIndexChange={setSlideIndex}
        aspectClass={imageAspectClass(values.postType)}
      />
    </div>
  );
}

function FileAttachRow({
  file,
  inputRef,
  label,
  hint,
  onPick,
  disabled,
  attachLabel,
  replaceLabel,
  removeLabel,
}: {
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  label: string;
  hint?: string;
  onPick: (file: File | null) => void;
  disabled: boolean;
  attachLabel: string;
  replaceLabel: string;
  removeLabel: string;
}) {
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
          {hint ? (
            <p className="text-[11px] leading-snug text-zinc-500">{hint}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="glass-pill inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-zinc-700 transition-[filter] hover:brightness-110 disabled:opacity-40 dark:text-zinc-300"
        >
          <ImagePlus className="size-3.5" aria-hidden="true" />
          {file ? replaceLabel : attachLabel}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>
      {file && previewUrl && (
        <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-black/[0.03] p-1.5 pr-2 ring-1 ring-black/[0.06] dark:bg-black/25 dark:ring-white/[0.08]">
          {/* Local object URL for a just-picked file; Next's loader can't help here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="size-10 shrink-0 rounded-md object-cover ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
          />
          <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-700 dark:text-zinc-300">
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => onPick(null)}
            disabled={disabled}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-black/[0.05] hover:text-zinc-700 dark:hover:bg-white/[0.11] dark:hover:text-zinc-200"
            aria-label={removeLabel}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
