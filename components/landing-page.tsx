"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
} from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { motion, MotionConfig } from "framer-motion";

const DashboardPreview = dynamic(
  () =>
    import("./dashboard-preview").then((m) => ({
      default: m.DashboardPreview,
    })),
  { ssr: true },
);
import dashboardStyles from "./hero-dashboard.module.css";
import { Navbar } from "./navbar";
import { FeatureCardsSection } from "./feature-cards-section";
import { AISection } from "./ai-section";
import { PipelineSection } from "./pipeline-section";
import { ContentSection } from "./content-section";
import { ReportingSection } from "./reporting-section";
import { TestimonialsSection } from "./testimonials-section";
import { WaitlistSection } from "./waitlist-section";
import { WaitlistFooter } from "./waitlist-footer";
import { PricingSection } from "./pricing-section";
import { TrackedLink } from "./tracked-link";

// The dashboard preview fades in once per browser session. Client-side
// navigations back to the homepage remount this component, and replaying a
// half-second blank-then-fade read as a flash. Module state survives those
// navigations; a full reload starts fresh, which is when the entrance belongs.
let heroPreviewRevealed = false;

export function LandingPage() {
  const t = useTranslations("hero");
  const [skipPreviewEntrance] = useState(() => heroPreviewRevealed);
  useEffect(() => {
    heroPreviewRevealed = true;
  }, []);
  const tb = useTranslations("billing");
  const [yOffset, setYOffset] = useState(0);
  const rafRef = useRef(0);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const observer = new ResizeObserver(([entry]) => {
      preview.style.setProperty(
        "--preview-scale",
        String(entry.contentRect.width / 1600),
      );
    });
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (
      !window.matchMedia(
        "(min-width: 1280px) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const offset = Math.min(window.scrollY / 300, 1) * -20;
      setYOffset(offset);
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="hero"
        className="marketing-home relative min-h-screen overflow-hidden"
        style={{
          backgroundColor: "#09090B",
          // Ambient light the glass surfaces pick up as the page scrolls.
          backgroundImage: `
            radial-gradient(ellipse 50% 24% at 8% 3%, rgba(16,185,129,0.14), transparent 62%),
            radial-gradient(ellipse 45% 18% at 96% 30%, rgba(6,182,212,0.08), transparent 60%),
            radial-gradient(ellipse 42% 16% at 4% 64%, rgba(99,102,241,0.07), transparent 60%),
            radial-gradient(ellipse 45% 14% at 92% 92%, rgba(16,185,129,0.08), transparent 60%)
          `,
        }}
      >
        <Navbar />

        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -30%)",
            width: "1200px",
            height: "800px",
            background:
              "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 pt-24 sm:pt-28 flex flex-col">
          <div className="w-full flex justify-center px-6 mt-6 sm:mt-16">
            <div className="w-full max-w-4xl">
              <h1 className="text-3xl md:text-5xl lg:text-[56px] font-medium text-white leading-[1.1] text-balance">
                {t("heading")}
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-zinc-300">
                {t("subtitle")}
              </p>
              <div className="mt-5 sm:mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 relative z-20">
                <TrackedLink
                  href="/signup"
                  eventName="signup_start"
                  eventParams={{ placement: "homepage_hero" }}
                  className="press transition-[transform,background-color] ease-[cubic-bezier(0.23,1,0.32,1)] px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-xl hover:bg-zinc-100 text-sm shadow-[0_8px_24px_-12px_rgba(255,255,255,0.5)]"
                >
                  {t("cta")}
                </TrackedLink>
                <a
                  href="#features"
                  className="text-zinc-300 font-medium hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  {t("secondary")}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
              <p className="mt-4 text-xs text-zinc-500">{tb("noCreditCard")}</p>
            </div>
          </div>

          <div
            ref={previewRef}
            aria-hidden="true"
            className={dashboardStyles.stage}
          >
            <div className={dashboardStyles.fade} />
            <div
              className={dashboardStyles.scene}
              style={{ "--preview-y": `${yOffset}px` } as CSSProperties}
            >
              <motion.div
                initial={skipPreviewEntrance ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.5,
                  duration: 1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={dashboardStyles.canvas}
              >
                <DashboardPreview />
              </motion.div>
            </div>
          </div>

          <TestimonialsSection />
          <FeatureCardsSection />
          <AISection />
          <PipelineSection />
          <ContentSection />
          <ReportingSection />
          <PricingSection />
          <WaitlistSection />
          <WaitlistFooter />
        </div>
      </section>
    </MotionConfig>
  );
}
