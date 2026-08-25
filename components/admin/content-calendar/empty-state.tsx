"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BookOpen, Layers, PenLine, CalendarDays, Check } from "lucide-react";
import { AiOrb, type OrbState } from "@/components/ai-orb";

interface CalendarEmptyStateProps {
  onGenerate: () => void;
  isGenerating: boolean;
  readOnly?: boolean;
  /** Tier does not include the content calendar - offer the upgrade instead. */
  locked?: boolean;
  onUpgrade?: () => void;
  /**
   * When the server-side run actually started, ISO. Generation survives leaving
   * the page, so on return the phases must reflect elapsed time rather than
   * restarting from the first step.
   */
  startedAt?: string | null;
}

/**
 * Usage:
 *   <CalendarEmptyState
 *     onGenerate={handleGenerate}
 *     isGenerating={mutation.isPending}
 *   />
 */
type GenStatus = "reading" | "pillars" | "drafting" | "placing";

/** Elapsed-seconds thresholds at which each phase begins. */
const PHASE_AT: { key: GenStatus; afterSeconds: number }[] = [
  { key: "placing", afterSeconds: 18 },
  { key: "drafting", afterSeconds: 9 },
  { key: "pillars", afterSeconds: 3.5 },
  { key: "reading", afterSeconds: 0 },
];

function phaseForElapsed(seconds: number): GenStatus {
  return (PHASE_AT.find((p) => seconds >= p.afterSeconds) ?? PHASE_AT.at(-1)!).key;
}

export function CalendarEmptyState({
  onGenerate,
  isGenerating,
  readOnly = false,
  locked = false,
  onUpgrade,
  startedAt = null,
}: CalendarEmptyStateProps) {
  const t = useTranslations("contentCalendar");
  const tb = useTranslations("billing");

  const orbState: OrbState = isGenerating ? "processing" : "idle";

  // Entrance staggering - orb first, then supporting elements fade up.
  const fadeUp = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
  };

  // Time-based status advancement mirrors the onboarding processing flow. The
  // single OpenAI call behind this is atomic, so we simulate phases to give the
  // user a sense of what's happening. Derived from elapsed time (not one-shot
  // timers) so returning to a run in progress lands on the right phase.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      return;
    }
    const since = startedAt ? Date.parse(startedAt) : Date.now();
    const base = Number.isFinite(since) ? since : Date.now();
    const tick = () => setElapsed(Math.max(0, (Date.now() - base) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isGenerating, startedAt]);

  const genStatus = phaseForElapsed(elapsed);
  // Past a minute the phase list stops being informative; reassure instead.
  const takingAWhile = isGenerating && elapsed > 45;

  const genSteps: { key: GenStatus; icon: typeof BookOpen; label: string }[] = [
    { key: "reading", icon: BookOpen, label: t("genStepReading") },
    { key: "pillars", icon: Layers, label: t("genStepPillars") },
    { key: "drafting", icon: PenLine, label: t("genStepDrafting") },
    { key: "placing", icon: CalendarDays, label: t("genStepPlacing") },
  ];
  const currentStepIndex = genSteps.findIndex((s) => s.key === genStatus);

  return (
    <div className="relative rounded-3xl border border-zinc-200 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/60 overflow-hidden">
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
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/60 dark:border-zinc-800/40"
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
          className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight max-w-md"
        >
          {isGenerating
            ? t("genTitle")
            : locked
              ? tb("planName.growth")
              : t("emptyTitle")}
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 max-w-md leading-relaxed"
        >
          {isGenerating
            ? t("genBody")
            : locked
              ? tb("contentCalendarLocked")
              : t("emptyBody")}
        </motion.p>

        {/* Status checklist during generation (mirrors the onboarding processing step). */}
        {isGenerating ? (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="w-full max-w-sm space-y-2 mt-8"
          >
            <p className="pt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
              {takingAWhile ? t("genStillWorking") : t("genSafeToLeave")}
            </p>
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
                        ? "bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-800/40"
                        : "border border-transparent opacity-30"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${
                      isActive
                        ? "bg-emerald-500/15"
                        : isDone
                          ? "bg-zinc-200/50 dark:bg-zinc-800/50"
                          : "bg-zinc-200/30 dark:bg-zinc-800/30"
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
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </motion.div>
                    ) : (
                      <Icon
                        className={`w-3.5 h-3.5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-600"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm text-left ${
                      isActive
                        ? "text-zinc-800 dark:text-zinc-200"
                        : isDone
                          ? "text-zinc-500"
                          : "text-zinc-500 dark:text-zinc-600"
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
        ) : !readOnly ? (
          <motion.button
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.35 }}
            type="button"
            onClick={locked ? onUpgrade : onGenerate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm rounded-xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.8)] transition-colors"
          >
            {locked ? tb("upgradeCta") : t("generateWithAi")}
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}
