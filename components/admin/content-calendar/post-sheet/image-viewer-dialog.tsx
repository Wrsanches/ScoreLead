"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
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
  images: { url: string; headline: string }[];
  index: number;
  onIndexChange: (index: number) => void;
  aspectClass: string;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
  aspectClass,
}: ImageViewerDialogProps) {
  const t = useTranslations("contentCalendar");
  const currentImage = images[index] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 max-w-3xl">
        <VisuallyHidden.Root>
          <DialogTitle>{currentImage?.headline || t("postImage")}</DialogTitle>
          <DialogDescription>{t("imageHint")}</DialogDescription>
        </VisuallyHidden.Root>
        {currentImage && (
          <div className="flex flex-col">
            <div
              className={`relative w-full ${aspectClass} max-h-[80vh] bg-black flex items-center justify-center`}
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-950/80 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200"
                    aria-label={t("slidePrev")}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onIndexChange((index + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-950/80 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200"
                    aria-label={t("slideNext")}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-950/80 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200"
                aria-label={t("close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic truncate max-w-[60%]">
                &ldquo;{currentImage.headline}&rdquo;
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                {images.length > 1 && (
                  <span className="tabular-nums">
                    {index + 1} / {images.length}
                  </span>
                )}
                <a
                  href={currentImage.url}
                  download
                  className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
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
  );
}
