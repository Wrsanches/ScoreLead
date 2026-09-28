"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import styles from "./content-showcase.module.css";

const samples = ["idea", "tips", "details", "story", "month"] as const;
type Sample = (typeof samples)[number];

const brands: Record<Sample, { name: string; handle: string; logo: string }> = {
  idea: {
    name: "Vora Studio",
    handle: "vora.studio",
    logo: "/images/showcase/vora-studio.webp",
  },
  tips: {
    name: "Lume Social",
    handle: "lume.social",
    logo: "/images/showcase/lume-social.webp",
  },
  details: {
    name: "Mora Casa",
    handle: "mora.casa",
    logo: "/images/showcase/mora-casa.webp",
  },
  story: {
    name: "Nova Forma",
    handle: "nova.forma",
    logo: "/images/showcase/nova-forma.webp",
  },
  month: {
    name: "Dia Papel",
    handle: "dia.papel",
    logo: "/images/showcase/dia-papel.webp",
  },
};

function SampleLogo({ sample }: { sample: Sample }) {
  return (
    <Image
      src={brands[sample].logo}
      width={24}
      height={24}
      alt=""
      className={styles.logo}
      unoptimized
    />
  );
}

/** Illustrative posts, separate from the user's actual calendar and generation progress. */
export function ContentShowcase() {
  const t = useTranslations("contentCalendar.showcase");

  return (
    <div className={styles.showcase} aria-hidden="true">
      <div className={styles.viewport} aria-hidden="true">
        <div className={styles.track}>
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
    </div>
  );
}
