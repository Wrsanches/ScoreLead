"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BookOpen, Layers, PenLine, CalendarDays, Check } from "lucide-react";
import { AiOrb, type OrbState } from "@/components/ai-orb";

interface CalendarEmptyStateProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

/**
 * Usage:
 *   <CalendarEmptyState
 *     onGenerate={handleGenerate}
 *     isGenerating={mutation.isPending}
 *   />
 */
type GenStatus = "reading" | "pillars" | "drafting" | "placing";

export function CalendarEmptyState({
  onGenerate,
  isGenerating,
}: CalendarEmptyStateProps) {
  const t = useTranslations("contentCalendar");

  const orbState: OrbState = isGenerating ? "processing" : "idle";

  // Entrance staggering - orb first, then supporting elements fade up.
  const fadeUp = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
  };

  // Time-based status advancement mirrors the onboarding processing flow.
  // The single OpenAI call behind this is actually atomic, so we simulate
  // phases to give the user a sense of what's happening.
  const [genStatus, setGenStatus] = useState<GenStatus>("reading");
  useEffect(() => {
    if (!isGenerating) {
      setGenStatus("reading");
      return;
    }
    const t1 = setTimeout(() => setGenStatus("pillars"), 3500);
    const t2 = setTimeout(() => setGenStatus("drafting"), 9000);
    const t3 = setTimeout(() => setGenStatus("placing"), 18000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isGenerating]);

  const genSteps: { key: GenStatus; icon: typeof BookOpen; label: string }[] = [
    { key: "reading", icon: BookOpen, label: t("genStepReading") },
    { key: "pillars", icon: Layers, label: t("genStepPillars") },
    { key: "drafting", icon: PenLine, label: t("genStepDrafting") },
    { key: "placing", icon: CalendarDays, label: t("genStepPlacing") },
  ];
  const currentStepIndex = genSteps.findIndex((s) => s.key === genStatus);

  return (
    <div className="relative rounded-3xl border border-zinc-800/70 bg-zinc-950/60 overflow-hidden">
      {/* Soft brand radial behind the orb */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] w-160 h-160 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.14) 0%, rgba(16,185,129,0.05) 30%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />

      {/* Subtle concentric orbit rings - replaces the literal 7x5 grid */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] pointer-events-none"
      >
        {[260, 380, 520].map((size, i) => (
          <div
            key={size}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-800/40"
            style={{
              width: size,
              height: size,
              opacity: 0.5 - i * 0.12,
            }}
          />
        ))}
      </div>

      {/* Top-right faint noise-less corner accent */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-14 sm:pt-20 sm:pb-16">
        {/* Orb hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative mb-8"
        >
          <AiOrb state={orbState} size="lg" />
        </motion.div>

        {/* Title + body */}
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-2xl sm:text-3xl font-semibold text-white tracking-tight max-w-md"
        >
          {isGenerating ? t("genTitle") : t("emptyTitle")}
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-zinc-400 mt-3 max-w-md leading-relaxed"
        >
          {isGenerating ? t("genBody") : t("emptyBody")}
        </motion.p>

        {/* Status checklist during generation (mirrors the onboarding processing step). */}
        {isGenerating ? (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="w-full max-w-sm space-y-2 mt-8"
          >
            {genSteps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                    isActive
                      ? "bg-emerald-500/8 border border-emerald-500/20"
                      : isDone
                        ? "bg-zinc-800/20 border border-zinc-800/40"
                        : "border border-transparent opacity-30"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${
                      isActive
                        ? "bg-emerald-500/15"
                        : isDone
                          ? "bg-zinc-800/50"
                          : "bg-zinc-800/30"
                    }`}
                  >
                    {isDone ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </motion.div>
                    ) : (
                      <Icon
                        className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-zinc-600"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm text-left ${
                      isActive
                        ? "text-zinc-200"
                        : isDone
                          ? "text-zinc-500"
                          : "text-zinc-600"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.button
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.35 }}
            type="button"
            onClick={onGenerate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm rounded-xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.8)] transition-colors"
          >
            {t("generateWithAi")}
          </motion.button>
        )}
      </div>
    </div>
  );
}
