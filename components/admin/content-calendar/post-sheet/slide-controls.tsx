"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, Sparkles, Upload, Wand2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fieldClass } from "./shared";

interface SlideControlsProps {
  slideNumber: number;
  busy: boolean;
  regenerating: boolean;
  canRegenerate: boolean;
  canUpload: boolean;
  onRegenerate: (refinementPrompt?: string, referenceFile?: File) => void;
  onUpload: (file: File) => void;
}

// Mounted with key={slideIndex} by the image pane so the refinement draft
// never leaks from one slide to another.
export function SlideControls({
  slideNumber,
  busy,
  regenerating,
  canRegenerate,
  canUpload,
  onRegenerate,
  onUpload,
}: SlideControlsProps) {
  const t = useTranslations("contentCalendar");
  const [refineOpen, setRefineOpen] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const referenceInputRef = useRef<HTMLInputElement | null>(null);

  function applyRefinement() {
    const prompt = refinementPrompt.trim();
    if (!prompt && !referenceFile) return;
    setRefineOpen(false);
    setRefinementPrompt("");
    onRegenerate(prompt || undefined, referenceFile ?? undefined);
    setReferenceFile(null);
  }

  const secondaryButtonClass =
    "flex items-center justify-center gap-1 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <button
        type="button"
        onClick={() => onRegenerate()}
        disabled={busy || !canRegenerate}
        className={secondaryButtonClass}
      >
        {regenerating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Wand2 className="w-3 h-3" />
        )}
        {t("regenerateSlide")}
      </button>

      <Popover open={refineOpen} onOpenChange={setRefineOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={busy || !canRegenerate}
            className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3 h-3" />
            {t("refineSlide")}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="w-80 p-3 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl"
        >
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
            {t("refineSlideLabel", { n: slideNumber })}
          </label>
          <textarea
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value.slice(0, 500))}
            placeholder={t("refinePlaceholder")}
            rows={3}
            autoFocus
            className={`${fieldClass} px-2.5 py-2 rounded-lg text-xs resize-none`}
          />
          <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                  {t("refineReference")}
                </p>
                <p className="text-[9px] leading-relaxed text-zinc-500 dark:text-zinc-600">
                  {t("refineReferenceHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => referenceInputRef.current?.click()}
                disabled={busy}
                className="shrink-0 inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-40"
              >
                <ImagePlus className="h-3 w-3" />
                {referenceFile ? t("replaceReference") : t("attachReference")}
              </button>
            </div>
            {referenceFile && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-white dark:bg-zinc-950 px-2 py-1.5 ring-1 ring-zinc-200 dark:ring-zinc-800">
                <ImagePlus className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-700 dark:text-zinc-300">
                  {referenceFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setReferenceFile(null)}
                  className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label={t("removeReference")}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <input
              ref={referenceInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                setReferenceFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={applyRefinement}
              disabled={busy || (!refinementPrompt.trim() && !referenceFile)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-3 h-3" />
              {t("applyRefinement")}
            </button>
            <button
              type="button"
              onClick={() => {
                setRefineOpen(false);
                setRefinementPrompt("");
                setReferenceFile(null);
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => uploadInputRef.current?.click()}
        disabled={busy || !canUpload}
        className={secondaryButtonClass}
        title={t("uploadSlideHint")}
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
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
