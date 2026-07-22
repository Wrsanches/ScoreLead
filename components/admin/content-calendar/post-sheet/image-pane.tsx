"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, Wand2 } from "lucide-react";
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
