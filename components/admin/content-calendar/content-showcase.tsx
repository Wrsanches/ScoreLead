"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./content-showcase.module.css";

const samples = ["idea", "tips", "details", "story", "month"] as const;
type Sample = (typeof samples)[number];

const brands: Record<Sample, { name: string; handle: string }> = {
  idea: { name: "Vora Studio", handle: "vora.studio" },
  tips: { name: "Lume Social", handle: "lume.social" },
  details: { name: "Mora Casa", handle: "mora.casa" },
  story: { name: "Nova Forma", handle: "nova.forma" },
  month: { name: "Dia Papel", handle: "dia.papel" },
};

function SampleLogo({ sample }: { sample: Sample }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {sample === "idea" && (
        <path d="m3 5 9 15 9-15h-5l-4 7-4-7H3Z" fill="currentColor" />
      )}
      {sample === "tips" && (
        <>
          <path
            d="M12 3v18M3 12h18M6 6l12 12M6 18 18 6"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </>
      )}
      {sample === "details" && (
        <>
          <path
            d="M5 18V9a7 7 0 0 1 14 0v9H5Z"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M9 18v-7a3 3 0 0 1 6 0v7M3 21h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {sample === "story" && (
        <>
          <path
            d="M4 19V5l16 14V5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </>
      )}
      {sample === "month" && (
        <>
          <path
            d="M5 3h10l4 4v14H5V3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M14 3v5h5M9 12h6M9 16h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

/** Illustrative posts, separate from the user's actual calendar and generation progress. */
export function ContentShowcase() {
  const t = useTranslations("contentCalendar.showcase");
  const [paused, setPaused] = useState(false);

  return (
    <figure className={styles.showcase}>
      <div className={styles.viewport} aria-hidden="true">
        <div className={styles.track} data-paused={paused}>
          {[0, 1].map((copy) => (
            <div className={styles.group} key={copy}>
              {samples.map((sample) => (
                <div
                  className={`${styles.card} ${styles[sample]}`}
                  key={sample}
                >
                  <div className={styles.header}>
                    <span className={styles.avatar}>
                      <SampleLogo sample={sample} />
                    </span>
                    <span>{brands[sample].handle}</span>
                    <MoreHorizontal size={13} className="ml-auto" />
                  </div>
                  <div className={styles.artwork}>
                    <span className={styles.eyebrow}>
                      {t(`${sample}Label`)}
                    </span>
                    <strong className={styles.headline}>{t(sample)}</strong>
                    <div className={styles.art}>
                      {sample === "idea" && (
                        <>
                          <i />
                          <i />
                          <i />
                        </>
                      )}
                      {sample === "tips" && (
                        <span>
                          03<span>↗</span>
                        </span>
                      )}
                      {sample === "details" && (
                        <>
                          <i />
                          <i />
                        </>
                      )}
                      {sample === "story" && <span>“</span>}
                      {sample === "month" &&
                        Array.from({ length: 21 }, (_, index) => (
                          <i key={index} />
                        ))}
                    </div>
                    <span className={styles.signature}>
                      <SampleLogo sample={sample} />
                      {brands[sample].name}
                    </span>
                  </div>
                  <div className={styles.footer}>
                    <Heart size={13} />
                    <MessageCircle size={13} />
                    <Send size={13} />
                    <Bookmark size={13} className="ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="relative flex items-center justify-center gap-3 px-5 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{t("caption")}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`size-8 shrink-0 rounded-full ${styles.playback}`}
          aria-label={paused ? t("play") : t("pause")}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? (
            <Play className="size-3.5" />
          ) : (
            <Pause className="size-3.5" />
          )}
        </Button>
      </figcaption>
    </figure>
  );
}
