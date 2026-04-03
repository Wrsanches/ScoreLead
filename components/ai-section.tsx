"use client"

import { motion } from "framer-motion"
import { ChevronRight, Globe, Mail, Phone, Users, Star, AtSign, MapPin } from "lucide-react"

const enrichmentFields = [
  { icon: Globe, label: "Website", value: "sunsetyoga.com", color: "text-blue-400" },
  { icon: Mail, label: "Email", value: "hello@sunsetyoga.com", color: "text-zinc-300" },
  { icon: Phone, label: "Phone", value: "(415) 555-0142", color: "text-zinc-300" },
  { icon: Users, label: "Team Size", value: "8 members", color: "text-zinc-300" },
  { icon: Star, label: "Rating", value: "4.7 (128 reviews)", color: "text-amber-400" },
  { icon: AtSign, label: "Social", value: "@sunsetyogasf · 2.4k", color: "text-zinc-300" },
  { icon: MapPin, label: "Location", value: "San Francisco, CA", color: "text-zinc-300" },
]

export function AISection() {
  return (
    <div id="ai" className="relative z-20 py-40" style={{ backgroundColor: "#09090B" }}>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-5xl">
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-zinc-400 text-sm">Artificial intelligence</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white max-w-3xl mb-8"
            style={{
              letterSpacing: "-0.0325em",
              fontVariationSettings: '"opsz" 28',
              fontWeight: 538,
              lineHeight: 1.1,
            }}
          >
            AI that does the research for you
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 max-w-lg mb-8"
          >
            <span className="text-white font-medium">ScoreLead AI.</span> Point it at any city or industry, and it
            discovers businesses, visits their websites, extracts structured data - emails, pricing, services, team
            members, social profiles - and scores every lead automatically.
          </motion.p>

          {/* Learn more button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="px-5 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors text-sm flex items-center gap-2 mb-16"
          >
            See AI enrichment in action
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {/* AI Enrichment Result Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center mb-24"
          >
            <div
              style={{
                perspective: "900px",
                userSelect: "none",
                WebkitUserSelect: "none",
                width: "100%",
                maxWidth: "720px",
                position: "relative",
              }}
            >
              <div
                style={{
                  transformOrigin: "top",
                  willChange: "transform",
                  transform: "translateY(0%) rotateX(30deg) scale(1.15)",
                  position: "relative",
                }}
              >
                {/* Glass overlay effect */}
                <div
                  style={{
                    border: "1px solid rgba(66, 66, 66, 0.5)",
                    background: "linear-gradient(rgba(255, 255, 255, 0.1) 40%, rgba(8, 9, 10, 0.1) 100%)",
                    borderRadius: "8px",
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    boxShadow:
                      "inset 0 1.503px 5.261px rgba(255, 255, 255, 0.04), inset 0 -0.752px 0.752px rgba(255, 255, 255, 0.1)",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />

                <div
                  style={{
                    background: "linear-gradient(180deg, transparent 0%, #09090B 100%)",
                    height: "80%",
                    position: "absolute",
                    bottom: "-2px",
                    left: "-180px",
                    right: "-180px",
                    pointerEvents: "none",
                    zIndex: 11,
                  }}
                />

                {/* Card header */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-t-xl px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-zinc-300 font-medium text-sm">AI Enrichment Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {["Maps", "Web", "AI"].map((source) => (
                      <span
                        key={source}
                        className="text-[10px] bg-zinc-700/50 text-zinc-400 px-2 py-0.5 rounded"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Enrichment fields */}
                <div className="bg-zinc-900/80 border border-t-0 border-zinc-700 rounded-b-xl py-2">
                  {enrichmentFields.map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-800/30 transition-colors"
                    >
                      <field.icon className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-500 text-sm w-20">{field.label}</span>
                      <span className={`text-sm ${field.color}`}>{field.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-5 py-3 mt-1 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">Services detected:</span>
                      {["Yoga", "Pilates", "Meditation", "Workshops"].map((s) => (
                        <span key={s} className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Confidence: 94%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom two columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left column - Smart Scoring */}
              <div className="border-t border-r border-b border-zinc-800/60 pt-12 pr-12 pb-16">
                <h3 className="text-zinc-200 font-medium text-xl mb-3">Smart Scoring Engine</h3>
                <p className="text-zinc-500 text-base mb-8">
                  Our AI analyzes every lead across multiple dimensions - online presence, reputation, market fit,
                  engagement potential, and readiness to buy - then distills it into one clear score.
                </p>

                {/* Scoring breakdown card */}
                <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-zinc-300 text-sm font-medium">Sunset Yoga Studio</span>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400 font-bold text-xl">4.5</span>
                      <span className="text-zinc-500 text-xs">/5</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Online Reach", value: 5, color: "bg-emerald-500" },
                      { label: "Trustworthiness", value: 4, color: "bg-emerald-500" },
                      { label: "Market Fit", value: 5, color: "bg-emerald-500" },
                      { label: "Engagement", value: 4, color: "bg-blue-500" },
                      { label: "Readiness", value: 3, color: "bg-amber-500" },
                    ].map((signal) => (
                      <div key={signal.label} className="flex items-center gap-3">
                        <span className="text-zinc-500 text-xs w-28">{signal.label}</span>
                        <div className="flex-1 flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 flex-1 rounded-sm ${i < signal.value ? signal.color : "bg-zinc-800"}`}
                            />
                          ))}
                        </div>
                        <span className="text-zinc-400 text-xs w-6 text-right">{signal.value}/5</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">High opportunity</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Open market</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Growing demand</span>
                  </div>
                </div>
              </div>

              {/* Right column - Automated Outreach */}
              <div className="border-t border-b border-zinc-800/60 pt-12 pl-12 pb-16">
                <h3 className="text-zinc-200 font-medium text-xl mb-3">Automated Outreach</h3>
                <p className="text-zinc-500 text-base mb-8">
                  AI generates personalized multi-step outreach sequences in multiple languages. Each message references
                  the lead&#39;s specific business details.
                </p>

                {/* Email sequence preview */}
                <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-5 font-mono text-sm">
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">1</div>
                        <span className="text-zinc-400 text-xs">Introduction · Day 1</span>
                      </div>
                      <div className="bg-zinc-800/40 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">Subject: <span className="text-zinc-300">Loved what I saw at Sunset Yoga Studio</span></p>
                        <p className="text-zinc-600 text-xs">Hi, I noticed your studio offers yoga, pilates, and meditation classes in SF...</p>
                      </div>
                    </div>

                    {/* Connector */}
                    <div className="flex items-center gap-2 pl-2.5">
                      <div className="w-px h-4 bg-zinc-700" />
                    </div>

                    {/* Step 2 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-400 font-bold">2</div>
                        <span className="text-zinc-400 text-xs">Follow-up · Day 3</span>
                      </div>
                      <div className="bg-zinc-800/40 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">Subject: <span className="text-zinc-300">Quick follow-up</span></p>
                        <p className="text-zinc-600 text-xs">Just wanted to share how studios like yours are saving 10+ hours/week...</p>
                      </div>
                    </div>

                    {/* Connector */}
                    <div className="flex items-center gap-2 pl-2.5">
                      <div className="w-px h-4 bg-zinc-700" />
                    </div>

                    {/* Step 3 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold">3</div>
                        <span className="text-zinc-400 text-xs">Value prop · Day 7</span>
                      </div>
                      <div className="bg-zinc-800/40 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">Subject: <span className="text-zinc-300">Your 128 five-star reviews say it all</span></p>
                        <p className="text-zinc-600 text-xs">With your 4.7 rating and growing waitlist, here&#39;s how we can help scale...</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center gap-3">
                    {["EN", "ES", "PT", "FR", "DE", "+12"].map((lang) => (
                      <span
                        key={lang}
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          lang === "EN" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
