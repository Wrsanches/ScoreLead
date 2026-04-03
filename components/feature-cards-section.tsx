"use client"

import { motion } from "framer-motion"
import { ChevronRight, Plus } from "lucide-react"

const featureCards = [
  {
    title: "AI-Powered Discovery",
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="max-w-full max-h-full"
        >
          {/* Radar concentric circles */}
          <circle cx="200" cy="180" r="140" stroke="#424242" strokeWidth="1.5" opacity="0.3" />
          <circle cx="200" cy="180" r="100" stroke="#424242" strokeWidth="1.5" opacity="0.4" />
          <circle cx="200" cy="180" r="60" stroke="#424242" strokeWidth="1.5" opacity="0.5" />
          <circle cx="200" cy="180" r="20" stroke="#424242" strokeWidth="1.5" opacity="0.6" />
          {/* Cross lines */}
          <line x1="200" y1="40" x2="200" y2="320" stroke="#424242" strokeWidth="1" opacity="0.2" />
          <line x1="60" y1="180" x2="340" y2="180" stroke="#424242" strokeWidth="1" opacity="0.2" />
          {/* Radar sweep */}
          <path d="M200 180 L200 40 A140 140 0 0 1 320 110 Z" fill="url(#radarGrad)" opacity="0.4" />
          {/* Detected points */}
          <circle cx="170" cy="130" r="4" fill="#10b981" opacity="0.9" />
          <circle cx="250" cy="160" r="4" fill="#10b981" opacity="0.9" />
          <circle cx="230" cy="220" r="4" fill="#10b981" opacity="0.7" />
          <circle cx="150" cy="200" r="4" fill="#f59e0b" opacity="0.7" />
          <circle cx="280" cy="130" r="4" fill="#10b981" opacity="0.6" />
          <circle cx="140" cy="160" r="3" fill="#f59e0b" opacity="0.5" />
          <circle cx="260" cy="250" r="3" fill="#6366f1" opacity="0.5" />
          {/* Center dot */}
          <circle cx="200" cy="180" r="5" fill="#10b981" />
          <defs>
            <radialGradient id="radarGrad" cx="200" cy="180" r="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    ),
  },
  {
    title: "Smart Lead Scoring",
    illustration: (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="max-w-full max-h-full"
        >
          {/* Score bars */}
          {[
            { x: 80, h: 180, label: "Web", color: "#10b981" },
            { x: 140, h: 140, label: "Social", color: "#6366f1" },
            { x: 200, h: 200, label: "Rating", color: "#10b981" },
            { x: 260, h: 100, label: "Tech", color: "#f59e0b" },
            { x: 320, h: 160, label: "Fit", color: "#10b981" },
          ].map((bar) => (
            <g key={bar.label}>
              <rect
                x={bar.x - 16}
                y={280 - bar.h}
                width="32"
                height={bar.h}
                rx="4"
                fill={bar.color}
                opacity="0.7"
              />
              <text x={bar.x} y={300} textAnchor="middle" fill="#71717a" fontSize="11" fontFamily="system-ui">
                {bar.label}
              </text>
            </g>
          ))}
          {/* Score label */}
          <text x="200" y="40" textAnchor="middle" fill="white" fontSize="36" fontWeight="600" fontFamily="system-ui">
            4.2
          </text>
          <text x="200" y="58" textAnchor="middle" fill="#71717a" fontSize="12" fontFamily="system-ui">
            / 5.0
          </text>
        </svg>
      </div>
    ),
  },
  {
    title: "Outreach Automation",
    illustration: (
      <div className="relative w-full h-full flex items-start justify-center overflow-hidden rounded-lg px-5 pt-6">
        <div className="w-full flex flex-col gap-0">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0">
                1
              </div>
              <div className="w-px flex-1 bg-zinc-700/50" />
            </div>
            <div className="pb-3 flex-1 min-w-0">
              <p className="text-[11px] text-zinc-300 font-medium mb-0.5">Introduction</p>
              <p className="text-[10px] text-zinc-600 leading-snug">Hi, I noticed your studio offers yoga and pilates...</p>
              <span className="text-[9px] text-zinc-700 mt-1 inline-block">Day 1</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] text-amber-400 font-bold shrink-0">
                2
              </div>
              <div className="w-px flex-1 bg-zinc-700/50" />
            </div>
            <div className="pb-3 flex-1 min-w-0">
              <p className="text-[11px] text-zinc-300 font-medium mb-0.5">Follow-up</p>
              <p className="text-[10px] text-zinc-600 leading-snug">Studios like yours are saving 10+ hours a week...</p>
              <span className="text-[9px] text-zinc-700 mt-1 inline-block">Day 3</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0">
                3
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-zinc-300 font-medium mb-0.5">Value prop</p>
              <p className="text-[10px] text-zinc-600 leading-snug">With your 4.7 rating and growing demand...</p>
              <span className="text-[9px] text-zinc-700 mt-1 inline-block">Day 7</span>
            </div>
          </div>

          {/* Language tags */}
          <div className="flex gap-1.5 mt-3 ml-10">
            <span className="text-[9px] bg-blue-500/15 text-blue-400/80 px-1.5 py-0.5 rounded">EN</span>
            <span className="text-[9px] bg-zinc-800/80 text-zinc-600 px-1.5 py-0.5 rounded">ES</span>
            <span className="text-[9px] bg-zinc-800/80 text-zinc-600 px-1.5 py-0.5 rounded">PT</span>
            <span className="text-[9px] bg-zinc-800/80 text-zinc-600 px-1.5 py-0.5 rounded">FR</span>
          </div>
        </div>
      </div>
    ),
  },
]

export function FeatureCardsSection() {
  return (
    <div id="features" className="relative z-20 py-40" style={{ backgroundColor: "#09090B" }}>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-5xl">
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white max-w-md"
              style={{
                letterSpacing: "-0.0325em",
                fontVariationSettings: '"opsz" 28',
                fontWeight: 538,
                lineHeight: 1.1,
              }}
            >
              Built for teams that need more pipeline
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-md"
            >
              <p className="text-zinc-400 leading-relaxed">
                ScoreLead combines discovery, enrichment, and outreach into one system. Stop juggling spreadsheets and
                manual research - let AI handle the grunt work.{" "}
                <a href="#" className="text-white inline-flex items-center gap-1 hover:underline">
                  See all features <ChevronRight className="w-4 h-4" />
                </a>
              </p>
            </motion.div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featureCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group overflow-hidden relative flex flex-col justify-end"
                style={{
                  aspectRatio: "336 / 360",
                  borderRadius: "30px",
                  height: "360px",
                  isolation: "isolate",
                }}
              >
                <div
                  className="absolute top-0 left-0 w-full flex"
                  style={{
                    maskImage: "linear-gradient(#000 70%, transparent 90%)",
                    WebkitMaskImage: "linear-gradient(#000 70%, transparent 90%)",
                  }}
                >
                  {card.illustration}
                </div>
                <div
                  className="relative z-10 flex items-center justify-between w-full"
                  style={{ padding: "0 24px 40px", gap: "16px" }}
                >
                  <h3 className="text-white font-medium text-lg leading-tight">{card.title}</h3>
                  <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:border-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
