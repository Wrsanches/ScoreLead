"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"
import { ScoreLeadLogo } from "@/components/scorelead-logo"
import { Link } from "@/i18n/routing"
import { AnimatePresence, motion } from "framer-motion"
import { authClient } from "@/lib/auth-client"
import { AiOrb, type OrbState } from "@/components/ai-orb"
import { NeuralBackground } from "./_components/neural-background"
import { StepWelcome } from "./_components/step-welcome"
import { StepPrimaryLinks, type PrimaryLinksValues } from "./_components/step-primary-links"
import { StepMoreLinks, type MoreLinksValues } from "./_components/step-more-links"
import { StepLocation } from "./_components/step-location"
import { StepTargeting, type TargetingValues } from "./_components/step-targeting"
import { StepProcessing, type ProcessingStatus } from "./_components/step-processing"
import { StepReview, type ReviewValues } from "./_components/step-review"

type Step = "welcome" | "primaryLinks" | "moreLinks" | "location" | "targeting" | "processing" | "review"

/** All collected link data, matching the API shape. */
interface LinksData {
  website: string
  instagram: string
  facebook: string
  linkedin: string
  other: string
  location: string
}

interface BusinessProfile {
  name: string
  description: string
  persona: string
  clientPersona: string
  field: string
  category: string
  tags: string[]
}

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Not JSON — fall back to comma-separated
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean)
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const

const STEP_ORDER: Step[] = ["welcome", "primaryLinks", "moreLinks", "location", "targeting", "processing", "review"]

