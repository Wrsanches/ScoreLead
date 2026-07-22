"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Expand,
  Heart,
  ImageIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import type { ContentPostType } from "@/lib/content-pillars";
import { getInitials } from "@/lib/admin-utils";
import { imageAspectClass } from "./shared";

type BizInfo = { name: string | null; logo: string | null; location: string | null };

// Business identity for the profile row - cached per id so reopening the sheet
// doesn't refetch. The stored logo is a URL; falls back to initials.
const bizCache = new Map<string, Promise<BizInfo>>();
function fetchBiz(id: string): Promise<BizInfo> {
  let cached = bizCache.get(id);
  if (!cached) {
    cached = fetch(`/api/businesses/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => ({
        name: d?.name ?? null,
        logo: d?.logo ?? null,
        location: d?.location ?? null,
      }))
      .catch(() => ({ name: null, logo: null, location: null }));
    bizCache.set(id, cached);
  }
  return cached;
}

interface InstagramPreviewProps {
  businessId: string;
  images: { url: string; headline: string }[];
  index: number;
  onIndexChange: (index: number) => void;
  caption: string;
  hashtags: string[];
  postType: ContentPostType;
  scheduledFor: string;
  generating: boolean;
  regeneratingIndex: number | null;
  imageFailures: number[];
  onExpand: () => void;
}

export function InstagramPreview({
  businessId,
  images,
  index,
  onIndexChange,
  caption,
  hashtags,
  postType,
  scheduledFor,
  generating,
  regeneratingIndex,
  imageFailures,
  onExpand,
}: InstagramPreviewProps) {
  const t = useTranslations("contentCalendar");
  const [biz, setBiz] = useState<BizInfo | null>(null);
  const [captionOpen, setCaptionOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBiz(businessId).then((b) => {
      if (!cancelled) setBiz(b);
    });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const hasImages = images.length > 0;
  const clamped = Math.min(index, Math.max(images.length - 1, 0));
  const current = hasImages ? images[clamped] : null;
  const aspectClass = imageAspectClass(postType);
  const name = biz?.name?.trim() || "your_business";
  const handle = name.toLowerCase().replace(/\s+/g, "");
  const scheduledLabel = formatSchedule(scheduledFor);

  const captionLong = caption.length > 120;
  const captionText =
    captionOpen || !captionLong ? caption : `${caption.slice(0, 120).trimEnd()}…`;

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
      {/* Profile row */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-rose-400/70 bg-zinc-100 dark:bg-zinc-900">
          {biz?.logo ? (
            <Image
              src={biz.logo}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-zinc-500">
              {getInitials(name)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[13px] font-semibold text-zinc-900 dark:text-white truncate">
            {handle}
          </p>
          {biz?.location && (
            <p className="text-[11px] text-zinc-500 truncate">{biz.location}</p>
          )}
        </div>
        <MoreHorizontal className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0" />
      </div>

      {/* Media */}
      <div
        className={`group relative ${aspectClass} bg-zinc-100 dark:bg-zinc-900 ${
          current && !generating ? "cursor-pointer" : ""
        }`}
        onClick={() => current && !generating && onExpand()}
      >
        {current && !generating ? (
          <>
            <SlideImage url={current.url} alt={current.headline} />
            {regeneratingIndex !== clamped && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 opacity-0 group-hover:opacity-100 transition-all duration-150">
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-zinc-950/85 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                  <Expand className="w-3 h-3" />
                  {t("imageExpand")}
                </span>
              </div>
            )}
            {regeneratingIndex === clamped && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-sm">
                <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
                <p className="text-[10px] text-zinc-700 dark:text-zinc-300">
                  {t("regeneratingSlide")}
                </p>
              </div>
            )}
          </>
        ) : generating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200/70 dark:from-zinc-900 dark:to-zinc-800/70 animate-pulse" />
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl animate-pulse" />
              <Loader2 className="relative w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
            </div>
            <p className="relative text-[11px] text-zinc-600 dark:text-zinc-400 text-center px-3">
              {postType === "carousel"
                ? t("generatingCarousel")
                : t("generatingImage")}
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
            <ImageIcon className="w-8 h-8" />
            <p className="text-[10px] px-6 text-center leading-relaxed">
              {t("previewImageEmpty")}
            </p>
          </div>
        )}

        {hasImages && images.length > 1 && !generating && (
          <>
            <span className="absolute top-2.5 right-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white tabular-nums">
              {clamped + 1}/{images.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((clamped - 1 + images.length) % images.length);
              }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 dark:bg-zinc-950/75 hover:bg-white dark:hover:bg-zinc-900 flex items-center justify-center text-zinc-800 dark:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity shadow"
              aria-label={t("slidePrev")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((clamped + 1) % images.length);
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 dark:bg-zinc-950/75 hover:bg-white dark:hover:bg-zinc-900 flex items-center justify-center text-zinc-800 dark:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity shadow"
              aria-label={t("slideNext")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Carousel dots */}
      {hasImages && images.length > 1 && !generating && (
        <div className="flex items-center justify-center gap-1.5 pt-2.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndexChange(i)}
              title={imageFailures.includes(i) ? t("slidesFailedHint") : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === clamped
                  ? "w-1.5 bg-sky-500"
                  : imageFailures.includes(i)
                    ? "w-1.5 bg-red-500"
                    : "w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-500"
              }`}
              aria-label={t("slideN", { n: i + 1 })}
            />
          ))}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-4 px-3.5 pt-3 pb-1">
        <Heart className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
        <MessageCircle className="w-6 h-6 -scale-x-100 text-zinc-800 dark:text-zinc-200" />
        <Send className="w-[22px] h-[22px] text-zinc-800 dark:text-zinc-200" />
        <Bookmark className="w-6 h-6 ml-auto text-zinc-800 dark:text-zinc-200" />
      </div>

      {/* Caption + hashtags */}
      <div className="px-3.5 pb-3.5 pt-1">
        {caption.trim() || hashtags.length > 0 ? (
          <p className="text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {handle}
            </span>{" "}
            <span className="whitespace-pre-wrap">{captionText}</span>
            {captionLong && (
              <button
                type="button"
                onClick={() => setCaptionOpen((v) => !v)}
                className="ml-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {captionOpen ? t("previewLess") : t("previewMore")}
              </button>
            )}
            {hashtags.length > 0 && (
              <span className="text-sky-600 dark:text-sky-400">
                {" "}
                {hashtags.map((tag) => `#${tag}`).join(" ")}
              </span>
            )}
          </p>
        ) : (
          <p className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">
            {t("previewCaptionEmpty")}
          </p>
        )}
        {scheduledLabel && (
          <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
            {t("previewScheduledFor", { date: scheduledLabel })}
          </p>
        )}
      </div>
    </div>
  );
}

function formatSchedule(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * A generated image with a loading shimmer and automatic retries. Right after
 * generation the object can briefly 404 before S3/CDN serves it; retrying with
 * a cache-busting query recovers without a manual page refresh.
 */
function SlideImage({ url, alt }: { url: string; alt: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus("loading");
    setAttempt(0);
  }, [url]);

  useEffect(() => {
    if (status !== "error" || attempt >= 4) return;
    const timer = setTimeout(
      () => {
        setAttempt((a) => a + 1);
        setStatus("loading");
      },
      600 * (attempt + 1),
    );
    return () => clearTimeout(timer);
  }, [status, attempt]);

  const src =
    attempt > 0 ? `${url}${url.includes("?") ? "&" : "?"}r=${attempt}` : url;

  return (
    <>
      <Image
        key={src}
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-200 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
        sizes="384px"
        unoptimized
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
      {status !== "loaded" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 animate-pulse">
          <ImageIcon className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
        </div>
      )}
    </>
  );
}
