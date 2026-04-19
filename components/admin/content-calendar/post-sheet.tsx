"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Square,
  Images,
  Film,
  BookOpen,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  Wand2,
  Download,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  Expand,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { TagsInput } from "@/components/admin/tags-input";
import {
  PILLARS,
  POST_TYPES,
  getPillar,
  type ContentPillar,
  type ContentPostType,
} from "@/lib/content-pillars";
import type { ContentPostRow } from "./types";

interface PostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: ContentPostRow | null;
  draftDate: Date | null;
  onSave: (values: PostFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onGenerateImage?: (postId: string) => Promise<{ failureIndexes: number[] }>;
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
}

export interface PostFormValues {
  scheduledFor: string;
  postType: ContentPostType;
  pillar: ContentPillar | null;
  caption: string;
  hashtags: string[];
  visualIdea: string;
  callToAction: string;
  status: "draft" | "approved";
}

const POST_TYPE_ICON: Record<ContentPostType, typeof Square> = {
  single: Square,
  carousel: Images,
  reel: Film,
  story: BookOpen,
};

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalInputValue(v: string): string {
  const d = new Date(v);
  return d.toISOString();
}

export function PostSheet({
  open,
  onOpenChange,
  post,
  draftDate,
  onSave,
  onDelete,
  onGenerateImage,
  onRegenerateSlide,
  onUploadSlide,
}: PostSheetProps) {
  const t = useTranslations("contentCalendar");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [regeneratingSlideIndex, setRegeneratingSlideIndex] = useState<
    number | null
  >(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFailures, setImageFailures] = useState<number[]>([]);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [refinementOpen, setRefinementOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [values, setValues] = useState<PostFormValues>(() => blank(draftDate));

  useEffect(() => {
    setImageError(null);
    setImageFailures([]);
    setRefinementPrompt("");
    setRefinementOpen(false);
    if (post) {
      setValues({
        scheduledFor: post.scheduledFor,
        postType: post.postType,
        pillar: post.pillar,
        caption: post.caption,
        hashtags: post.hashtags ?? [],
        visualIdea: post.visualIdea ?? "",
        callToAction: post.callToAction ?? "",
        status: post.status,
      });
    } else {
      setValues(blank(draftDate));
    }
    // Only reset form when switching posts or opening fresh, so live parent
    // updates (like a newly generated image) don't clobber in-flight edits.
  }, [post?.id, draftDate, open]);

  const hookLine = values.caption.split("\n")[0] ?? "";
  const hookLen = hookLine.length;
  const hookGood = hookLen > 0 && hookLen <= 80;
  const pillarMeta = getPillar(values.pillar);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || !onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleGenerateImage() {
    if (!post || !onGenerateImage || generatingImage) return;
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

  async function handleRegenerateSlide(index: number) {
    if (!post || !onRegenerateSlide || regeneratingSlideIndex !== null) return;
    setRegeneratingSlideIndex(index);
    setImageError(null);
    try {
      await onRegenerateSlide(
        post.id,
        index,
        refinementPrompt.trim() || undefined,
      );
      setRefinementPrompt("");
      setRefinementOpen(false);
      setImageFailures((prev) => prev.filter((i) => i !== index));
    } catch {
      setImageError(t("imageFailed"));
    } finally {
      setRegeneratingSlideIndex(null);
    }
  }

  async function handleUploadSlide(index: number, file: File) {
    if (!post || !onUploadSlide) return;
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

  const isNew = !post;
  const images = post?.images ?? [];
  const hasImages = images.length > 0;
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    setSlideIndex(0);
  }, [post?.id, images.length]);
  const clampedIndex = Math.min(slideIndex, Math.max(images.length - 1, 0));
  const currentImage = hasImages ? images[clampedIndex] : null;
  const imageAspect =
    values.postType === "reel" || values.postType === "story"
      ? "aspect-[9/16]"
      : "aspect-[4/5]";
  const isCarousel = values.postType === "carousel";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-w-lg! w-full bg-zinc-950 border-zinc-800 text-zinc-200 p-0 flex flex-col"
      >
        <SheetHeader className="border-b border-zinc-800 px-5 py-4">
          <SheetTitle className="text-white flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {isNew ? t("newPost") : t("editPost")}
          </SheetTitle>
          <SheetDescription className="text-zinc-500 text-xs">
            {t("subtitle")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Image preview + generator */}
          {!isNew && onGenerateImage && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                  {t("postImage")}
                  {isCarousel && hasImages && (
                    <span className="ml-2 text-[10px] text-zinc-500 normal-case tracking-normal">
                      {clampedIndex + 1} / {images.length}
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  {currentImage && !generatingImage && (
                    <button
                      type="button"
                      onClick={() => setViewerOpen(true)}
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      <Expand className="w-3 h-3" />
                      View
                    </button>
                  )}
                  {currentImage && !generatingImage && (
                    <a
                      href={currentImage.url}
                      download
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      {t("imageDownload")}
                    </a>
                  )}
                </div>
              </div>
              <div className="relative max-w-60 mx-auto">
                <div
                  className={`relative rounded-2xl overflow-hidden border border-zinc-800 ${imageAspect} bg-zinc-900/40 cursor-pointer`}
                  onClick={() =>
                    currentImage && !generatingImage && setViewerOpen(true)
                  }
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
                      {regeneratingSlideIndex === clampedIndex && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/70 backdrop-blur-sm">
                          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                          <p className="text-[10px] text-zinc-300">
                            {t("regeneratingSlide")}
                          </p>
                        </div>
                      )}
                    </>
                  ) : generatingImage ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl animate-pulse" />
                        <Loader2 className="relative w-6 h-6 text-emerald-400 animate-spin" />
                      </div>
                      <p className="text-[11px] text-zinc-400 text-center px-3">
                        {isCarousel
                          ? t("generatingCarousel")
                          : t("generatingImage")}
                      </p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
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
                        setSlideIndex(
                          (i) => (i - 1 + images.length) % images.length,
                        )
                      }
                      className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-lg"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex((i) => (i + 1) % images.length)
                      }
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-lg"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {hasImages && images.length > 1 && !generatingImage && (
                <div className="flex items-center justify-center gap-1.5 mt-2.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlideIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === clampedIndex
                          ? "w-6 bg-emerald-400"
                          : imageFailures.includes(i)
                            ? "w-1.5 bg-red-500"
                            : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}

              {hasImages && currentImage?.headline && (
                <p className="mt-2 text-center text-[11px] text-zinc-400 italic leading-snug px-2">
                  &ldquo;{currentImage.headline}&rdquo;
                </p>
              )}

              {imageFailures.length > 0 && (
                <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-300">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>
                    {t("slidesFailed", { count: imageFailures.length })}{" "}
                    {t("slidesFailedHint")}
                  </span>
                </div>
              )}

              {/* Per-slide controls (only show when we have at least one image) */}
              {hasImages && !generatingImage && (
                <div className="mt-3 space-y-2">
                  {refinementOpen ? (
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
                        {t("refineSlideLabel", { n: clampedIndex + 1 })}
                      </label>
                      <textarea
                        value={refinementPrompt}
                        onChange={(e) =>
                          setRefinementPrompt(e.target.value.slice(0, 500))
                        }
                        placeholder={t("refinePlaceholder")}
                        rows={3}
                        className="w-full px-2.5 py-2 bg-zinc-950/60 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 resize-none"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleRegenerateSlide(clampedIndex)}
                          disabled={
                            regeneratingSlideIndex !== null ||
                            !refinementPrompt.trim()
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {regeneratingSlideIndex === clampedIndex ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3" />
                          )}
                          {t("applyRefinement")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRefinementOpen(false);
                            setRefinementPrompt("");
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRegenerateSlide(clampedIndex)}
                        disabled={
                          regeneratingSlideIndex !== null || !onRegenerateSlide
                        }
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 text-zinc-300 text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {regeneratingSlideIndex === clampedIndex ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        {t("regenerateSlide")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefinementOpen(true)}
                        disabled={
                          regeneratingSlideIndex !== null || !onRegenerateSlide
                        }
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-3 h-3" />
                        {t("refineSlide")}
                      </button>
                      <button
                        type="button"
                        onClick={() => uploadInputRef.current?.click()}
                        disabled={
                          regeneratingSlideIndex !== null || !onUploadSlide
                        }
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 text-zinc-300 text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-3 h-3" />
                        {t("uploadSlide")}
                      </button>
                      <input
                        ref={uploadInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadSlide(clampedIndex, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={generatingImage || regeneratingSlideIndex !== null}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isCarousel
                      ? t("generatingCarousel")
                      : t("generatingImage")}
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
                <p className="mt-1.5 text-[10px] text-red-400">{imageError}</p>
              )}
            </div>
          )}

          {/* Post type */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
              {t("postTypeSingle")} / {t("postTypeCarousel")} /{" "}
              {t("postTypeReel")}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {POST_TYPES.map((pt) => {
                const Icon = POST_TYPE_ICON[pt.key];
                const active = values.postType === pt.key;
                return (
                  <button
                    key={pt.key}
                    type="button"
                    onClick={() =>
                      setValues((v) => ({ ...v, postType: pt.key }))
                    }
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-150 ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium">
                      {t(
                        pt.key === "single"
                          ? "postTypeSingle"
                          : pt.key === "carousel"
                            ? "postTypeCarousel"
                            : pt.key === "reel"
                              ? "postTypeReel"
                              : "postTypeStory",
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + time + pillar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                Date
              </label>
              <input
                type="datetime-local"
                value={toLocalInputValue(values.scheduledFor)}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    scheduledFor: fromLocalInputValue(e.target.value),
                  }))
                }
                className="w-full px-3 py-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all scheme-dark"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
                {t("pillarLabel")}
              </label>
              <div className="grid grid-cols-5 gap-1">
                {PILLARS.map((p) => {
                  const active = values.pillar === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() =>
                        setValues((v) => ({
                          ...v,
                          pillar: v.pillar === p.key ? null : p.key,
                        }))
                      }
                      title={p.label}
                      className={`h-10 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                        active
                          ? `${p.bgClass} border-current ${p.textClass} ring-1 ${p.ringClass}`
                          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${p.dotClass}`} />
                    </button>
                  );
                })}
              </div>
              {pillarMeta && (
                <p className={`text-[10px] mt-1 ${pillarMeta.textClass}`}>
                  {t(
                    pillarMeta.key === "educate"
                      ? "pillarEducate"
                      : pillarMeta.key === "showcase"
                        ? "pillarShowcase"
                        : pillarMeta.key === "story"
                          ? "pillarStory"
                          : pillarMeta.key === "proof"
                            ? "pillarProof"
                            : "pillarEngagement",
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                {t("caption")}
              </label>
              <span
                className={`text-[10px] tabular-nums ${
                  values.caption.length > 2000
                    ? "text-amber-400"
                    : "text-zinc-600"
                }`}
              >
                {t("charactersLeft", { n: values.caption.length })}
              </span>
            </div>
            <div className="relative">
              <textarea
                value={values.caption}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    caption: e.target.value.slice(0, 2200),
                  }))
                }
                rows={8}
                className="w-full px-3.5 py-3 bg-zinc-900/40 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                placeholder="Hook that stops the scroll...\n\nYour value or story\n\nSave this if it helped"
              />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
              {hookGood ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">
                    {t("hookGood")} ({hookLen}/80)
                  </span>
                </>
              ) : hookLen > 80 ? (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">
                    {t("hookTooLong")} ({hookLen}/80)
                  </span>
                </>
              ) : (
                <span className="text-zinc-600">{t("captionHint")}</span>
              )}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
              {t("hashtags")}
            </label>
            <TagsInput
              asArray
              arrayValue={values.hashtags}
              onArrayChange={(next) =>
                setValues((v) => ({ ...v, hashtags: next }))
              }
              value=""
              onChange={() => {}}
              placeholder="photography  tuesdaytip  saopaulo"
              maxTags={15}
              stripHashPrefix
              inputClassName="w-full px-3.5 py-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              chipClassName="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 text-[11px] font-medium"
              chipRemoveClassName="text-zinc-500 hover:text-zinc-200 transition-colors"
            />
            <p className="text-[10px] text-zinc-600 mt-1.5">
              {t("hashtagsHint")}
            </p>
          </div>

          {/* Visual idea */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
              {t("visualIdea")}
            </label>
            <textarea
              value={values.visualIdea}
              onChange={(e) =>
                setValues((v) => ({ ...v, visualIdea: e.target.value }))
              }
              rows={4}
              className="w-full px-3.5 py-3 bg-zinc-900/40 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              placeholder={t("visualIdeaHint")}
            />
          </div>

          {/* CTA */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">
              {t("callToAction")}
            </label>
            <input
              type="text"
              value={values.callToAction}
              onChange={(e) =>
                setValues((v) => ({ ...v, callToAction: e.target.value }))
              }
              placeholder={t("callToActionPlaceholder")}
              className="w-full px-3.5 py-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Status toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setValues((v) => ({
                  ...v,
                  status: v.status === "approved" ? "draft" : "approved",
                }))
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                values.status === "approved"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300"
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
        </div>

        <div className="border-t border-zinc-800 px-5 py-3 flex items-center gap-2">
          {!isNew && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {t("deletePost")}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {t("save")}
          </button>
        </div>
      </SheetContent>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="p-0 bg-zinc-950 border-zinc-800 max-w-3xl">
          <VisuallyHidden.Root>
            <DialogTitle>
              {currentImage?.headline || t("postImage")}
            </DialogTitle>
            <DialogDescription>{t("imageHint")}</DialogDescription>
          </VisuallyHidden.Root>
          {currentImage && (
            <div className="flex flex-col">
              <div
                className={`relative w-full ${imageAspect} max-h-[80vh] bg-black flex items-center justify-center`}
              >
                <Image
                  src={currentImage.url}
                  alt={currentImage.headline}
                  fill
                  className="object-contain"
                  sizes="(min-width: 1024px) 768px, 100vw"
                  unoptimized
                />
                {hasImages && images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex(
                          (i) => (i - 1 + images.length) % images.length,
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex((i) => (i + 1) % images.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewerOpen(false)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-3 flex items-center justify-between border-t border-zinc-800">
                <p className="text-sm text-zinc-300 italic truncate max-w-[60%]">
                  &ldquo;{currentImage.headline}&rdquo;
                </p>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {images.length > 1 && (
                    <span className="tabular-nums">
                      {clampedIndex + 1} / {images.length}
                    </span>
                  )}
                  <a
                    href={currentImage.url}
                    download
                    className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    {t("imageDownload")}
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

function blank(draftDate: Date | null): PostFormValues {
  const base = draftDate ?? new Date();
  const d = new Date(base);
  d.setHours(11, 0, 0, 0);
  return {
    scheduledFor: d.toISOString(),
    postType: "reel",
    pillar: "educate",
    caption: "",
    hashtags: [],
    visualIdea: "",
    callToAction: "",
    status: "draft",
  };
}
