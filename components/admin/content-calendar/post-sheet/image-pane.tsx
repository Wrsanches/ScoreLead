"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ImagePlus, Loader2, Wand2, X } from "lucide-react";
import type { ContentPostType } from "@/lib/content-pillars";
import type { ContentPostRow } from "../types";
import { imageAspectClass } from "./shared";
import { InstagramPreview } from "./instagram-preview";
import { SlideControls } from "./slide-controls";
import { ImageViewerDialog } from "./image-viewer-dialog";

interface ImagePaneProps {
  post: ContentPostRow;
  businessId: string;
  caption: string;
  hashtags: string[];
  postType: ContentPostType;
  scheduledFor: string;
  onGenerateImage: (
    postId: string,
    referenceFile?: File,
  ) => Promise<{ failureIndexes: number[] }>;
  onRegenerateSlide?: (
    postId: string,
    slideIndex: number,
    refinementPrompt?: string,
    referenceFile?: File,
  ) => Promise<void>;
  onUploadSlide?: (
    postId: string,
    slideIndex: number,
    file: File,
    headline: string,
  ) => Promise<void>;
  /** Slot for the business product reference-image picker. */
  referenceSlot?: React.ReactNode;
}

export function ImagePane({
  post,
  businessId,
  caption,
  hashtags,
  postType,
  scheduledFor,
  onGenerateImage,
  onRegenerateSlide,
  onUploadSlide,
  referenceSlot,
}: ImagePaneProps) {
  const t = useTranslations("contentCalendar");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [regeneratingSlideIndex, setRegeneratingSlideIndex] = useState<
    number | null
  >(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFailures, setImageFailures] = useState<number[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [generationReference, setGenerationReference] = useState<File | null>(
    null,
  );

  const images = post.images ?? [];
  const hasImages = images.length > 0;

  useEffect(() => {
    setSlideIndex(0);
  }, [images.length]);

  const clampedIndex = Math.min(slideIndex, Math.max(images.length - 1, 0));
  const aspectClass = imageAspectClass(postType);
  const isCarousel = postType === "carousel";
  const busy = generatingImage || regeneratingSlideIndex !== null;

  async function handleGenerateImage() {
    if (generatingImage) return;
    setGeneratingImage(true);
    setImageError(null);
    setImageFailures([]);
    try {
      const result = await onGenerateImage(
        post.id,
        generationReference ?? undefined,
      );
      setImageFailures(result.failureIndexes ?? []);
      setGenerationReference(null);
    } catch {
      setImageError(t("imageFailed"));
    } finally {
      setGeneratingImage(false);
    }
  }

  async function handleRegenerateSlide(
    index: number,
    refinementPrompt?: string,
    referenceFile?: File,
  ) {
    if (!onRegenerateSlide || regeneratingSlideIndex !== null) return;
    setRegeneratingSlideIndex(index);
    setImageError(null);
    try {
      await onRegenerateSlide(post.id, index, refinementPrompt, referenceFile);
      setImageFailures((prev) => prev.filter((i) => i !== index));
    } catch {
      setImageError(t("imageFailed"));
    } finally {
      setRegeneratingSlideIndex(null);
    }
  }

  async function handleUploadSlide(index: number, file: File) {
    if (!onUploadSlide) return;
    setRegeneratingSlideIndex(index);
    setImageError(null);
    try {
      const headline = post.images?.[index]?.headline ?? "";
      await onUploadSlide(post.id, index, file, headline);
      setImageFailures((prev) => prev.filter((i) => i !== index));
    } catch {
      setImageError(t("imageFailed"));
    } finally {
      setRegeneratingSlideIndex(null);
    }
  }

  return (
    <div className="space-y-4">
      <InstagramPreview
        businessId={businessId}
        images={images}
        index={clampedIndex}
        onIndexChange={setSlideIndex}
        caption={caption}
        hashtags={hashtags}
        postType={postType}
        scheduledFor={scheduledFor}
        generating={generatingImage}
        regeneratingIndex={regeneratingSlideIndex}
        imageFailures={imageFailures}
        onExpand={() => setViewerOpen(true)}
      />

      {/* Image toolbar */}
      <div className="mx-auto w-full max-w-sm space-y-2.5">
        {hasImages && !generatingImage && (
          <SlideControls
            key={clampedIndex}
            slideNumber={clampedIndex + 1}
            busy={busy}
            regenerating={regeneratingSlideIndex === clampedIndex}
            canRegenerate={Boolean(onRegenerateSlide)}
            canUpload={Boolean(onUploadSlide)}
            onRegenerate={(refinement, referenceFile) =>
              handleRegenerateSlide(clampedIndex, refinement, referenceFile)
            }
            onUpload={(file) => handleUploadSlide(clampedIndex, file)}
          />
        )}

        {referenceSlot}

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                {t("generationReference")}
              </p>
              <p
                id={`generation-reference-hint-${post.id}`}
                className="text-[9px] leading-relaxed text-zinc-500 dark:text-zinc-600"
              >
                {t("generationReferenceHint")}
              </p>
            </div>
            <input
              id={`generation-reference-${post.id}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="peer sr-only"
              disabled={busy}
              aria-describedby={`generation-reference-hint-${post.id}`}
              onChange={(event) => {
                setGenerationReference(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            <label
              htmlFor={`generation-reference-${post.id}`}
              className="shrink-0 inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-zinc-950"
            >
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              {generationReference
                ? t("replaceReference")
                : t("attachReference")}
            </label>
          </div>

          {generationReference && (
            <div className="mt-2 flex min-h-9 items-center gap-2 rounded-lg bg-white dark:bg-zinc-950 px-2.5 ring-1 ring-zinc-200 dark:ring-zinc-800">
              <ImagePlus
                className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-700 dark:text-zinc-300">
                {generationReference.name}
              </span>
              <button
                type="button"
                onClick={() => setGenerationReference(null)}
                disabled={busy}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label={t("removeReference")}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerateImage}
          disabled={busy}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
        >
          {generatingImage ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isCarousel ? t("generatingCarousel") : t("generatingImage")}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              {hasImages
                ? isCarousel
                  ? t("regenerateCarousel")
                  : t("regenerateImage")
                : isCarousel
                  ? t("generateCarousel")
                  : t("generateImage")}
            </>
          )}
        </button>

        {imageFailures.length > 0 && (
          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-700 dark:text-red-300">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>
              {t("slidesFailed", { count: imageFailures.length })}{" "}
              {t("slidesFailedHint")}
            </span>
          </div>
        )}
        {imageError && (
          <p className="text-[10px] text-red-600 dark:text-red-400">
            {imageError}
          </p>
        )}
      </div>

      <ImageViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        images={images}
        index={clampedIndex}
        onIndexChange={setSlideIndex}
        aspectClass={aspectClass}
      />
    </div>
  );
}
