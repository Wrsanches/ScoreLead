"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Expand,
  ImageIcon,
  Loader2,
  Wand2,
} from "lucide-react";
import type { ContentPostType } from "@/lib/content-pillars";
import type { ContentPostRow } from "../types";
import { imageAspectClass, microLabelClass } from "./shared";
import { SlideControls } from "./slide-controls";
import { ImageViewerDialog } from "./image-viewer-dialog";

interface ImagePaneProps {
  post: ContentPostRow;
  postType: ContentPostType;
  onGenerateImage: (postId: string) => Promise<{ failureIndexes: number[] }>;
  onRegenerateSlide?: (
    postId: string,
    slideIndex: number,
    refinementPrompt?: string,
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
  postType,
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

  const images = post.images ?? [];
  const hasImages = images.length > 0;

  useEffect(() => {
    setSlideIndex(0);
  }, [images.length]);

  const clampedIndex = Math.min(slideIndex, Math.max(images.length - 1, 0));
  const currentImage = hasImages ? images[clampedIndex] : null;
  const aspectClass = imageAspectClass(postType);
  const isCarousel = postType === "carousel";
  const busy = generatingImage || regeneratingSlideIndex !== null;

  async function handleGenerateImage() {
    if (generatingImage) return;
    setGeneratingImage(true);
    setImageError(null);
    setImageFailures([]);
    try {
      const result = await onGenerateImage(post.id);
      setImageFailures(result.failureIndexes ?? []);
    } catch {
      setImageError(t("imageFailed"));
    } finally {
      setGeneratingImage(false);
    }
  }

  async function handleRegenerateSlide(
    index: number,
    refinementPrompt?: string,
  ) {
    if (!onRegenerateSlide || regeneratingSlideIndex !== null) return;
    setRegeneratingSlideIndex(index);
    setImageError(null);
    try {
      await onRegenerateSlide(post.id, index, refinementPrompt);
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={microLabelClass}>
          {t("postImage")}
          {isCarousel && hasImages && (
            <span className="ml-2 text-[10px] text-zinc-500 normal-case tracking-normal tabular-nums">
              {clampedIndex + 1} / {images.length}
            </span>
          )}
        </span>
      </div>

      <div className="relative max-w-60 mx-auto">
        <div
          className={`group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 ${aspectClass} bg-white dark:bg-zinc-900/40 ${
            currentImage && !generatingImage ? "cursor-pointer" : ""
          }`}
          onClick={() => currentImage && !generatingImage && setViewerOpen(true)}
        >
          {currentImage && !generatingImage ? (
            <>
              <Image
                key={currentImage.url}
                src={currentImage.url}
                alt={currentImage.headline}
                fill
                className="object-cover"
                sizes="240px"
                unoptimized
              />
              {/* Hover affordance for expanding to the fullscreen viewer */}
              {regeneratingSlideIndex !== clampedIndex && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 opacity-0 group-hover:opacity-100 transition-all duration-150">
                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-zinc-950/85 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                    <Expand className="w-3 h-3" />
                    {t("imageExpand")}
                  </span>
                </div>
              )}
              {regeneratingSlideIndex === clampedIndex && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  <p className="text-[10px] text-zinc-700 dark:text-zinc-300">
                    {t("regeneratingSlide")}
                  </p>
                </div>
              )}
            </>
          ) : generatingImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 dark:bg-zinc-950/80">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl animate-pulse" />
                <Loader2 className="relative w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center px-3">
                {isCarousel ? t("generatingCarousel") : t("generatingImage")}
              </p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-600">
              <ImageIcon className="w-8 h-8" />
              <p className="text-[10px] px-4 text-center leading-relaxed">
                {t("imageHint")}
              </p>
            </div>
          )}
        </div>

        {hasImages && images.length > 1 && !generatingImage && (
          <>
            <button
              type="button"
              onClick={() =>
                setSlideIndex((i) => (i - 1 + images.length) % images.length)
              }
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-950/80 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-lg"
              aria-label={t("slidePrev")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSlideIndex((i) => (i + 1) % images.length)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-950/80 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-lg"
              aria-label={t("slideNext")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {hasImages && images.length > 1 && !generatingImage && (
        <div className="flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlideIndex(i)}
              title={
                imageFailures.includes(i) ? t("slidesFailedHint") : undefined
              }
              className={`h-1.5 rounded-full transition-all ${
                i === clampedIndex
                  ? "w-6 bg-emerald-400"
                  : imageFailures.includes(i)
                    ? "w-1.5 bg-red-500"
                    : "w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-500"
              }`}
              aria-label={t("slideN", { n: i + 1 })}
            />
          ))}
        </div>
      )}

      {hasImages && currentImage?.headline && (
        <p className="text-center text-[11px] text-zinc-600 dark:text-zinc-400 italic leading-snug px-2">
          &ldquo;{currentImage.headline}&rdquo;
        </p>
      )}

      {imageFailures.length > 0 && (
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-700 dark:text-red-300">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            {t("slidesFailed", { count: imageFailures.length })}{" "}
            {t("slidesFailedHint")}
          </span>
        </div>
      )}

      {hasImages && !generatingImage && (
        <SlideControls
          key={clampedIndex}
          slideNumber={clampedIndex + 1}
          busy={busy}
          regenerating={regeneratingSlideIndex === clampedIndex}
          canRegenerate={Boolean(onRegenerateSlide)}
          canUpload={Boolean(onUploadSlide)}
          onRegenerate={(refinement) =>
            handleRegenerateSlide(clampedIndex, refinement)
          }
          onUpload={(file) => handleUploadSlide(clampedIndex, file)}
        />
      )}

      {referenceSlot}

      <button
        type="button"
        onClick={handleGenerateImage}
        disabled={busy}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {generatingImage ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {isCarousel ? t("generatingCarousel") : t("generatingImage")}
          </>
        ) : (
          <>
            <Wand2 className="w-3.5 h-3.5" />
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
      {imageError && (
        <p className="text-[10px] text-red-600 dark:text-red-400">
          {imageError}
        </p>
      )}

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