export default function OnboardingPage() {
  const t = useTranslations("onboarding")
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [step, setStep] = useState<Step>("welcome")
  const [direction, setDirection] = useState<1 | -1>(1)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("scraping")
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [logo, setLogo] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHydrating, setIsHydrating] = useState(true)

  // Accumulated link data across steps
  const [primaryLinks, setPrimaryLinks] = useState<PrimaryLinksValues>({
    website: "",
    instagram: "",
  })
  const [moreLinks, setMoreLinks] = useState<MoreLinksValues>({
    facebook: "",
    linkedin: "",
    other: "",
  })
  const [location, setLocation] = useState("")
  const [targeting, setTargeting] = useState<TargetingValues>({
    businessModel: "b2c",
    services: [],
    serviceArea: "local",
    competitors: [],
  })

  const userName = session?.user?.name || ""

  useEffect(() => {
    async function hydrate() {
      try {
        const res = await fetch("/api/onboarding/state")
        if (!res.ok) return

        const { business: biz } = await res.json()
        if (!biz || biz.onboardingStep === "links") return

        setPrimaryLinks({ website: biz.website, instagram: biz.instagram })
        setMoreLinks({ facebook: biz.facebook, linkedin: biz.linkedin, other: biz.other })
        setLocation(biz.location)

        if (biz.logo) setLogo(biz.logo)

        if (biz.onboardingStep === "review" && biz.name) {
          setProfile({
            name: biz.name,
            description: biz.description,
            persona: biz.persona,
            clientPersona: biz.clientPersona,
            field: biz.field,
            category: biz.category,
            tags: biz.tags ? parseTags(biz.tags) : [],
          })
          setStep("review")
        }
      } catch {
        // Non-critical — start fresh on failure
      } finally {
        setIsHydrating(false)
      }
    }

    hydrate()
  }, [])

  // Map step to orb state
  function getOrbState(): OrbState {
    switch (step) {
      case "welcome": return "idle"
      case "processing": return "processing"
      default: return "active"
    }
  }

  // Orb size changes per step
  function getOrbSize(): "sm" | "md" | "lg" {
    switch (step) {
      case "welcome": return "lg"
      case "processing": return "lg"
      default: return "sm"
    }
  }

  function goTo(target: Step) {
    const currentIdx = STEP_ORDER.indexOf(step)
    const targetIdx = STEP_ORDER.indexOf(target)
    setDirection(targetIdx > currentIdx ? 1 : -1)
    setStep(target)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // --- Step handlers ---

  function handleWelcomeContinue() {
    goTo("primaryLinks")
  }

  function handlePrimaryLinksSubmit(data: PrimaryLinksValues) {
    setPrimaryLinks(data)
    goTo("moreLinks")
  }

  function handleMoreLinksSubmit(data: MoreLinksValues) {
    setMoreLinks(data)
    goTo("location")
  }

  function handleMoreLinksSkip() {
    setMoreLinks({ facebook: "", linkedin: "", other: "" })
    goTo("location")
  }

  function handleLocationSubmit(locationValue: string) {
    setLocation(locationValue)
    goTo("targeting")
  }

  async function handleTargetingSubmit(data: TargetingValues) {
    setTargeting(data)
    setError("")

    const allLinks: LinksData = {
      website: primaryLinks.website,
      instagram: primaryLinks.instagram,
      facebook: moreLinks.facebook,
      linkedin: moreLinks.linkedin,
      other: moreLinks.other,
      location,
    }

    // Check if we have at least one URL to scrape
    const hasAnyUrl = allLinks.website || allLinks.instagram || allLinks.facebook || allLinks.linkedin || allLinks.other
    if (!hasAnyUrl) {
      setProfile(null)
      setLogo(null)
      goTo("review")
      return
    }

    goTo("processing")
    setProcessingStatus("scraping")

    const statusTimer1 = setTimeout(() => setProcessingStatus("searching"), 3000)
    const statusTimer2 = setTimeout(() => setProcessingStatus("analyzing"), 6000)

    try {
      const response = await fetch("/api/onboarding/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allLinks),
      })

      if (!response.ok) {
        const { error: apiError } = await response.json()
        throw new Error(apiError || "Failed to process")
      }

      const { profile: result, logo: fetchedLogo } = await response.json()
      setProfile(result)
      if (fetchedLogo) setLogo(fetchedLogo)
      goTo("review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      goTo("targeting")
    } finally {
      clearTimeout(statusTimer1)
      clearTimeout(statusTimer2)
    }
  }

  async function handleReviewSubmit(data: ReviewValues) {
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          website: primaryLinks.website,
          instagram: primaryLinks.instagram,
          facebook: moreLinks.facebook,
          linkedin: moreLinks.linkedin,
          other: moreLinks.other,
          logo: logo || "",
          businessModel: targeting.businessModel,
          services: JSON.stringify(targeting.services),
          serviceArea: targeting.serviceArea,
          competitors: JSON.stringify(targeting.competitors),
        }),
      })

      if (!response.ok) {
        const { error: apiError } = await response.json()
        throw new Error(apiError || "Failed to save")
      }

      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsSubmitting(false)
    }
  }

  // --- Animation variants ---
  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -40 : 40,
      opacity: 0,
    }),
  }

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden">
        <NeuralBackground />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/3 blur-[120px] pointer-events-none" />
        <div className="w-full max-w-xl relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center gap-2.5 mb-6">
              <ScoreLeadLogo className="w-8 h-8 text-white" />
              <span className="text-white font-semibold text-xl tracking-tight">ScoreLead</span>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-6 sm:p-10 shadow-2xl shadow-black/20">
            <div className="flex justify-center mb-6">
              <AiOrb state="processing" size="sm" />
            </div>
            <div className="flex flex-col items-center mb-8 space-y-2">
              <div className="h-7 w-56 rounded-lg bg-zinc-800/60 animate-pulse" />
              <div className="h-4 w-72 rounded-md bg-zinc-800/40 animate-pulse" />
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="h-4 w-20 rounded-md bg-zinc-800/40 animate-pulse" />
                <div className="h-11 w-full rounded-xl bg-zinc-800/30 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded-md bg-zinc-800/40 animate-pulse" />
                <div className="h-11 w-full rounded-xl bg-zinc-800/30 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-8">
              <div className="h-10 w-20 rounded-lg bg-zinc-800/30 animate-pulse" />
              <div className="h-10 w-28 rounded-lg bg-zinc-800/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Neural network background */}
      <NeuralBackground />

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/3 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-2.5 mb-6">
            <ScoreLeadLogo className="w-8 h-8 text-white" />
            <span className="text-white font-semibold text-xl tracking-tight">
              ScoreLead
            </span>
          </Link>

        </div>

        {/* Error banner */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step content */}
        <div className="relative">
          {step !== "welcome" && (
            <>
              {/* Top edge highlight */}
              <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-zinc-700/50 to-transparent" />
            </>
          )}

          <div
            className={
              step === "welcome"
                ? ""
                : "rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-6 sm:p-10 shadow-2xl shadow-black/20"
            }
          >
            {/* AI Orb inside card */}
            <div className="flex justify-center mb-6">
              <motion.div
                layout
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <AiOrb state={getOrbState()} size={getOrbSize()} />
              </motion.div>
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: EASE }}
              >
                {step === "welcome" && (
                  <StepWelcome
                    userName={userName}
                    onContinue={handleWelcomeContinue}
                  />
                )}

                {step === "primaryLinks" && (
                  <StepPrimaryLinks
                    defaultValues={primaryLinks}
                    onSubmit={handlePrimaryLinksSubmit}
                    onBack={() => goTo("welcome")}
                  />
                )}

                {step === "moreLinks" && (
                  <StepMoreLinks
                    defaultValues={moreLinks}
                    onSubmit={handleMoreLinksSubmit}
                    onBack={() => goTo("primaryLinks")}
                    onSkip={handleMoreLinksSkip}
                  />
                )}

                {step === "location" && (
                  <StepLocation
                    defaultLocation={location}
                    onSubmit={handleLocationSubmit}
                    onBack={() => goTo("moreLinks")}
                  />
                )}

                {step === "targeting" && (
                  <StepTargeting
                    defaultValues={targeting}
                    onSubmit={handleTargetingSubmit}
                    onBack={() => goTo("location")}
                  />
                )}

                {step === "processing" && (
                  <StepProcessing status={processingStatus} />
                )}

                {step === "review" && (
                  <StepReview
                    defaultValues={
                      profile
                        ? {
                            name: profile.name,
                            description: profile.description,
                            persona: profile.persona,
                            clientPersona: profile.clientPersona,
                            field: profile.field,
                            category: profile.category,
                            tags: Array.isArray(profile.tags)
                              ? profile.tags.join(", ")
                              : profile.tags,
                            location: location,
                          }
                        : { location }
                    }
                    logo={logo}
                    onLogoChange={setLogo}
                    onSubmit={handleReviewSubmit}
                    onBack={() => goTo("targeting")}
                    isSubmitting={isSubmitting}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
