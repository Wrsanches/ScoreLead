"use client"

import { ChevronRight, Radar, BarChart3, FileDown, Languages } from "lucide-react"

export function ProductDirectionSection() {
  return (
    <section id="pipeline" className="relative py-40 px-6 md:px-12 lg:px-24">
      {/* Gradient overlay at top */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-zinc-400 text-sm">Workflow and pipeline</span>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </div>

        {/* Section heading */}
        <h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium text-white mb-8 max-w-3xl"
          style={{
            letterSpacing: "-0.0325em",
            fontVariationSettings: '"opsz" 28',
            fontWeight: 538,
            lineHeight: 1.1,
          }}
        >
          From discovery to conversion
        </h2>

        {/* Description */}
        <p className="text-zinc-400 text-lg max-w-md mb-16">
          <span className="text-white font-medium">Visualize your entire pipeline.</span> Track every lead from first
          discovery through enrichment, scoring, outreach, and conversion - all in one place.
        </p>

        {/* 3D Pipeline Visualization */}
        <div
          className="relative w-full mb-16"
          style={{
            perspective: "1200px",
          }}
        >
          <div
            className="relative"
            style={{
              transform: "rotateX(50deg) rotateZ(-35deg)",
              transformStyle: "preserve-3d",
              transformOrigin: "center center",
            }}
          >
            <div className="relative h-[400px]">
              {/* Diagonal dashed line */}
              <div
                className="absolute w-[1px] bg-zinc-600/50"
                style={{
                  height: "600px",
                  left: "55%",
                  top: "-100px",
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent, transparent 4px, rgba(113, 113, 122, 0.5) 4px, rgba(113, 113, 122, 0.5) 8px)",
                }}
              />

              {/* Timeline header with tick marks */}
              <div className="absolute top-0 left-0 right-0 flex items-end">
                <div className="flex items-end gap-[3px] absolute bottom-0 left-[5%] right-0">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-zinc-600/60"
                      style={{
                        width: "1px",
                        height: i % 7 === 0 ? "16px" : "8px",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Stage labels */}
              <div className="absolute text-zinc-500 text-sm" style={{ left: "5%", top: "55px" }}>
                Discovery
              </div>
              <div className="absolute text-zinc-500 text-sm" style={{ left: "20%", top: "35px" }}>
                Enrichment
              </div>
              <div
                className="absolute px-3 py-1 rounded-md bg-zinc-700/80 text-zinc-300 text-sm font-medium"
                style={{ left: "42%", top: "15px" }}
              >
                Scored
              </div>
              <div className="absolute text-zinc-500 text-sm" style={{ left: "62%", top: "-5px" }}>
                Outreach
              </div>
              <div className="absolute text-zinc-500/50 text-sm" style={{ left: "82%", top: "-25px" }}>
                Converted
              </div>

              {/* Pipeline stage bars */}
              {/* Discovery bar */}
              <div
                className="absolute rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 flex items-center justify-between"
                style={{
                  left: "5%",
                  top: "100px",
                  width: "55%",
                  height: "48px",
                }}
              >
                <span className="text-emerald-400 text-sm font-medium">Discovered</span>
                <span className="text-emerald-400/70 text-sm font-mono">2,450</span>
              </div>

              {/* Enriched bar */}
              <div
                className="absolute rounded-lg bg-blue-500/15 border border-blue-500/30 px-4 py-3 flex items-center justify-between"
                style={{
                  left: "15%",
                  top: "155px",
                  width: "45%",
                  height: "44px",
                }}
              >
                <span className="text-blue-400 text-sm">Enriched</span>
                <span className="text-blue-400/70 text-sm font-mono">1,830</span>
              </div>

              {/* Scored bar */}
              <div
                className="absolute rounded-lg bg-amber-500/15 border border-amber-500/30 px-4 py-3 flex items-center justify-between"
                style={{
                  left: "30%",
                  top: "210px",
                  width: "35%",
                  height: "44px",
                }}
              >
                <span className="text-amber-400 text-sm">Scored 3+</span>
                <span className="text-amber-400/70 text-sm font-mono">1,240</span>
              </div>

              {/* Outreach bar */}
              <div
                className="absolute rounded-lg bg-purple-500/15 border border-purple-500/30 px-4 py-3 flex items-center justify-between"
                style={{
                  left: "45%",
                  top: "265px",
                  width: "25%",
                  height: "44px",
                }}
              >
                <span className="text-purple-400 text-sm">Outreach Sent</span>
                <span className="text-purple-400/70 text-sm font-mono">680</span>
              </div>

              {/* Converted bar */}
              <div
                className="absolute rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-4 py-3 flex items-center justify-between"
                style={{
                  left: "58%",
                  top: "320px",
                  width: "18%",
                  height: "44px",
                }}
              >
                <span className="text-emerald-300 text-sm font-medium">Customers</span>
                <span className="text-emerald-300/70 text-sm font-mono">180</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom two-column section */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left column - Discovery Jobs */}
          <div className="border-t border-r border-b border-zinc-800 pt-10 pr-10 pb-16">
            <h3 className="text-xl font-medium text-zinc-200 mb-3">Discovery Jobs</h3>
            <p className="text-zinc-500 text-base leading-relaxed mb-8">
              Launch async discovery jobs by country, state, or city. Track progress in real time as ScoreLead scans
              multiple data sources across the web.
            </p>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-zinc-200">San Francisco, CA - Yoga Studios</h4>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">In Progress</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-zinc-800 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "73%" }} />
              </div>
              <span className="text-zinc-500 text-xs">73% complete</span>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800/50">
                <div>
                  <p className="text-zinc-200 font-mono text-lg">142</p>
                  <p className="text-zinc-500 text-[10px]">Found</p>
                </div>
                <div>
                  <p className="text-zinc-200 font-mono text-lg">104</p>
                  <p className="text-zinc-500 text-[10px]">Enriched</p>
                </div>
                <div>
                  <p className="text-zinc-200 font-mono text-lg">98</p>
                  <p className="text-zinc-500 text-[10px]">Scored</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Deduplication */}
          <div className="border-t border-b border-zinc-800 pt-10 pl-10 pb-16">
            <h3 className="text-xl font-medium text-zinc-200 mb-3">Deduplication & Data Quality</h3>
            <p className="text-zinc-500 text-base leading-relaxed mb-8">
              Smart identity matching ensures no duplicate leads. Our AI cross-references multiple data points to
              merge duplicates automatically.
            </p>

            <div className="relative h-48">
              {/* Duplicate card (back) */}
              <div
                className="absolute rounded-lg bg-zinc-800/40 border border-red-500/20 px-4 py-3"
                style={{ top: 0, left: "10%", width: "80%" }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-zinc-500 text-sm">Sunset Yoga SF</span>
                  <span className="text-zinc-600 text-xs ml-auto">sunsetyoga.com</span>
                </div>
              </div>

              {/* Duplicate card (middle) */}
              <div
                className="absolute rounded-lg bg-zinc-800/60 border border-amber-500/20 px-4 py-3"
                style={{ top: "35px", left: "5%", width: "85%" }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-zinc-400 text-sm">Sunset Yoga Studio</span>
                  <span className="text-zinc-600 text-xs ml-auto">sunsetyoga.com</span>
                </div>
              </div>

              {/* Merged card (front) */}
              <div
                className="absolute rounded-xl bg-zinc-800/90 border border-emerald-500/30 px-5 py-4"
                style={{ top: "75px", left: 0, width: "95%" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  </span>
                  <span className="text-emerald-400 font-medium text-sm">Merged</span>
                </div>
                <p className="text-zinc-300 text-sm mb-2">Sunset Yoga Studio</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="bg-zinc-700/50 text-zinc-400 px-1.5 py-0.5 rounded">Same website</span>
                  <span className="bg-zinc-700/50 text-zinc-400 px-1.5 py-0.5 rounded">Similar name</span>
                  <span className="bg-zinc-700/50 text-zinc-400 px-1.5 py-0.5 rounded">Same location</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radar className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-200 font-medium">Discovery Jobs</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">Async discovery by geography with progress tracking.</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-200 font-medium">AI Scoring</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">Intelligent scoring across multiple dimensions to prioritize the best leads.</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileDown className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-200 font-medium">CSV Export</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">Export filtered leads with all enriched data.</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-200 font-medium">Multi-language</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">AI outreach in multiple languages to reach leads anywhere in the world.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
