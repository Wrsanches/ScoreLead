"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import { downloadSlide } from "./shared";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Saved post id; enables the same-origin download link. */
  postId?: string | null;
  images: { url: string; headline: string }[];
  index: number;
  onIndexChange: (index: number) => void;
  aspectClass: string;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  postId,
  images,
  index,
  onIndexChange,
  aspectClass,
}: ImageViewerDialogProps) {
  const t = useTranslations("contentCalendar");
  const currentImage = images[index] ?? null;
  const [downloading, setDownloading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-auto max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:max-w-[calc(100vw-2rem)]"
      >
        <VisuallyHidden.Root>
          <DialogTitle>{currentImage?.headline || t("postImage")}</DialogTitle>
          <DialogDescription>{t("imageHint")}</DialogDescription>
        </VisuallyHidden.Root>
        {currentImage && (
          <div className="flex w-fit max-w-full flex-col">
            <div
              className={`relative ${aspectClass} h-[min(78vh,48rem)] max-w-[calc(100vw-2rem)] bg-black`}
            >
              <Image
                src={currentImage.url}
                alt={currentImage.headline}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 768px, 100vw"
                unoptimized
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onIndexChange((index - 1 + images.length) % images.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/25 hover:bg-zinc-50 dark:hover:bg-white/[0.09] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200"
                    aria-label={t("slidePrev")}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onIndexChange((index + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-black/25 hover:bg-zinc-50 dark:hover:bg-white/[0.09] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200"
                    aria-label={t("slideNext")}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/25 hover:bg-zinc-50 dark:hover:bg-white/[0.09] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200"
                aria-label={t("close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-3 flex items-center justify-between border-t border-zinc-200 dark:border-white/[0.08]">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic truncate max-w-[60%]">
                &ldquo;{currentImage.headline}&rdquo;
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                {images.length > 1 && (
                  <span className="tabular-nums">
                    {index + 1} / {images.length}
                  </span>
                )}
                {postId ? (
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={async () => {
                      setDownloading(true);
                      try {
                        await downloadSlide(postId, index);
                      } catch {
                        // Nothing to recover; the button simply re-enables.
                      } finally {
                        setDownloading(false);
                      }
                    }}
                    className="glass-pill inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-zinc-700 transition-[filter] hover:brightness-110 disabled:opacity-60 dark:text-zinc-300"
                  >
                    {downloading ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="size-3.5" aria-hidden="true" />
                    )}
                    {t("imageDownload")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
