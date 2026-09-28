"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ScoreLeadLogo } from "./scorelead-logo";
import styles from "./reporting-visuals.module.css";

type Example = "traffic" | "search" | "pages";

const chartValues = {
  traffic: [4820, 2140, 1390],
  search: [12400, 8600, 6200],
  pages: [-18, -9, -6],
};
const sessionChanges = [-12, -5, 3];

function FlowNode({
  src,
  name,
  central = false,
}: {
  src: string;
  name: string;
  central?: boolean;
}) {
  return (
    <div className={styles.node}>
      <span className={central ? styles.hub : styles.iconTile}>
        {central ? (
          <ScoreLeadLogo className="size-7 text-white" />
        ) : (
          <Image
            src={src}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="size-7 object-contain"
          />
        )}
      </span>
      <span className="mt-2 text-center text-[10px] leading-tight text-zinc-300">
        {name}
      </span>
    </div>
  );
}

export function ReportingFlow({ selected }: { selected: Example }) {
  const t = useTranslations("reportingSection");
  return (
    <figure className="mt-8 border-t border-white/10 pt-6">
      <figcaption className="text-xs text-zinc-400">
        {t("visuals.connection")}
      </figcaption>
      <div className={styles.flow} aria-hidden="true">
        <svg
          viewBox="0 0 300 160"
          preserveAspectRatio="none"
          className={styles.wires}
          fill="none"
        >
          <path
            d="M50 32H85C110 32 110 72 135 72H150"
            className={selected !== "search" ? styles.activeWire : styles.wire}
          />
          <path
            d="M50 112H85C110 112 110 72 135 72H150"
            className={selected !== "traffic" ? styles.activeWire : styles.wire}
          />
          <path
            d="M150 72H165C190 72 190 32 215 32H250M165 72C190 72 190 112 215 112H250"
            className={styles.wire}
          />
          <path d="m216 29 4 3-4 3m0 74 4 3-4 3" className={styles.wire} />
        </svg>
        <div className={styles.sourceNodes}>
          <FlowNode
            src="/images/integrations/google-analytics.svg"
            name="Google Analytics"
          />
          <FlowNode
            src="/images/integrations/google-search-console.png"
            name="Search Console"
          />
        </div>
        <div className={styles.centerNode}>
          <FlowNode src="/scorelead-logo.svg" name="ScoreLead MCP" central />
        </div>
        <div className={styles.sourceNodes}>
          <FlowNode src="/images/integrations/codex.png" name="Codex" />
          <FlowNode
            src="/images/integrations/claude-code.png"
            name="Claude Code"
          />
        </div>
      </div>
      <p className="sr-only">{t("visuals.connectionDescription")}</p>
    </figure>
  );
}

export function ReportingChart({
  example,
  active,
}: {
  example: Example;
  active: boolean;
}) {
  const t = useTranslations("reportingSection");
  const values = chartValues[example];
  const maximum = Math.max(...values);

  return (
    <div
      className={`mt-6 rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 ${active ? styles.reveal : ""}`}
      aria-hidden="true"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span>{t(`visuals.${example}`)}</span>
        {example === "pages" ? (
          <span className="flex gap-3">
            <span className="inline-flex items-center gap-1.5">
              <i className="size-1.5 rounded-full bg-amber-300" />
              {t("examples.pages.metric")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="size-1.5 rounded-full bg-emerald-400" />
              {t("examples.pages.context")}
            </span>
          </span>
        ) : (
          <span>{t(`examples.${example}.metric`)}</span>
        )}
      </div>
      <div className="space-y-5">
        {values.map((value, row) => (
          <div key={row}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="min-w-0 break-words text-xs text-zinc-200">
                {t(`examples.${example}.rows.${row}.name`)}
              </span>
              <span className="flex shrink-0 items-baseline gap-2 font-mono text-xs tabular-nums">
                <span
                  className={
                    example === "pages" ? "text-amber-300" : "text-zinc-100"
                  }
                >
                  {t(`examples.${example}.rows.${row}.value`)}
                </span>
                <span
                  className={
                    example === "pages"
                      ? "text-emerald-400"
                      : "text-[10px] text-zinc-400"
                  }
                >
                  {example !== "pages" &&
                    `${t(`examples.${example}.context`)} `}
                  {t(`examples.${example}.rows.${row}.detail`)}
                </span>
              </span>
            </div>
            {example === "pages" ? (
              <svg
                viewBox="0 0 320 22"
                className="h-[22px] w-full overflow-visible"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M0 11H320"
                  stroke="currentColor"
                  className="text-white/5"
                />
                <path
                  d="M160 0V22"
                  stroke="currentColor"
                  className="text-zinc-500"
                />
                <rect
                  x={160 + value * 8}
                  y="2"
                  width={Math.abs(value) * 8}
                  height="6"
                  rx="2"
                  fill="currentColor"
                  className={`text-amber-300 ${styles.bar}`}
                />
                <rect
                  x={160 + Math.min(sessionChanges[row], 0) * 8}
                  y="14"
                  width={Math.abs(sessionChanges[row]) * 8}
                  height="6"
                  rx="2"
                  fill="currentColor"
                  className={`text-emerald-400 ${styles.bar}`}
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 320 12"
                className="h-3 w-full"
                preserveAspectRatio="none"
                fill="none"
              >
                <rect
                  width="320"
                  height="12"
                  rx="3"
                  fill="currentColor"
                  className="text-white/5"
                />
                <rect
                  width={(value / maximum) * 320}
                  height="12"
                  rx="3"
                  fill="currentColor"
                  className={`${example === "traffic" ? "text-emerald-400" : "text-sky-400"} ${styles.bar}`}
                  opacity={1 - row * 0.2}
                />
              </svg>
            )}
          </div>
        ))}
      </div>
      {example === "pages" && (
        <div className="mt-3 flex justify-between font-mono text-[10px] text-zinc-500">
          <span>−20%</span>
          <span>0%</span>
          <span>+20%</span>
        </div>
      )}
    </div>
  );
}
