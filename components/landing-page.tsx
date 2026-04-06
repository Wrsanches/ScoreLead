"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"

const DashboardPreview = dynamic(
  () => import("./dashboard-preview").then((m) => ({ default: m.DashboardPreview })),
  { ssr: true }
)
import { Navbar } from "./navbar"
import { CustomerStory } from "./customer-story"
import { FeatureCardsSection } from "./feature-cards-section"
import { AISection } from "./ai-section"
import { PipelineSection } from "./pipeline-section"
import { WaitlistSection } from "./waitlist-section"
import { WaitlistFooter } from "./waitlist-footer"
import { CookieConsent } from "./cookie-consent"
import { Link } from "@/i18n/routing"

export function LandingPage() {
  const t = useTranslations("hero")
  const [yOffset, setYOffset] = useState(0)
  const rafRef = useRef(0)

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const offset = Math.min(window.scrollY / 300, 1) * -20
      setYOffset(offset)
    })
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [handleScroll])

  const baseTransform = {
    translateX: 2,
    scale: 1.2,
    rotateX: 47,
    rotateY: 31,
    rotateZ: 324,
  }

  return (
    <>
      <section id="hero" className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#09090B" }}>
        <Navbar />

        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -30%)",
            width: "1200px",
            height: "800px",
            background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 pt-20 sm:pt-28 flex flex-col">
          <div className="w-full flex justify-center px-6 mt-6 sm:mt-16">
            <div className="w-full max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-5xl lg:text-[56px] font-medium text-white leading-[1.1] text-balance"
              >
                {t("heading")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 sm:mt-6 text-base sm:text-lg text-zinc-400"
              >
                {t("subtitle")}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 sm:mt-8 flex items-center gap-6 relative z-20"
              >
                <Link href="/signup" className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm">
                  {t("cta")}
                </Link>
                <a href="#features" className="text-zinc-300 font-medium hover:text-white transition-colors flex items-center gap-2 text-sm">
                  {t("secondary")}
                  <span aria-hidden="true">→</span>
                </a>
              </motion.div>
            </div>
          </div>

          <div
            className="relative"
            style={{
              width: "100vw",
              marginLeft: "-50vw",
              marginRight: "-50vw",
              position: "relative",
              left: "50%",
              right: "50%",
              height: "700px",
              marginTop: "-60px",
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-72 z-10 pointer-events-none"
              style={{
                background: "linear-gradient(to top, #09090B 20%, transparent 100%)",
              }}
            />

            <div
              style={{
                transform: `translateY(${yOffset}px)`,
                transition: "transform 0.1s ease-out",
                contain: "strict",
                perspective: "4000px",
                perspectiveOrigin: "100% 0",
                width: "100%",
                height: "100%",
                transformStyle: "preserve-3d",
                position: "relative",
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.5,
                  duration: 1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="max-sm:[margin-top:180px] sm:[margin-top:280px]"
                style={{
                  backgroundColor: "#09090B",
                  transformOrigin: "0 0",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  border: "1px solid #1e1e1e",
                  borderRadius: "10px",
                  width: "1600px",
                  height: "900px",
                  marginInline: "auto",
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  transform: `translate(${baseTransform.translateX}%) scale(${baseTransform.scale}) rotateX(${baseTransform.rotateX}deg) rotateY(${baseTransform.rotateY}deg) rotate(${baseTransform.rotateZ}deg)`,
                  transformStyle: "preserve-3d",
                  overflow: "hidden",
                }}
              >
                <DashboardPreview />
              </motion.div>
            </div>
          </div>

          <CustomerStory />
          <FeatureCardsSection />
          <AISection />
          <PipelineSection />
          <WaitlistSection />
          <WaitlistFooter />
        </div>
      </section>
      <CookieConsent />
    </>
  )
}
