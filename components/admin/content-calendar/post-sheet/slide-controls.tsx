"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles, Upload, Wand2 } from "lucide-react";
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
  onRegenerate: (refinementPrompt?: string) => void;
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
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  function applyRefinement() {
    const prompt = refinementPrompt.trim();
    if (!prompt) return;
    setRefineOpen(false);
    setRefinementPrompt("");
    onRegenerate(prompt);
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
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={applyRefinement}
              disabled={busy || !refinementPrompt.trim()}
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
